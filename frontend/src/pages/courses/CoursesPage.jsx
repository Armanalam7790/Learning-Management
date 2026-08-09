import { useMemo, useState } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Clock, Wallet } from 'lucide-react';
import { courseApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { CardSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { formatCurrency, getErrorMessage } from '../../utils/formatters';
import CourseFormModal from './CourseFormModal';

export default function CoursesPage() {
  const { data: courses, loading, error, refetch } = useFetch(() => courseApi.list(), []);
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    if (!courses) return [];
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.courseName.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q));
  }, [courses, search]);

  function openCreate() {
    setEditingCourse(null);
    setFormOpen(true);
  }
  function openEdit(course) {
    setEditingCourse(course);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await courseApi.remove(deleteTarget._id);
      toast.success(`${deleteTarget.courseName} was deleted.`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this course.'));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Courses"
        description="The catalog of programs your institute offers."
        actions={
          isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Create course
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name or code…" className="sm:w-80" />
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} course${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} className="h-44" />
          ))}
        </div>
      )}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title={search ? 'No courses match your search' : 'No courses yet'}
          description={search ? 'Try a different name or code.' : 'Create your first course to start building batches.'}
          action={
            isAdmin &&
            !search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create course
              </Button>
            )
          }
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <div key={course._id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{course.courseName}</p>
                    <p className="text-xs font-medium text-slate-400">{course.courseCode}</p>
                  </div>
                </div>
                {isAdmin && (
                  <MenuButton
                    items={[
                      { label: 'Edit course', icon: Pencil, onClick: () => openEdit(course) },
                      { label: 'Delete course', icon: Trash2, danger: true, onClick: () => setDeleteTarget(course) },
                    ]}
                  />
                )}
              </div>

              <p className="mt-3 line-clamp-2 flex-1 text-sm text-slate-500">
                {course.description || 'No description provided.'}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-slate-400" />
                  {formatCurrency(course.totalFees)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <Badge status={course.status} />
                {course.createdBy?.fullName && (
                  <span className="text-xs text-slate-400">by {course.createdBy.fullName}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CourseFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        course={editingCourse}
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
        title="Delete this course?"
        description={`${deleteTarget?.courseName} will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
