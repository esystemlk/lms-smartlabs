import type { Enrollment, Lesson, UserData } from "@/lib/types";

/**
 * Live classes a student may see: they must have an active enrollment in the
 * class's course (or a binded course), be in one of its batches, and — when the
 * class is restricted to time slots — be in a matching slot.
 * Staff see every class unchanged.
 */
export function filterClassesForUser(upcoming: Lesson[], enrollments: Enrollment[], userData: UserData): Lesson[] {
  if (userData.role !== "student") return upcoming;

  const active = enrollments.filter((e) => e.status === "active" || e.status === "completed");
  const enrollmentBatchIds = active.map((e) => e.batchId).filter(Boolean) as string[];
  const userBatches = Array.from(new Set([...enrollmentBatchIds, ...(userData.enrolledBatches || [])]));
  if (userBatches.length === 0) return [];

  const batchTimeSlots = new Map<string, string>();
  active.forEach((e) => {
    if (e.batchId && e.timeSlotId) batchTimeSlots.set(e.batchId, e.timeSlotId);
  });
  const userCourseIds = active.map((e) => e.courseId);

  return upcoming.filter((cls) => {
    const hasPrimary = cls.courseId && userCourseIds.includes(cls.courseId);
    const hasBinded = cls.bindedCourseIds && cls.bindedCourseIds.some((id) => userCourseIds.includes(id));
    if (!hasPrimary && !hasBinded) return false;

    if (!cls.batchIds || cls.batchIds.length === 0) return false;
    const matching = cls.batchIds.filter((id) => userBatches.includes(id));
    if (matching.length === 0) return false;

    if (cls.timeSlotId || (cls.bindedTimeSlotIds && cls.bindedTimeSlotIds.length > 0)) {
      return matching.some((bid) => {
        const slot = batchTimeSlots.get(bid);
        if (!slot) return false;
        return slot === cls.timeSlotId || (cls.bindedTimeSlotIds && cls.bindedTimeSlotIds.includes(slot));
      });
    }
    return true;
  });
}
