import { TutorialStep } from "@/context/TutorialContext";

/**
 * The guided home tour. Targets element IDs rendered on the student dashboard
 * (`/dashboard`), so callers on other pages should navigate there before
 * starting it. Shared between the dashboard and the Help Center.
 */
export const homeTourSteps: TutorialStep[] = [
  {
    target: "#t-welcome",
    title: "Welcome to SMART LABS!",
    content:
      "This is your home page. Everything you need — classes, recordings, resources — starts from here. Use Next to see how each part works.",
  },
  {
    target: "#t-enter-lms",
    title: "Enter the LMS",
    content:
      "This button opens your classroom hub, where live classes, recordings, resources, timetable, assignments and exams all live together.",
  },
  {
    target: "#t-menu",
    title: "Quick Actions",
    content: "These tiles are your shortcuts to the most-used pages. We'll walk through the important ones next.",
  },
  {
    target: "#t-action-courses",
    title: "How to enroll in a course",
    content: "New students start here. Enrolling unlocks your classes, recordings and resources.",
    list: [
      "Tap the Courses tile to open the course catalogue.",
      "Open a course to read what it covers, then tap Enroll.",
      "Pick your batch / time slot when asked.",
      "Choose to pay by card (secure checkout) or bank transfer.",
      "Once payment is approved, the course appears under your Courses — classes unlock automatically.",
    ],
  },
  {
    target: "#t-action-recordings",
    title: "How to watch recordings",
    content: "Missed a class or want to revise? Every session is recorded for you.",
    list: [
      "Tap the Recordings tile (also in the LMS as “Watch Replays”).",
      "Recordings are grouped by course and date — pick the class you want.",
      "Tap the video to play. You can pause, rewind and change quality.",
      "Watch important ones early — some recordings expire after a set number of days.",
    ],
  },
  {
    target: "#t-action-resources",
    title: "How to access & view resources",
    content: "Notes, PDFs and study materials for your courses live here.",
    list: [
      "Tap the Resources tile to open your study materials.",
      "Files are organised by course and topic — use the search box to find one fast.",
      "Tap a file to preview it right in your browser.",
      "Use the download icon to save it to your device for offline study.",
    ],
  },
  {
    target: "#t-action-timetable",
    title: "Check your class schedule",
    content:
      "Your weekly timetable shows every class for your enrolled batches — check it at the start of each week.",
  },
  {
    target: "#t-upcoming-student",
    title: "Your next classes",
    content: "Your upcoming live sessions appear here with a Join button when it's time. You'll never miss a class.",
  },
  {
    target: "#t-stats-student",
    title: "Track your progress",
    content: "Your study hours, lessons completed and course progress are summarised here to keep you motivated.",
  },
  {
    target: "#t-help-link",
    title: "Need help later?",
    content:
      "Open the Help Center any time for step-by-step guides on every page. You can replay this tour from here too.",
  },
];
