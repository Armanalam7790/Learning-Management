import { useEffect, useState } from 'react';
import { Pencil, Users } from 'lucide-react';
import { enrollmentApi } from '../../api/endpoints';
import Drawer from '../../components/ui/Drawer';
import DetailList from '../../components/ui/DetailList';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function BatchViewDrawer({ batch, open, onClose, onEdit }) {
  const [enrollments, setEnrollments] = useState(null);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

  useEffect(() => {
    if (!open || !batch) return;
    setEnrollments(null);
    setLoadingEnrollments(true);
    enrollmentApi
      .byBatch(batch._id)
      .then(({ data }) => setEnrollments(data.data))
      .catch(() => setEnrollments([]))
      .finally(() => setLoadingEnrollments(false));
  }, [open, batch]);

  if (!batch) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={batch.batchName}
      description={batch.batchCode}
      size="lg"
      footer={
        <Button onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit batch
        </Button>
      }
    >
      <DetailList
        items={[
          { label: 'Course', value: batch.course?.courseName },
          { label: 'Teacher', value: batch.teacher?.fullName },
          { label: 'Schedule', value: `${batch.schedule?.days?.join(', ')} · ${batch.schedule?.startTime}–${batch.schedule?.endTime}` },
          { label: 'Duration', value: `${formatDate(batch.startDate)} – ${formatDate(batch.endDate)}` },
          { label: 'Capacity', value: `${batch.currentStudents}/${batch.maximumStudents} students` },
          { label: 'Course fees', value: batch.course?.totalFees != null ? formatCurrency(batch.course.totalFees) : undefined },
          { label: 'Status', value: <Badge status={batch.status} /> },
        ]}
      />

      <div className="mt-6">
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Users className="h-4 w-4 text-slate-400" />
          Enrolled students
        </h3>
        {loadingEnrollments && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner /> Loading students…
          </div>
        )}
        {!loadingEnrollments && enrollments?.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 px-3.5 py-3 text-sm text-slate-400">
            No students enrolled yet.
          </p>
        )}
        {!loadingEnrollments && enrollments?.length > 0 && (
          <div className="flex flex-col gap-2">
            {enrollments.map((enr) => (
              <div key={enr._id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <Avatar name={enr.student?.fullName} size="sm" />
                  <p className="text-sm font-medium text-slate-800">{enr.student?.fullName}</p>
                </div>
                <Badge status={enr.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
