import { useMemo, useState } from 'react';
import { GraduationCap, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { studentApi } from '../../api/endpoints';
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
import StudentFormDrawer from './StudentFormDrawer';
import StudentViewDrawer from './StudentViewDrawer';

export default function StudentsPage() {
  const { data: students, loading, error, refetch } = useFetch(() => studentApi.list(), []);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!students) return [];
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone?.includes(q)
    );
  }, [students, search]);

  function openCreate() {
    setEditingStudent(null);
    setFormOpen(true);
  }
  function openEdit(student) {
    setEditingStudent(student);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studentApi.remove(deleteTarget._id);
      toast.success(`${deleteTarget.fullName} was deactivated.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not deactivate this student.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Student',
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
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-slate-600">{row.phone}</span>,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: () => <Badge status="Active" />,
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'View details', icon: Eye, onClick: () => setViewingStudent(row) },
              { label: 'Edit student', icon: Pencil, onClick: () => openEdit(row) },
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
        title="Students"
        description="Manage every student enrolled across your institute."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add student
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email or phone…" className="sm:w-80" />
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} student${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={5} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title={search ? 'No students match your search' : 'No students yet'}
          description={search ? 'Try a different name, email or phone number.' : 'Add your first student to get started.'}
          action={
            !search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Add student
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && (
        <Table columns={columns} data={filtered} onRowClick={(row) => setViewingStudent(row)} />
      )}

      <StudentFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        student={editingStudent}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />

      <StudentViewDrawer
        student={viewingStudent}
        open={Boolean(viewingStudent)}
        onClose={() => setViewingStudent(null)}
        onEdit={() => {
          openEdit(viewingStudent);
          setViewingStudent(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate this student?"
        description={`${deleteTarget?.fullName} will lose access and be hidden from active listings. This can only be undone from the database.`}
        confirmLabel="Deactivate"
      />
    </div>
  );
}
