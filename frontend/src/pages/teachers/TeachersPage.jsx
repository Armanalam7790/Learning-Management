import { useMemo, useState } from 'react';
import { Users, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { teacherApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
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
import TeacherFormDrawer from './TeacherFormDrawer';
import TeacherViewDrawer from './TeacherViewDrawer';

export default function TeachersPage() {
  const { data: teachers, loading, error, refetch } = useFetch(() => teacherApi.list(), []);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!teachers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) => t.fullName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.phone?.includes(q)
    );
  }, [teachers, search]);

  function openCreate() {
    setEditingTeacher(null);
    setFormOpen(true);
  }
  function openEdit(teacher) {
    setEditingTeacher(teacher);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await teacherApi.remove(deleteTarget._id);
      toast.success(`${deleteTarget.fullName} was deactivated.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not deactivate this teacher.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Teacher',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.fullName} src={row.profileImage} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{row.fullName}</p>
            <p className="truncate text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => <span className="text-slate-600">{row.phone}</span> },
    { key: 'joined', header: 'Joined', render: (row) => formatDate(row.createdAt) },
    { key: 'status', header: 'Status', render: () => <Badge status="Active" /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'View details', icon: Eye, onClick: () => setViewingTeacher(row) },
              { label: 'Edit teacher', icon: Pencil, onClick: () => openEdit(row) },
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
        title="Teachers"
        description="Manage teaching staff and their batch assignments."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add teacher
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or phone…" className="sm:w-80" />
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} teacher${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={5} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Users}
          title={search ? 'No teachers match your search' : 'No teachers yet'}
          description={search ? 'Try a different name, email or phone number.' : 'Add your first teacher to get started.'}
          action={
            !search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add teacher
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => setViewingTeacher(row)} />
      )}

      <TeacherFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        teacher={editingTeacher}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />

      <TeacherViewDrawer
        teacher={viewingTeacher}
        open={Boolean(viewingTeacher)}
        onClose={() => setViewingTeacher(null)}
        onEdit={() => {
          openEdit(viewingTeacher);
          setViewingTeacher(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate this teacher?"
        description={`${deleteTarget?.fullName} will lose access and be hidden from active listings.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
