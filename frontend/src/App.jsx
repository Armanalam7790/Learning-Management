import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Toaster from './components/ui/Toaster';
import { ROLES } from './utils/constants';

import Login from './pages/auth/Login';
import Onboarding from './pages/auth/Onboarding';
import Dashboard from './pages/Dashboard';
import StudentsPage from './pages/students/StudentsPage';
import TeachersPage from './pages/teachers/TeachersPage';
import CoursesPage from './pages/courses/CoursesPage';
import BatchesPage from './pages/batches/BatchesPage';
import EnrollmentsPage from './pages/enrollments/EnrollmentsPage';
import AttendancePage from './pages/attendance/AttendancePage';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import AssignmentDetailPage from './pages/assignments/AssignmentDetailPage';
import ExamsPage from './pages/exams/ExamsPage';
import ExamDetailPage from './pages/exams/ExamDetailPage';
import ResultsPage from './pages/results/ResultsPage';
import FeeManagementPage from './pages/fees/FeeManagementPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import NotFound from './pages/NotFound';

const { ADMIN, TEACHER } = ROLES;

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="assignments/:id" element={<AssignmentDetailPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="exams/:id" element={<ExamDetailPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="fees" element={<FeeManagementPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="settings" element={<SettingsPage />} />

            <Route element={<ProtectedRoute roles={[ADMIN]} />}>
              <Route path="students" element={<StudentsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="batches" element={<BatchesPage />} />
              <Route path="enrollments" element={<EnrollmentsPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, TEACHER]} />}>
              <Route path="attendance" element={<AttendancePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </>
  );
}
