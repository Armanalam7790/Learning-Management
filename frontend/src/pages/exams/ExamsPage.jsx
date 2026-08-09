import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { examApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { formatDate, getErrorMessage } from '../../utils/formatters';
import ExamFormModal from './ExamFormModal';

export default function ExamsPage() {
  const { data: exams, loading, error, refetch } = useFetch(() => examApi.list(), []);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!exams) return [];
    const q = search.trim().toLowerCase();
    return exams.filter((e) => {
      const matchesSearch = !q || e.title.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exams, search, statusFilter]);

  function openCreate() {
    setEditingExam(null);
    setFormOpen(true);
  }
  function openEdit(exam) {
    setEditingExam(exam);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await examApi.remove(deleteTarget._id);
      toast.success('Exam deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this exam.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Exam',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{row.title}</p>
          <p className="truncate text-xs text-slate-400">{row.subject} · {row.batch?.batchName}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.examType },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.examDate) },
    { key: 'marks', header: 'Marks', render: (row) => `${row.maximumMarks} (pass ${row.passingMarks})` },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'View details', icon: Eye, onClick: () => navigate(`/exams/${row._id}`) },
              canManage && { label: 'Edit exam', icon: Pencil, onClick: () => openEdit(row) },
              canManage && { label: 'Delete exam', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Exams"
        description="Schedule exams and manage results by batch."
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Schedule exam
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title or subject…" className="sm:w-72" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Published">Published</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} exam${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={5} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Award}
          title={search || statusFilter ? 'No exams match your filters' : 'No exams yet'}
          description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Schedule your first exam.'}
          action={
            canManage &&
            !search &&
            !statusFilter && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Schedule exam
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/exams/${row._id}`)} />
      )}

      <ExamFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        exam={editingExam}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this exam?"
        description={`${deleteTarget?.title} and its results will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
