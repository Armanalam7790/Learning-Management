import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarClock, FileText, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { assignmentApi, submissionApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { PageLoader, TableSkeleton } from '../../components/ui/Loading';
import { formatDate, formatDateTime, getErrorMessage } from '../../utils/formatters';
import AssignmentFormModal from './AssignmentFormModal';
import SubmissionGradeModal from './SubmissionGradeModal';

export default function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;
  const isStudent = user?.role === ROLES.STUDENT;

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [studentState, setStudentState] = useState({ status: 'checking', submission: null }); // checking | none | submitted | already
  const [studentForm, setStudentForm] = useState({ submissionText: '', submissionFile: '' });
  const [studentSubmitting, setStudentSubmitting] = useState(false);
  const [studentFormError, setStudentFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await assignmentApi.getById(id);
      setAssignment(data.data);
      if (isStudent) setStudentState({ status: 'none', submission: null });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, isStudent]);

  useEffect(() => {
    load();
  }, [load]);

  const loadSubmissions = useCallback(async () => {
    if (!canManage) return;
    setSubmissionsLoading(true);
    try {
      const { data } = await assignmentApi.submissions(id);
      setSubmissions(data.data);
    } catch {
      setSubmissions([]);
    } finally {
      setSubmissionsLoading(false);
    }
  }, [id, canManage]);

  useEffect(() => {
    if (assignment && canManage) loadSubmissions();
  }, [assignment, canManage, loadSubmissions]);

  async function handleDeleteAssignment() {
    setDeleting(true);
    try {
      await assignmentApi.remove(id);
      toast.success('Assignment deleted successfully.');
      navigate('/assignments');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this assignment.'));
    } finally {
      setDeleting(false);
    }
  }

  async function handleStudentSubmit(e) {
    e.preventDefault();
    setStudentFormError('');
    setStudentSubmitting(true);
    try {
      const { data } = await assignmentApi.submit(id, studentForm);
      setStudentState({ status: 'submitted', submission: data.data });
      toast.success('Your solution was submitted successfully.');
    } catch (err) {
      const message = getErrorMessage(err, 'Could not submit your solution.');
      if (message.toLowerCase().includes('already submitted')) {
        setStudentState({ status: 'already', submission: null });
      } else {
        setStudentFormError(message);
      }
    } finally {
      setStudentSubmitting(false);
    }
  }

  if (loading) return <PageLoader label="Loading assignment…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!assignment) return null;

  const isPastDue = new Date() > new Date(assignment.dueDate);

  return (
    <div>
      <button
        onClick={() => navigate('/assignments')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assignments
      </button>

      <PageHeader
        title={assignment.title}
        description={`${assignment.batch?.batchName || ''} ${assignment.batch?.course?.courseName ? `· ${assignment.batch.course.courseName}` : ''}`}
        actions={
          canManage && (
            <>
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="dangerGhost" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MiniStat icon={CalendarClock} label="Due date" value={formatDate(assignment.dueDate)} />
        <MiniStat icon={Award} label="Max marks" value={assignment.maximumMarks} />
        <MiniStat icon={FileText} label="Status" value={<Badge status={assignment.status} />} />
        <MiniStat icon={Paperclip} label="Attachment" value={assignment.attachment ? 'Available' : 'None'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-sm font-semibold text-slate-800">Description</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{assignment.description || 'No description provided.'}</p>
            {assignment.instructions && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-slate-800">Instructions</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{assignment.instructions}</p>
              </>
            )}
            {assignment.attachment && (
              <a
                href={assignment.attachment}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Paperclip className="h-3.5 w-3.5" />
                View attachment
              </a>
            )}
          </div>

          {canManage && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Submissions</h3>
              {submissionsLoading && <TableSkeleton cols={4} rows={3} />}
              {!submissionsLoading && submissions.length === 0 && (
                <EmptyState icon={FileText} title="No submissions yet" description="Submissions will appear here once students submit their work." />
              )}
              {!submissionsLoading && submissions.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Submitted</th>
                        <th className="px-4 py-3">Marks</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.map((sub) => (
                        <tr key={sub._id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={sub.student?.fullName} size="sm" />
                              <span className="font-medium text-slate-800">{sub.student?.fullName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{formatDateTime(sub.submittedAt)}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {sub.marksObtained != null ? `${sub.marksObtained}/${assignment.maximumMarks}` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={sub.status} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="secondary" onClick={() => setGradingSubmission(sub)}>
                              {sub.status === 'Reviewed' ? 'Update grade' : 'Grade'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {isStudent && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Your submission</h3>

            {studentState.status === 'submitted' && (
              <div className="flex flex-col gap-3">
                <Badge tone="success">Submitted successfully</Badge>
                {studentState.submission?.submissionText && (
                  <p className="text-sm text-slate-600">{studentState.submission.submissionText}</p>
                )}
                <p className="text-xs text-slate-400">Submitted {formatDateTime(studentState.submission?.submittedAt)}</p>
              </div>
            )}

            {studentState.status === 'already' && (
              <div className="rounded-lg bg-sky-50 px-3.5 py-3 text-sm text-sky-700">
                You've already submitted a solution for this assignment. Contact your teacher if you need to make changes.
              </div>
            )}

            {studentState.status === 'none' && (
              <>
                {assignment.status !== 'Published' && (
                  <p className="rounded-lg bg-amber-50 px-3.5 py-3 text-sm text-amber-700">
                    This assignment isn't open for submissions.
                  </p>
                )}
                {assignment.status === 'Published' && isPastDue && (
                  <p className="rounded-lg bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    The due date has passed. Submissions are closed.
                  </p>
                )}
                {assignment.status === 'Published' && !isPastDue && (
                  <form onSubmit={handleStudentSubmit} className="flex flex-col gap-4">
                    {studentFormError && (
                      <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{studentFormError}</div>
                    )}
                    <Textarea
                      label="Your answer"
                      placeholder="Write your submission…"
                      value={studentForm.submissionText}
                      onChange={(e) => setStudentForm((f) => ({ ...f, submissionText: e.target.value }))}
                    />
                    <Input
                      label="Attachment URL"
                      placeholder="https://…"
                      hint="Optional link to a file"
                      value={studentForm.submissionFile}
                      onChange={(e) => setStudentForm((f) => ({ ...f, submissionFile: e.target.value }))}
                    />
                    <Button type="submit" loading={studentSubmitting} className="w-full justify-center">
                      Submit solution
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AssignmentFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        assignment={assignment}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
      />

      <SubmissionGradeModal
        open={Boolean(gradingSubmission)}
        onClose={() => setGradingSubmission(null)}
        submission={gradingSubmission}
        maximumMarks={assignment.maximumMarks}
        onSaved={() => {
          setGradingSubmission(null);
          loadSubmissions();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAssignment}
        loading={deleting}
        title="Delete this assignment?"
        description="All related submissions will also be removed. This cannot be undone."
        confirmLabel="Delete"
      />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}
