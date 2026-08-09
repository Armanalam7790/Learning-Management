import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { assignmentApi } from '../../api/endpoints';
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
import AssignmentFormModal from './AssignmentFormModal';

export default function AssignmentsPage() {
  const { data: assignments, loading, error, refetch } = useFetch(() => assignmentApi.list(), []);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!assignments) return [];
    const q = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.batch?.batchName?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  function openCreate() {
    setEditingAssignment(null);
    setFormOpen(true);
  }
  function openEdit(assignment) {
    setEditingAssignment(assignment);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await assignmentApi.remove(deleteTarget._id);
      toast.success('Assignment deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this assignment.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'title',
      header: 'Assignment',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{row.title}</p>
          <p className="truncate text-xs text-slate-400">{row.batch?.batchName}</p>
        </div>
      ),
    },
    { key: 'dueDate', header: 'Due date', render: (row) => formatDate(row.dueDate) },
    { key: 'marks', header: 'Max marks', render: (row) => row.maximumMarks },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'View details', icon: Eye, onClick: () => navigate(`/assignments/${row._id}`) },
              canManage && { label: 'Edit assignment', icon: Pencil, onClick: () => openEdit(row) },
              canManage && { label: 'Delete assignment', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Assignments"
        description="Publish assignments and track student submissions."
        actions={
          canManage && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create assignment
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title or batch…" className="sm:w-72" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            <option value="">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Closed">Closed</option>
          </Select>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} assignment${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={4} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={FileText}
          title={search || statusFilter ? 'No assignments match your filters' : 'No assignments yet'}
          description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Create your first assignment.'}
          action={
            canManage &&
            !search &&
            !statusFilter && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create assignment
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => navigate(`/assignments/${row._id}`)} />
      )}

      <AssignmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        assignment={editingAssignment}
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
        title="Delete this assignment?"
        description={`${deleteTarget?.title} and its submissions will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
