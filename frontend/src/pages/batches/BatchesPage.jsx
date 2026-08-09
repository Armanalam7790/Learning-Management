import { useMemo, useState } from 'react';
import { Layers, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { batchApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
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
import BatchFormDrawer from './BatchFormDrawer';
import BatchViewDrawer from './BatchViewDrawer';

export default function BatchesPage() {
  const { data: batches, loading, error, refetch } = useFetch(() => batchApi.list(), []);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [viewingBatch, setViewingBatch] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!batches) return [];
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      const matchesSearch =
        !q ||
        b.batchName.toLowerCase().includes(q) ||
        b.batchCode.toLowerCase().includes(q) ||
        b.course?.courseName?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [batches, search, statusFilter]);

  function openCreate() {
    setEditingBatch(null);
    setFormOpen(true);
  }
  function openEdit(batch) {
    setEditingBatch(batch);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await batchApi.remove(deleteTarget._id);
      toast.success(`${deleteTarget.batchName} was deactivated.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not deactivate this batch.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Batch',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{row.batchName}</p>
          <p className="truncate text-xs text-slate-400">{row.batchCode}</p>
        </div>
      ),
    },
    { key: 'course', header: 'Course', render: (row) => row.course?.courseName || '—' },
    { key: 'teacher', header: 'Teacher', render: (row) => row.teacher?.fullName || '—' },
    {
      key: 'schedule',
      header: 'Schedule',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.schedule?.days?.join(', ')} · {row.schedule?.startTime}–{row.schedule?.endTime}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Students',
      render: (row) => `${row.currentStudents}/${row.maximumStudents}`,
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'View details', icon: Eye, onClick: () => setViewingBatch(row) },
              { label: 'Edit batch', icon: Pencil, onClick: () => openEdit(row) },
              { label: 'Deactivate', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Batches"
        description="Track class schedules, capacity and enrollment per batch."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create batch
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by batch or course…" className="sm:w-72" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} batch${filtered.length === 1 ? '' : 'es'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={6} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Layers}
          title={search || statusFilter ? 'No batches match your filters' : 'No batches yet'}
          description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Create your first batch to start enrolling students.'}
          action={
            !search &&
            !statusFilter && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create batch
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => setViewingBatch(row)} />
      )}

      <BatchFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        batch={editingBatch}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />

      <BatchViewDrawer
        batch={viewingBatch}
        open={Boolean(viewingBatch)}
        onClose={() => setViewingBatch(null)}
        onEdit={() => {
          openEdit(viewingBatch);
          setViewingBatch(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate this batch?"
        description={`${deleteTarget?.batchName} will be hidden from active listings.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
