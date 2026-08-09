import { useEffect, useState } from 'react';
import { Pencil, Layers } from 'lucide-react';
import { batchApi } from '../../api/endpoints';
import Drawer from '../../components/ui/Drawer';
import Avatar from '../../components/ui/Avatar';
import DetailList from '../../components/ui/DetailList';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Loading';
import { formatDate } from '../../utils/formatters';

export default function TeacherViewDrawer({ teacher, open, onClose, onEdit }) {
  const [batches, setBatches] = useState(null);
  const [loadingBatches, setLoadingBatches] = useState(false);

  useEffect(() => {
    if (!open || !teacher) return;
    setBatches(null);
    setLoadingBatches(true);
    batchApi
      .list()
      .then(({ data }) => setBatches(data.data.filter((b) => b.teacher?._id === teacher._id)))
      .catch(() => setBatches([]))
      .finally(() => setLoadingBatches(false));
  }, [open, teacher]);

  if (!teacher) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Teacher profile"
      footer={
        <Button onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit teacher
        </Button>
      }
    >
      <div className="flex items-center gap-4">
        <Avatar name={teacher.fullName} src={teacher.profileImage} size="lg" />
        <div>
          <p className="text-base font-semibold text-slate-900">{teacher.fullName}</p>
          <p className="text-sm text-slate-500">{teacher.email}</p>
        </div>
      </div>

      <div className="mt-6">
        <DetailList
          items={[
            { label: 'Phone', value: teacher.phone },
            { label: 'Role', value: <span className="capitalize">{teacher.role}</span> },
            { label: 'Status', value: <Badge status={teacher.isActive ? 'Active' : 'Inactive'} /> },
            { label: 'Joined', value: formatDate(teacher.createdAt) },
            { label: 'Last login', value: teacher.lastLogin ? formatDate(teacher.lastLogin) : 'Never' },
          ]}
        />
      </div>

      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Layers className="h-4 w-4 text-slate-400" />
          Assigned batches
        </h3>
        {loadingBatches && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner /> Loading batches…
          </div>
        )}
        {!loadingBatches && batches?.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 px-3.5 py-3 text-sm text-slate-400">
            No batches assigned yet.
          </p>
        )}
        {!loadingBatches && batches?.length > 0 && (
          <div className="flex flex-col gap-2">
            {batches.map((batch) => (
              <div key={batch._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{batch.batchName}</p>
                  <p className="text-xs text-slate-400">{batch.course?.courseName}</p>
                </div>
                <Badge status={batch.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
