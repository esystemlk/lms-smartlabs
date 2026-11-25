import type { Icon } from "@phosphor-icons/react";
import {
  House,
  Books,
  VideoCamera,
  PlayCircle,
  ClipboardText,
  Exam,
  Target,
  CalendarBlank,
  FolderOpen,
  TextAa,
  ChatsCircle,
  UsersThree,
  Lifebuoy,
  SquaresFour,
  Student,
  UserGear,
  Receipt,
  CalendarPlus,
  FilmStrip,
  Television,
  ChartBar,
  ListChecks,
  Megaphone,
  Headset,
  GearSix,
  ShieldWarning,
  BookOpenText,
  DotsThreeOutline,
  MonitorPlay,
  ShoppingBag,
} from "@phosphor-icons/react";

export type Role = "student" | "lecturer" | "admin" | "superadmin" | "developer";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  roles?: Role[]; // omitted = everyone who can see the section
  pte?: boolean; // only shown when the server confirms PTE training access
}

export interface NavSection {
  label?: string;
  items: NavItem[];
}

export const ADMIN_ROLES: Role[] = ["admin", "superadmin", "developer"];
export const STAFF_ROLES: Role[] = ["lecturer", ...ADMIN_ROLES];

export const isAdminRole = (role?: string) => ADMIN_ROLES.includes(role as Role);
export const isStaffRole = (role?: string) => STAFF_ROLES.includes(role as Role);

/** Paths that belong to the staff console (admin / lecturer area). */
const CONSOLE_PREFIXES = ["/management", "/admin", "/live-classes", "/courses/manage", "/developer"];
export const isConsolePath = (pathname: string) =>
  CONSOLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

/** Where the "Open dashboard" button takes each staff role. */
export const CONSOLE_HOME = "/management?tab=dashboard";
export const consoleLabel = (role?: string) => (isAdminRole(role) ? "Admin dashboard" : "Lecturer dashboard");

export const STUDENT_NAV: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Home", icon: House },
      { href: "/courses", label: "My Courses", icon: Books },
      { href: "/lms/live", label: "Live Classes", icon: VideoCamera },
      { href: "/lms/my-recordings", label: "Recordings", icon: PlayCircle },
      { href: "/recorded-courses", label: "Recorded Courses", icon: ShoppingBag },
      { href: "/lms/timetable", label: "Timetable", icon: CalendarBlank },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/lms/assignments", label: "Assignments", icon: ClipboardText },
      { href: "/lms/exams", label: "Exams", icon: Exam },
      { href: "/lms/pte", label: "PTE Training", icon: Target, pte: true },
      { href: "/lms/resources", label: "Resources", icon: FolderOpen },
      { href: "/lms/grammar", label: "Grammar Classes", icon: TextAa },
    ],
  },
  {
    label: "Connect",
    items: [
      { href: "/messages", label: "Messages", icon: ChatsCircle },
      { href: "/community", label: "Community", icon: UsersThree },
      { href: "/help", label: "Help & Support", icon: Lifebuoy },
    ],
  },
];

const t = (tab: string) => `/management?tab=${tab}`;

export const CONSOLE_NAV: NavSection[] = [
  {
    items: [{ href: t("dashboard"), label: "Overview", icon: SquaresFour }],
  },
  {
    label: "People",
    items: [
      { href: t("students"), label: "Students", icon: Student, roles: ADMIN_ROLES },
      { href: t("enrollments"), label: "Enrollments & Payments", icon: Receipt, roles: ADMIN_ROLES },
      { href: t("users"), label: "Users & Roles", icon: UserGear, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Teaching",
    items: [
      { href: t("courses"), label: "Courses", icon: BookOpenText },
      { href: "/live-classes", label: "Schedule Classes", icon: CalendarPlus },
      { href: t("class-recordings"), label: "Live Recordings", icon: VideoCamera },
      { href: t("video-check"), label: "Video Check", icon: MonitorPlay },
      { href: t("recordings"), label: "Recorded Library", icon: FilmStrip },
      { href: t("video-library"), label: "Video Library", icon: Television, roles: ADMIN_ROLES },
      { href: t("grammar"), label: "Grammar", icon: TextAa },
      { href: t("resources"), label: "Resources", icon: FolderOpen },
    ],
  },
  {
    label: "Reports",
    items: [
      { href: t("attendance"), label: "Attendance", icon: ListChecks, roles: ADMIN_ROLES },
      { href: t("analytics"), label: "Analytics", icon: ChartBar, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "Communication",
    items: [
      { href: t("announcements"), label: "Announcements", icon: Megaphone, roles: ADMIN_ROLES },
      { href: t("support"), label: "Support Tickets", icon: Headset, roles: ADMIN_ROLES },
    ],
  },
  {
    label: "System",
    items: [
      { href: t("settings"), label: "Settings", icon: GearSix, roles: ADMIN_ROLES },
      { href: "/developer", label: "Developer Tools", icon: ShieldWarning, roles: ADMIN_ROLES },
    ],
  },
];

/** Sections visible to a role in the given area, with empty sections dropped. */
export function navFor(role: string | undefined, inConsole: boolean): NavSection[] {
  const source = inConsole && isStaffRole(role) ? CONSOLE_NAV : STUDENT_NAV;
  return source
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || i.roles.includes(role as Role)) }))
    .filter((s) => s.items.length > 0);
}

/** Phone bottom bar: 4 links + a "More" button that opens the full menu. Index 2 is the raised centre button. */
export function bottomNavFor(role: string | undefined, inConsole: boolean): NavItem[] {
  if (inConsole && isAdminRole(role)) {
    return [
      { href: t("dashboard"), label: "Overview", icon: SquaresFour },
      { href: t("students"), label: "Students", icon: Student },
      { href: t("enrollments"), label: "Enrol", icon: Receipt },
      { href: t("courses"), label: "Courses", icon: BookOpenText },
    ];
  }
  if (inConsole && isStaffRole(role)) {
    return [
      { href: t("dashboard"), label: "Overview", icon: SquaresFour },
      { href: t("courses"), label: "Courses", icon: BookOpenText },
      { href: "/live-classes", label: "Schedule", icon: CalendarPlus },
      { href: t("class-recordings"), label: "Recordings", icon: FilmStrip },
    ];
  }
  return [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/courses", label: "Courses", icon: Books },
    { href: "/lms/live", label: "Live", icon: VideoCamera },
    { href: "/messages", label: "Messages", icon: ChatsCircle },
  ];
}

export const MORE_ICON = DotsThreeOutline;

/** Is `href` (which may carry ?tab=) the current page? */
export function isActiveHref(href: string, pathname: string, tab: string | null): boolean {
  const [path, query] = href.split("?");
  if (query) {
    const want = new URLSearchParams(query).get("tab");
    return pathname === path && (tab || "dashboard") === want;
  }
  if (path === "/dashboard") return pathname === "/dashboard";
  return pathname === path || pathname.startsWith(path + "/");
}
