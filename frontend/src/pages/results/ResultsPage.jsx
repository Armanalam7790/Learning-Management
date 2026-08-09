import { useMemo, useState } from 'react';
import { BarChart3, Plus, Send, Lock, Unlock, Trash2 } from 'lucide-react';
import { academicResultApi } from '../../api/endpoints';
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
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { getErrorMessage } from '../../utils/formatters';
import GenerateResultsModal from './GenerateResultsModal';

export default function ResultsPage() {
  const { data: results, loading, error, refetch } = useFetch(() => academicResultApi.list(), []);
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.ADMIN;
  const canManage = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    if (!results) return [];
    const q = search.trim().toLowerCase();
    return results.filter((r) => {
      const matchesSearch =
        !q || r.student?.fullName?.toLowerCase().includes(q) || r.exam?.title?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || r.resultStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [results, search, statusFilter]);

  async function handlePublish(result) {
    setBusyId(result._id);
    try {
      await academicResultApi.publish(result._id);
      toast.success('Result published successfully.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not publish this result.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleLock(result) {
    setBusyId(result._id);
    try {
      if (result.isLocked) {
        await academicResultApi.unlock(result._id);
        toast.success('Result unlocked.');
      } else {
        await academicResultApi.lock(result._id);
        toast.success('Result locked.');
      }
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update lock status.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await academicResultApi.remove(deleteTarget._id);
      toast.success('Result deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this result.'));
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
            <p className="truncate text-sm font-medium text-slate-800">{row.student?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{row.batch?.batchName}</p>
          </div>
        </div>
      ),
    },
    { key: 'exam', header: 'Exam', render: (row) => row.exam?.title || '—' },
    { key: 'marks', header: 'Marks', render: (row) => `${row.totalMarks}/${row.maximumMarks}` },
    { key: 'percentage', header: 'Percentage', render: (row) => `${row.percentage}%` },
    { key: 'grade', header: 'Grade', render: (row) => row.grade },
    { key: 'rank', header: 'Rank', render: (row) => (row.rank ? `#${row.rank}` : '—') },
    { key: 'status', header: 'Result', render: (row) => <Badge status={row.resultStatus} /> },
    {
      key: 'publish',
      header: 'Visibility',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Badge tone={row.isPublished ? 'success' : 'neutral'}>{row.isPublished ? 'Published' : 'Draft'}</Badge>
          {row.isLocked && <Badge tone="warning">Locked</Badge>}
        </div>
      ),
    },
    canManage && {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              !row.isPublished && {
                label: busyId === row._id ? 'Publishing…' : 'Publish',
                icon: Send,
                disabled: busyId === row._id,
                onClick: () => handlePublish(row),
              },
              isAdmin && {
                label: row.isLocked ? 'Unlock' : 'Lock',
                icon: row.isLocked ? Unlock : Lock,
                disabled: busyId === row._id,
                onClick: () => handleToggleLock(row),
              },
              !row.isLocked && { label: 'Delete result', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) },
            ]}
          />
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Results"
        description="Consolidated academic performance across assignments, exams and attendance."
        actions={
          canManage && (
            <Button onClick={() => setGenerateOpen(true)}>
              <Plus className="h-4 w-4" />
              Generate results
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or exam…" className="sm:w-72" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-40">
            <option value="">All results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </Select>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={7} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title={search || statusFilter ? 'No results match your filters' : 'No results yet'}
          description={
            search || statusFilter
              ? 'Try adjusting your search or filters.'
              : canManage
                ? 'Generate results once exam evaluations are complete.'
                : 'Published results will appear here.'
          }
          action={
            canManage &&
            !search &&
            !statusFilter && (
              <Button onClick={() => setGenerateOpen(true)}>
                <Plus className="h-4 w-4" />
                Generate results
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && <Table columns={columns} data={filtered} />}

      <GenerateResultsModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onSaved={() => {
          setGenerateOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this result?"
        description={`The result for ${deleteTarget?.student?.fullName} will be permanently removed.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
