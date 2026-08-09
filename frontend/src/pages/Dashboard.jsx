import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  BookOpen,
  Layers,
  Wallet,
  TrendingUp,
  AlertCircle,
  Receipt,
  UserPlus,
  CalendarCheck,
  FileText,
  Award,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import {
  studentApi,
  teacherApi,
  courseApi,
  batchApi,
  studentFeeApi,
  paymentApi,
  assignmentApi,
  examApi,
  dashboardApi,
} from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import { CardSkeleton } from '../components/ui/Loading';
import { formatCurrency, formatDate, formatDateTime, getErrorMessage } from '../utils/formatters';

async function safeList(promise) {
  try {
    const { data } = await promise;
    return data.data;
  } catch {
    return [];
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ loading: true, error: null, data: null });
      try {
        const [students, teachers, courses, batches, studentFees, payments, assignments, exams, courseAnalytics] =
          await Promise.all([
            isAdmin ? safeList(studentApi.list()) : Promise.resolve([]),
            isAdmin ? safeList(teacherApi.list()) : Promise.resolve([]),
            safeList(courseApi.list()),
            isAdmin ? safeList(batchApi.list()) : Promise.resolve([]),
            safeList(studentFeeApi.list()),
            safeList(paymentApi.list()),
            safeList(assignmentApi.list()),
            safeList(examApi.list()),
            isAdmin ? safeList(dashboardApi.courseAnalytics()) : Promise.resolve([]),
          ]);

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            data: { students, teachers, courses, batches, studentFees, payments, assignments, exams, courseAnalytics },
          });
        }
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: getErrorMessage(err), data: null });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const derived = useMemo(() => {
    if (!state.data) return null;
    const { students, teachers, courses, batches, studentFees, payments, assignments, exams } = state.data;

    const totalFees = studentFees.reduce((sum, f) => sum + (f.totalFee || 0), 0);
    const collected = studentFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
    const pending = studentFees.reduce((sum, f) => sum + (f.pendingAmount || 0), 0);
    const collectionRate = totalFees > 0 ? Math.round((collected / totalFees) * 100) : 0;

    const recentPayments = [...payments].slice(0, 5);
    const recentStudents = [...students]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    const now = new Date();
    const upcomingExams = exams
      .filter((e) => e.status === 'Scheduled' && new Date(e.examDate) >= now)
      .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
      .slice(0, 4);
    const upcomingAssignments = assignments
      .filter((a) => a.status === 'Published' && new Date(a.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 4);

    const activeCourses = courses.filter((c) => c.status === 'Active').length;

    return {
      totalFees,
      collected,
      pending,
      collectionRate,
      recentPayments,
      recentStudents,
      upcomingExams,
      upcomingAssignments,
      activeCourses,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalBatches: batches.length,
    };
  }, [state.data]);

  if (state.loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  if (state.error) {
    return <ErrorState message={state.error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Here's what's happening across your institute today.</p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Students" value={derived.totalStudents} icon={GraduationCap} tone="primary" />
          <StatCard label="Total Teachers" value={derived.totalTeachers} icon={Users} tone="info" />
          <StatCard label="Active Courses" value={derived.activeCourses} icon={BookOpen} tone="success" sub={`${state.data.courses.length} total`} />
          <StatCard label="Total Batches" value={derived.totalBatches} icon={Layers} tone="warning" />
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fee overview</h2>
          <Link to="/fees" className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            View fee management <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Fees" value={formatCurrency(derived.totalFees)} icon={Wallet} tone="slate" />
          <StatCard label="Amount Collected" value={formatCurrency(derived.collected)} icon={TrendingUp} tone="success" />
          <StatCard label="Pending Fees" value={formatCurrency(derived.pending)} icon={AlertCircle} tone="warning" />
          <StatCard
            label="Collection Rate"
            value={`${derived.collectionRate}%`}
            icon={Receipt}
            tone="primary"
            sub="of total fees collected"
          />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Fee collection progress</span>
            <span className="font-semibold text-primary-600 dark:text-primary-400">{derived.collectionRate}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-primary-600 transition-all duration-500"
              style={{ width: `${derived.collectionRate}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>{formatCurrency(derived.collected)} collected</span>
            <span>{formatCurrency(derived.pending)} pending</span>
          </div>
        </div>
      </div>

      {isAdmin && state.data.courseAnalytics.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Course performance</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full min-w-160 text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Batches</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Pass rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.data.courseAnalytics.map((row) => (
                  <tr key={row.courseId}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{row.courseName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.metrics.batchesCount}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.metrics.studentsCount}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{formatCurrency(row.metrics.revenueCollected)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${row.metrics.averageAttendance}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.metrics.averageAttendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={row.metrics.passRate >= 60 ? 'success' : 'warning'}>{row.metrics.passRate}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent payments</h2>
            <Link to="/payments" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              View all
            </Link>
          </div>
          {derived.recentPayments.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState icon={Receipt} title="No payments yet" description="Recorded payments will show up here." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {derived.recentPayments.map((p) => (
                <li key={p._id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {p.studentFee?.student?.fullName || 'Student'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDateTime(p.paymentDate)} · {p.paymentMode}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {isAdmin ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent students</h2>
              <Link to="/students" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
            {derived.recentStudents.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState icon={GraduationCap} title="No students yet" description="New students will show up here." />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {derived.recentStudents.map((s) => (
                  <li key={s._id} className="flex items-center gap-3 px-5 py-3.5">
                    <Avatar name={s.fullName} src={s.profileImage} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{s.fullName}</p>
                      <p className="truncate text-xs text-slate-400 dark:text-slate-500">{s.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDate(s.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming exams</h2>
              <Link to="/exams" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
            {derived.upcomingExams.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState icon={Award} title="No upcoming exams" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {derived.upcomingExams.map((e) => (
                  <li key={e._id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{e.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{e.subject}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(e.examDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming exams</h2>
              <Link to="/exams" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
            {derived.upcomingExams.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState icon={Award} title="No upcoming exams" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {derived.upcomingExams.map((e) => (
                  <li key={e._id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{e.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{e.subject}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(e.examDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming assignments</h2>
              <Link to="/assignments" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                View all
              </Link>
            </div>
            {derived.upcomingAssignments.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState icon={FileText} title="No upcoming assignments" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {derived.upcomingAssignments.map((a) => (
                  <li key={a._id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{a.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{a.batch?.batchName}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(a.dueDate)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction to="/students" icon={UserPlus} label="Add Student" />
            <QuickAction to="/attendance" icon={CalendarCheck} label="Mark Attendance" />
            <QuickAction to="/payments" icon={Receipt} label="Record Payment" />
            <QuickAction to="/batches" icon={ClipboardList} label="Create Batch" />
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }) {
  return (
    <Link to={to}>
      <Button variant="secondary" className="w-full justify-start gap-2.5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </Button>
    </Link>
  );
}
