import { addMonths, parseISO, isBefore } from "date-fns";
import { getAdminApp } from "@/lib/firebaseAdmin";
import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";

const ENROLLMENTS_COLLECTION = "enrollments";
const USERS_COLLECTION = "users";
const COURSES_COLLECTION = "courses";
const BATCHES_COLLECTION = "batches";

function db() {
  return getFirestore(getAdminApp());
}

async function logLeoActivity(
  action: string,
  details: string,
  entity: { id: string; type: "enrollment" },
  adminPhoneNumber?: string
) {
  await db()
    .collection("activity_logs")
    .add({
      action,
      details,
      entityId: entity.id,
      entityType: entity.type,
      performedBy: "leo-whatsapp-bridge",
      performedByName: "LEO (WhatsApp)",
      performedByRole: "service",
      createdAt: FieldValue.serverTimestamp(),
      metadata: { adminPhoneNumber: adminPhoneNumber || null },
    })
    .catch((error) => console.error("Failed to write LEO activity log:", error));
}

function computeValidUntil(course: FirebaseFirestore.DocumentData | undefined): Timestamp | null {
  let expiryDate: Date | null = null;

  if (course?.resourceAvailabilityMonths) {
    expiryDate = addMonths(new Date(), course.resourceAvailabilityMonths);
  }
  if (course?.endDate) {
    const courseEndDate = parseISO(course.endDate);
    if (!expiryDate || isBefore(courseEndDate, expiryDate)) {
      expiryDate = courseEndDate;
    }
  }
  return expiryDate ? Timestamp.fromDate(expiryDate) : null;
}

export async function listPublishedCoursesWithBatches() {
  const coursesSnap = await db().collection(COURSES_COLLECTION).where("published", "==", true).get();

  const courses = await Promise.all(
    coursesSnap.docs.map(async (courseDoc) => {
      const batchesSnap = await courseDoc.ref.collection(BATCHES_COLLECTION).get();
      return {
        id: courseDoc.id,
        title: courseDoc.data().title,
        category: courseDoc.data().category || null,
        batches: batchesSnap.docs.map((b) => ({
          id: b.id,
          name: b.data().name,
          status: b.data().status,
          enrolledCount: b.data().enrolledCount || 0,
          maxStudents: b.data().maxStudents ?? null,
        })),
      };
    })
  );

  return courses;
}

export async function findStudents(q: string) {
  const usersRef = db().collection(USERS_COLLECTION);

  // 1. Exact email match
  const byEmail = await usersRef.where("email", "==", q).limit(5).get();
  if (!byEmail.empty) return mapStudents(byEmail.docs);

  // 2. Exact phone match (contact field is free-text/unvalidated today)
  const byContact = await usersRef.where("contact", "==", q).limit(5).get();
  if (!byContact.empty) return mapStudents(byContact.docs);

  // 3. Name search — fetch students and filter case-insensitively client-side
  // (Firestore has no native case-insensitive "contains" query).
  const qLower = q.toLowerCase();
  const studentsSnap = await usersRef.where("role", "==", "student").get();
  const matches = studentsSnap.docs.filter((d) => (d.data().name || "").toLowerCase().includes(qLower));
  return mapStudents(matches.slice(0, 10));
}

function mapStudents(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  return docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    email: d.data().email,
    contact: d.data().contact || null,
    enrolledCourses: d.data().enrolledCourses || [],
    enrolledBatches: d.data().enrolledBatches || [],
  }));
}

export async function getPendingEnrollments() {
  const snap = await db()
    .collection(ENROLLMENTS_COLLECTION)
    .where("status", "==", "pending")
    .orderBy("enrolledAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function approveEnrollment(enrollmentId: string, adminPhoneNumber?: string) {
  const enrollmentRef = db().collection(ENROLLMENTS_COLLECTION).doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists) throw new Error("Enrollment not found");
  const enrollment = enrollmentSnap.data()!;

  if (enrollment.status === "active") {
    return { id: enrollmentId, ...enrollment };
  }

  const courseSnap = await db().collection(COURSES_COLLECTION).doc(enrollment.courseId).get();
  const validUntil = computeValidUntil(courseSnap.data());

  const batch = db().batch();
  batch.update(enrollmentRef, { status: "active", validUntil, updatedAt: FieldValue.serverTimestamp() });

  const userRef = db().collection(USERS_COLLECTION).doc(enrollment.userId);
  batch.update(userRef, {
    enrolledBatches: FieldValue.arrayUnion(enrollment.batchId),
    enrolledCourses: FieldValue.arrayUnion(enrollment.courseId),
  });

  const batchRef = db()
    .collection(COURSES_COLLECTION)
    .doc(enrollment.courseId)
    .collection(BATCHES_COLLECTION)
    .doc(enrollment.batchId);
  const batchSnap = await batchRef.get();
  if (batchSnap.exists) {
    batch.update(batchRef, { enrolledCount: FieldValue.increment(1) });
  }

  await batch.commit();

  await logLeoActivity(
    "enrollment_approved",
    `Approved via WhatsApp (LEO) by ${adminPhoneNumber || "unknown admin"}`,
    { id: enrollmentId, type: "enrollment" },
    adminPhoneNumber
  );

  const updated = await enrollmentRef.get();
  return { id: enrollmentId, ...updated.data() };
}

