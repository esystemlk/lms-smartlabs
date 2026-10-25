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

const ROSTER_PAGE_SIZE = 500;

export async function getCourseRoster(
  courseId: string,
  options: { batchId?: string; status?: string; cursor?: string } = {}
) {
  const courseSnap = await db().collection(COURSES_COLLECTION).doc(courseId).get();
  if (!courseSnap.exists) throw new Error("Course not found");

  let q: FirebaseFirestore.Query = db()
    .collection(ENROLLMENTS_COLLECTION)
    .where("courseId", "==", courseId)
    .where("status", "==", options.status || "active")
    .orderBy("enrolledAt", "desc");

  if (options.batchId) {
    q = q.where("batchId", "==", options.batchId);
  }

  if (options.cursor) {
    const cursorSnap = await db().collection(ENROLLMENTS_COLLECTION).doc(options.cursor).get();
    if (cursorSnap.exists) {
      q = q.startAfter(cursorSnap);
    }
  }

  const enrollmentsSnap = await q.limit(ROSTER_PAGE_SIZE).get();

  const userIds = [...new Set(enrollmentsSnap.docs.map((d) => d.data().userId as string))];
  const userDocs = await Promise.all(userIds.map((id) => db().collection(USERS_COLLECTION).doc(id).get()));
  const usersMap = new Map(userDocs.filter((u) => u.exists).map((u) => [u.id, u.data()!]));

  const students = enrollmentsSnap.docs.map((d) => {
    const e = d.data();
    const user = usersMap.get(e.userId);
    return {
      name: user?.name || e.userName || null,
      email: user?.email || e.userEmail || null,
      contact: user?.contact || null,
      batchId: e.batchId,
      batchName: e.batchName,
      enrollmentStatus: e.status,
      enrolledAt: e.enrolledAt?.toDate ? e.enrolledAt.toDate().toISOString() : null,
    };
  });

  const lastDoc = enrollmentsSnap.docs[enrollmentsSnap.docs.length - 1];
  return {
    course: { id: courseSnap.id, title: courseSnap.data()!.title },
    students,
    count: students.length,
    nextCursor: enrollmentsSnap.docs.length === ROSTER_PAGE_SIZE && lastDoc ? lastDoc.id : null,
  };
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

async function mapStudents(docs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  if (docs.length === 0) return [];

  // activeEnrollments carries each student's enrollment DOC id (not just the
  // bare courseId/batchId already on the user doc), so a caller like a batch
  // transfer can target remove() at a specific enrollment.
  const studentIds = docs.map((d) => d.id);
  const enrollmentsSnap = await db()
    .collection(ENROLLMENTS_COLLECTION)
    .where("userId", "in", studentIds.slice(0, 30))
    .where("status", "==", "active")
    .get();

  const activeByUser = new Map<string, Array<{ enrollmentId: string; courseId: string; batchId: string; status: string }>>();
  enrollmentsSnap.docs.forEach((e) => {
    const data = e.data();
    const list = activeByUser.get(data.userId) || [];
    list.push({ enrollmentId: e.id, courseId: data.courseId, batchId: data.batchId, status: data.status });
    activeByUser.set(data.userId, list);
  });

  return docs.map((d) => ({
    id: d.id,
    name: d.data().name,
    email: d.data().email,
    contact: d.data().contact || null,
    enrolledCourses: d.data().enrolledCourses || [],
    enrolledBatches: d.data().enrolledBatches || [],
    activeEnrollments: activeByUser.get(d.id) || [],
  }));
}

export async function getPendingEnrollments() {
  // "in" also catches pending_payment (PayHere enrollments awaiting payment),
  // which the plain "pending" status misses — see the LEO remaining-fixes spec.
  const snap = await db()
    .collection(ENROLLMENTS_COLLECTION)
    .where("status", "in", ["pending", "pending_payment"])
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

export async function transferEnrollment(
  studentId: string,
  fromCourseId: string,
  toCourseId: string,
  toBatchId: string,
  adminPhoneNumber?: string
) {
  const [userSnap, oldEnrollmentQuery, toCourseSnap, toBatchSnap] = await Promise.all([
    db().collection(USERS_COLLECTION).doc(studentId).get(),
    db()
      .collection(ENROLLMENTS_COLLECTION)
      .where("userId", "==", studentId)
      .where("courseId", "==", fromCourseId)
      .where("status", "==", "active")
      .limit(1)
      .get(),
    db().collection(COURSES_COLLECTION).doc(toCourseId).get(),
    db().collection(COURSES_COLLECTION).doc(toCourseId).collection(BATCHES_COLLECTION).doc(toBatchId).get(),
  ]);

  if (!userSnap.exists) throw new Error("Student not found");
  if (oldEnrollmentQuery.empty) throw new Error("Student has no active enrollment in the source course");
  if (!toCourseSnap.exists) throw new Error("Destination course not found");
  if (!toBatchSnap.exists) throw new Error("Destination batch not found");

  const oldEnrollmentDoc = oldEnrollmentQuery.docs[0];
  const oldEnrollment = oldEnrollmentDoc.data();

  const alreadyInTarget = await db()
    .collection(ENROLLMENTS_COLLECTION)
    .where("userId", "==", studentId)
    .where("batchId", "==", toBatchId)
    .where("status", "==", "active")
    .limit(1)
    .get();
  if (!alreadyInTarget.empty) {
    throw new Error("Student already has an active enrollment in the destination batch");
  }

  const toCourse = toCourseSnap.data()!;
  const toBatchData = toBatchSnap.data()!;
  const user = userSnap.data()!;
  const validUntil = computeValidUntil(toCourse);

  const newEnrollmentRef = db().collection(ENROLLMENTS_COLLECTION).doc();
  const batchOp = db().batch();
  const userRef = db().collection(USERS_COLLECTION).doc(studentId);

  // 1. Ban the old enrollment (reversible — same as removeEnrollment's default).
  batchOp.update(oldEnrollmentDoc.ref, { status: "banned", updatedAt: FieldValue.serverTimestamp() });

  const oldBatchRef = db()
    .collection(COURSES_COLLECTION)
    .doc(oldEnrollment.courseId)
    .collection(BATCHES_COLLECTION)
    .doc(oldEnrollment.batchId);
  const oldBatchSnap = await oldBatchRef.get();
  if (oldBatchSnap.exists) {
    batchOp.update(oldBatchRef, { enrolledCount: FieldValue.increment(-1) });
  }

  // 2. Grant the new enrollment.
  batchOp.set(newEnrollmentRef, {
    userId: studentId,
    userEmail: user.email,
    userName: user.name,
    courseId: toCourseId,
    courseTitle: toCourse.title,
    batchId: toBatchId,
    batchName: toBatchData.name,
    status: "active",
    paymentMethod: "admin",
    amount: 0,
    validUntil,
    enrolledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const toBatchRef = db().collection(COURSES_COLLECTION).doc(toCourseId).collection(BATCHES_COLLECTION).doc(toBatchId);
  batchOp.update(toBatchRef, { enrolledCount: FieldValue.increment(1) });

  // 3. Update the user's enrolled-course/batch arrays: drop the old, add the new.
  const existingCourses: string[] = (user.enrolledCourses || []).filter((id: string) => id !== oldEnrollment.courseId);
  const existingBatches: string[] = (user.enrolledBatches || []).filter((id: string) => id !== oldEnrollment.batchId);
  batchOp.update(userRef, {
    enrolledCourses: [...new Set([...existingCourses, toCourseId])],
    enrolledBatches: [...new Set([...existingBatches, toBatchId])],
  });

  await batchOp.commit();

  await logLeoActivity(
    "enrollment_transferred",
    `Transferred via WhatsApp (LEO) by ${adminPhoneNumber || "unknown admin"}: ${oldEnrollment.courseTitle} → ${toCourse.title}`,
    { id: newEnrollmentRef.id, type: "enrollment" },
    adminPhoneNumber
  );

  const created = await newEnrollmentRef.get();
  return { id: newEnrollmentRef.id, fromEnrollmentId: oldEnrollmentDoc.id, ...created.data() };
}
