import { useEffect, useState } from 'react';
import { batchApi, teacherApi, courseApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Drawer from '../../components/ui/Drawer';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { cn } from '../../utils/cn';
import { getErrorMessage, toDateInputValue } from '../../utils/formatters';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EMPTY_FORM = {
  batchName: '',
  batchCode: '',
  teacher: '',
  course: '',
  days: [],
  startTime: '',
  endTime: '',
  maximumStudents: '',
  description: '',
  status: 'upcoming',
  startDate: '',
  endDate: '',
};

export default function BatchFormDrawer({ open, onClose, batch, onSaved }) {
  const isEdit = Boolean(batch);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    teacherApi.list().then(({ data }) => setTeachers(data.data)).catch(() => setTeachers([]));
    courseApi.list().then(({ data }) => setCourses(data.data)).catch(() => setCourses([]));
    setForm(
      batch
        ? {
            batchName: batch.batchName,
            batchCode: batch.batchCode,
            teacher: batch.teacher?._id || '',
            course: batch.course?._id || '',
            days: batch.schedule?.days || [],
            startTime: batch.schedule?.startTime || '',
            endTime: batch.schedule?.endTime || '',
            maximumStudents: String(batch.maximumStudents),
            description: batch.description || '',
            status: batch.status,
            startDate: toDateInputValue(batch.startDate),
            endDate: toDateInputValue(batch.endDate),
          }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError('');
  }, [open, batch]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  }

  function validate() {
    const next = {};
    if (!form.batchName.trim()) next.batchName = 'Batch name is required';
    if (!form.batchCode.trim()) next.batchCode = 'Batch code is required';
    if (!form.teacher) next.teacher = 'Select a teacher';
    if (!form.course) next.course = 'Select a course';
    if (form.days.length === 0) next.days = 'Select at least one day';
    if (!form.startTime) next.startTime = 'Start time is required';
    if (!form.endTime) next.endTime = 'End time is required';
    if (!form.maximumStudents || Number(form.maximumStudents) < 1) next.maximumStudents = 'Enter a valid capacity';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (!form.endDate) next.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.startDate) >= new Date(form.endDate)) {
      next.endDate = 'End date must be after the start date';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        batchName: form.batchName,
        batchCode: form.batchCode,
        teacher: form.teacher,
        course: form.course,
        schedule: { days: form.days, startTime: form.startTime, endTime: form.endTime },
        maximumStudents: Number(form.maximumStudents),
        description: form.description,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
      };
      if (isEdit) {
        await batchApi.update(batch._id, payload);
        toast.success('Batch updated successfully.');
      } else {
        await batchApi.create(payload);
        toast.success('Batch created successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this batch.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit batch' : 'Create batch'}
      description={isEdit ? 'Update batch scheduling and capacity.' : 'Set up a new batch under a course.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Create batch'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Batch name"
            required
            placeholder="Morning AI Batch"
            value={form.batchName}
            error={errors.batchName}
            onChange={(e) => update('batchName', e.target.value)}
          />
          <Input
            label="Batch code"
            required
            placeholder="BATCH-101"
            value={form.batchCode}
            error={errors.batchCode}
            onChange={(e) => update('batchCode', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Course"
            required
            placeholder="Select course"
            value={form.course}
            error={errors.course}
            onChange={(e) => update('course', e.target.value)}
          >
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseName}
              </option>
            ))}
          </Select>
          <Select
            label="Teacher"
            required
            placeholder="Select teacher"
            value={form.teacher}
            error={errors.teacher}
            onChange={(e) => update('teacher', e.target.value)}
          >
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.fullName}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">
            Class days<span className="ml-0.5 text-red-500">*</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                type="button"
                key={day}
                onClick={() => toggleDay(day)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  form.days.includes(day)
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
              >
                {day}
              </button>
            ))}
          </div>
          {errors.days && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.days}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start time"
            required
            placeholder="09:00 AM"
            value={form.startTime}
            error={errors.startTime}
            onChange={(e) => update('startTime', e.target.value)}
          />
          <Input
            label="End time"
            required
            placeholder="11:00 AM"
            value={form.endTime}
            error={errors.endTime}
            onChange={(e) => update('endTime', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start date"
            type="date"
            required
            value={form.startDate}
            error={errors.startDate}
            onChange={(e) => update('startDate', e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            required
            value={form.endDate}
            error={errors.endDate}
            onChange={(e) => update('endDate', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Maximum students"
            type="number"
            min="1"
            required
            placeholder="25"
            value={form.maximumStudents}
            error={errors.maximumStudents}
            onChange={(e) => update('maximumStudents', e.target.value)}
          />
          <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </Select>
        </div>

        <Textarea
          label="Description"
          placeholder="What does this batch cover?"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </form>
    </Drawer>
  );
}