export async function rejectEnrollment(enrollmentId: string, adminPhoneNumber?: string, reason?: string) {
  const enrollmentRef = db().collection(ENROLLMENTS_COLLECTION).doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists) throw new Error("Enrollment not found");

  await enrollmentRef.update({ status: "rejected", updatedAt: FieldValue.serverTimestamp() });

  await logLeoActivity(
    "enrollment_rejected",
    `Rejected via WhatsApp (LEO) by ${adminPhoneNumber || "unknown admin"}${reason ? `: ${reason}` : ""}`,
    { id: enrollmentId, type: "enrollment" },
    adminPhoneNumber
  );

  const updated = await enrollmentRef.get();
  return { id: enrollmentId, ...updated.data() };
}

export async function grantEnrollment(
  studentId: string,
  courseId: string,
  batchId: string,
  adminPhoneNumber?: string
) {
  const [userSnap, courseSnap, batchSnap] = await Promise.all([
    db().collection(USERS_COLLECTION).doc(studentId).get(),
    db().collection(COURSES_COLLECTION).doc(courseId).get(),
    db().collection(COURSES_COLLECTION).doc(courseId).collection(BATCHES_COLLECTION).doc(batchId).get(),
  ]);

  if (!userSnap.exists) throw new Error("Student not found");
  if (!courseSnap.exists) throw new Error("Course not found");
  if (!batchSnap.exists) throw new Error("Batch not found");

  const existing = await db()
    .collection(ENROLLMENTS_COLLECTION)
    .where("userId", "==", studentId)
    .where("batchId", "==", batchId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (!existing.empty) {
    throw new Error("Student already has an active enrollment in this batch");
  }

  const course = courseSnap.data()!;
  const batchData = batchSnap.data()!;
  const user = userSnap.data()!;
  const validUntil = computeValidUntil(course);

  const enrollmentRef = db().collection(ENROLLMENTS_COLLECTION).doc();
  const batchOp = db().batch();

  batchOp.set(enrollmentRef, {
    userId: studentId,
    userEmail: user.email,
    userName: user.name,
    courseId,
    courseTitle: course.title,
    batchId,
    batchName: batchData.name,
    status: "active",
    paymentMethod: "admin",
    amount: 0,
    validUntil,
    enrolledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const userRef = db().collection(USERS_COLLECTION).doc(studentId);
  batchOp.update(userRef, {
    enrolledBatches: FieldValue.arrayUnion(batchId),
    enrolledCourses: FieldValue.arrayUnion(courseId),
  });

  const batchRef = db().collection(COURSES_COLLECTION).doc(courseId).collection(BATCHES_COLLECTION).doc(batchId);
  batchOp.update(batchRef, { enrolledCount: FieldValue.increment(1) });

  await batchOp.commit();

  await logLeoActivity(
    "enrollment_created",
    `Granted via WhatsApp (LEO) by ${adminPhoneNumber || "unknown admin"}`,
    { id: enrollmentRef.id, type: "enrollment" },
    adminPhoneNumber
  );

  const created = await enrollmentRef.get();
  return { id: enrollmentRef.id, ...created.data() };
}

export async function removeEnrollment(enrollmentId: string, hard: boolean, adminPhoneNumber?: string) {
  const enrollmentRef = db().collection(ENROLLMENTS_COLLECTION).doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (!enrollmentSnap.exists) throw new Error("Enrollment not found");
  const data = enrollmentSnap.data()!;

  const batchOp = db().batch();

  if (hard) {
    // Mirrors enrollmentService.deleteEnrollment: full removal + count rollback.
    if (["active", "completed"].includes(data.status)) {
      const userRef = db().collection(USERS_COLLECTION).doc(data.userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data()!;
        batchOp.update(userRef, {
          enrolledCourses: (userData.enrolledCourses || []).filter((id: string) => id !== data.courseId),
          enrolledBatches: (userData.enrolledBatches || []).filter((id: string) => id !== data.batchId),
        });
      }

      const batchRef = db()
        .collection(COURSES_COLLECTION)
        .doc(data.courseId)
        .collection(BATCHES_COLLECTION)
        .doc(data.batchId);
      const batchSnap = await batchRef.get();
      if (batchSnap.exists) {
        batchOp.update(batchRef, { enrolledCount: FieldValue.increment(-1) });
      }
    }
    batchOp.delete(enrollmentRef);
  } else {
    // Reversible default: ban keeps the record (payment/progress history) but blocks access.
    if (["active", "completed"].includes(data.status)) {
      const userRef = db().collection(USERS_COLLECTION).doc(data.userId);
      const userSnap = await userRef.get();
      if (userSnap.exists) {
        const userData = userSnap.data()!;
        batchOp.update(userRef, {
          enrolledCourses: (userData.enrolledCourses || []).filter((id: string) => id !== data.courseId),
          enrolledBatches: (userData.enrolledBatches || []).filter((id: string) => id !== data.batchId),
        });
      }

      const batchRef = db()
        .collection(COURSES_COLLECTION)
        .doc(data.courseId)
        .collection(BATCHES_COLLECTION)
        .doc(data.batchId);
      const batchSnap = await batchRef.get();
      if (batchSnap.exists) {
        batchOp.update(batchRef, { enrolledCount: FieldValue.increment(-1) });
      }
    }
    batchOp.update(enrollmentRef, { status: "banned", updatedAt: FieldValue.serverTimestamp() });
  }

  await batchOp.commit();

  await logLeoActivity(
    "enrollment_removed",
    `${hard ? "Deleted" : "Banned"} via WhatsApp (LEO) by ${adminPhoneNumber || "unknown admin"}`,
    { id: enrollmentId, type: "enrollment" },
    adminPhoneNumber
  );

  if (hard) {
    return { id: enrollmentId, deleted: true };
  }
  const updated = await enrollmentRef.get();
  return { id: enrollmentId, ...updated.data() };
}
