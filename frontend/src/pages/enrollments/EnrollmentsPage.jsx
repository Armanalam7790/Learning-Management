import { useMemo, useState } from 'react';
import { ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react';
import { enrollmentApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { formatDate, getErrorMessage } from '../../utils/formatters';
import EnrollmentFormModal from './EnrollmentFormModal';

export default function EnrollmentsPage() {
  const { data: enrollments, loading, error, refetch } = useFetch(() => enrollmentApi.list(), []);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!enrollments) return [];
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      const matchesSearch =
        !q || e.student?.fullName?.toLowerCase().includes(q) || e.batch?.batchName?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrollments, search, statusFilter]);

  function openCreate() {
    setEditingEnrollment(null);
    setFormOpen(true);
  }
  function openEdit(enrollment) {
    setEditingEnrollment(enrollment);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await enrollmentApi.remove(deleteTarget._id);
      toast.success('Enrollment removed successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove this enrollment.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.student?.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{row.student?.fullName || 'Unknown'}</p>
            <p className="truncate text-xs text-slate-400">{row.student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'batch',
      header: 'Batch',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">{row.batch?.batchName || '—'}</p>
          <p className="text-xs text-slate-400">{row.batch?.batchCode}</p>
        </div>
      ),
    },
    { key: 'date', header: 'Enrolled on', render: (row) => formatDate(row.enrollmentDate) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'remarks',
      header: 'Remarks',
      hideOnMobile: true,
      render: (row) => <span className="line-clamp-1 text-xs text-slate-400">{row.remarks || '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'Update status', icon: Pencil, onClick: () => openEdit(row) },
              { label: 'Remove enrollment', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="Track which students are enrolled in which batches."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Enroll student
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or batch…" className="sm:w-72" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Dropped">Dropped</option>
            <option value="Cancelled">Cancelled</option>
          </Select>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} enrollment${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={5} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title={search || statusFilter ? 'No enrollments match your filters' : 'No enrollments yet'}
          description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Enroll your first student into a batch.'}
          action={
            !search &&
            !statusFilter && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Enroll student
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && <Table columns={columns} data={filtered} />}

      <EnrollmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        enrollment={editingEnrollment}
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
        title="Remove this enrollment?"
        description={`${deleteTarget?.student?.fullName} will be removed from ${deleteTarget?.batch?.batchName}.`}
        confirmLabel="Remove"
      />
    </div>
  );
}
