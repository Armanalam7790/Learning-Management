import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  ClipboardList,
  CalendarCheck,
  FileText,
  Award,
  BarChart3,
  Wallet,
  Receipt,
  Settings,
} from 'lucide-react';
import { ROLES } from '../../utils/constants';

const { ADMIN, TEACHER, STUDENT } = ROLES;

// `roles` gates both sidebar visibility and, indirectly, what pages assume
// about the current user — it mirrors each route's `restrictTo(...)` in the
// backend so a teacher/student never sees a link that would 403.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ADMIN, TEACHER, STUDENT], end: true },
  { section: 'People' },
  { to: '/students', label: 'Students', icon: GraduationCap, roles: [ADMIN] },
  { to: '/teachers', label: 'Teachers', icon: Users, roles: [ADMIN] },
  { section: 'Academics' },
  { to: '/courses', label: 'Courses', icon: BookOpen, roles: [ADMIN, TEACHER, STUDENT] },
  { to: '/batches', label: 'Batches', icon: Layers, roles: [ADMIN] },
  { to: '/enrollments', label: 'Enrollments', icon: ClipboardList, roles: [ADMIN] },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck, roles: [ADMIN, TEACHER] },
  { to: '/assignments', label: 'Assignments', icon: FileText, roles: [ADMIN, TEACHER, STUDENT] },
  { to: '/exams', label: 'Exams', icon: Award, roles: [ADMIN, TEACHER, STUDENT] },
  { to: '/results', label: 'Results', icon: BarChart3, roles: [ADMIN, TEACHER, STUDENT] },
  { section: 'Finance' },
  { to: '/fees', label: 'Fee Management', icon: Wallet, roles: [ADMIN, TEACHER, STUDENT] },
  { to: '/payments', label: 'Payments', icon: Receipt, roles: [ADMIN, TEACHER, STUDENT] },
  { section: 'Account' },
  { to: '/settings', label: 'Settings', icon: Settings, roles: [ADMIN, TEACHER, STUDENT] },
];

export function getPageTitle(pathname) {
  const flat = NAV_ITEMS.filter((item) => item.to);
  const match = flat
    .filter((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match?.label || 'Overview';
}
