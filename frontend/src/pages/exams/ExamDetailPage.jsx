import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarClock, Clock, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { examApi, examResultApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { PageLoader, TableSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { formatDate, getErrorMessage } from '../../utils/formatters';
import ExamFormModal from './ExamFormModal';
import ExamResultFormModal from './ExamResultFormModal';

export default function ExamDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [results, setResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [editingResult, setEditingResult] = useState(null);
  const [deleteResultTarget, setDeleteResultTarget] = useState(null);
  const [deletingResult, setDeletingResult] = useState(false);
  const [publishingId, setPublishingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await examApi.getById(id);
      setExam(data.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const { data } = await examApi.results(id);
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setResultsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (exam) loadResults();
  }, [exam, loadResults]);

  async function handleDeleteExam() {
    setDeleting(true);
    try {
      await examApi.remove(id);
      toast.success('Exam deleted successfully.');
      navigate('/exams');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this exam.'));
    } finally {
      setDeleting(false);
    }
  }

  async function handlePublish(result) {
    setPublishingId(result._id);
    try {
      await examResultApi.publish(result._id);
      toast.success(`Result published for ${result.student?.fullName}.`);
      loadResults();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not publish this result.'));
    } finally {
      setPublishingId(null);
    }
  }

  async function handleDeleteResult() {
    if (!deleteResultTarget) return;
    setDeletingResult(true);
    try {
      await examResultApi.remove(deleteResultTarget._id);
      toast.success('Result deleted successfully.');
      setDeleteResultTarget(null);
      loadResults();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this result.'));
    } finally {
      setDeletingResult(false);
    }
  }

  if (loading) return <PageLoader label="Loading exam…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!exam) return null;

  return (
    <div>
      <button
        onClick={() => navigate('/exams')}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </button>

      <PageHeader
        title={exam.title}
        description={`${exam.subject} · ${exam.batch?.batchName || ''}`}
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
        <MiniStat icon={CalendarClock} label="Exam date" value={formatDate(exam.examDate)} />
        <MiniStat icon={Clock} label="Timing" value={`${exam.startTime} – ${exam.endTime}`} />
        <MiniStat icon={Award} label="Marks" value={`${exam.maximumMarks} (pass ${exam.passingMarks})`} />
        <MiniStat icon={Award} label="Status" value={<Badge status={exam.status} />} />
      </div>

      {exam.instructions && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-slate-800">Instructions</h3>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{exam.instructions}</p>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Results</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditingResult(null);
              setResultFormOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add result
          </Button>
        )}
      </div>

      {resultsLoading && <TableSkeleton cols={5} rows={4} />}
      {!resultsLoading && results.length === 0 && (
        <EmptyState icon={Award} title="No results yet" description="Results will appear here once evaluations are submitted." />
      )}
      {!resultsLoading && results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Marks</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Status</th>
                {canManage && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.student?.fullName} size="sm" />
                      <span className="font-medium text-slate-800">{r.student?.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.obtainedMarks}/{exam.maximumMarks}</td>
                  <td className="px-4 py-3 text-slate-600">{r.grade || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge status={r.status} />
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <MenuButton
                        items={[
                          {
                            label: 'Edit result',
                            icon: Pencil,
                            onClick: () => {
                              setEditingResult(r);
                              setResultFormOpen(true);
                            },
                          },
                          r.status !== 'Published' && {
                            label: publishingId === r._id ? 'Publishing…' : 'Publish result',
                            icon: Send,
                            disabled: publishingId === r._id,
                            onClick: () => handlePublish(r),
                          },
                          { label: 'Delete result', icon: Trash2, danger: true, onClick: () => setDeleteResultTarget(r) },
                        ]}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExamFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        exam={exam}
        onSaved={() => {
          setEditOpen(false);
          load();
        }}
      />

      <ExamResultFormModal
        open={resultFormOpen}
        onClose={() => setResultFormOpen(false)}
        exam={exam}
        result={editingResult}
        existingResults={results}
        onSaved={() => {
          setResultFormOpen(false);
          loadResults();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteResultTarget)}
        onClose={() => setDeleteResultTarget(null)}
        onConfirm={handleDeleteResult}
        loading={deletingResult}
        title="Delete this result?"
        description={`The result for ${deleteResultTarget?.student?.fullName} will be permanently removed.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteExam}
        loading={deleting}
        title="Delete this exam?"
        description="All related results will also be removed. This cannot be undone."
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
