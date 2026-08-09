import { useEffect, useState } from 'react';
import { examApi, batchApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getErrorMessage, toDateInputValue } from '../../utils/formatters';

const EMPTY_FORM = {
  batch: '',
  title: '',
  description: '',
  subject: '',
  examType: '',
  examDate: '',
  startTime: '',
  endTime: '',
  duration: '',
  maximumMarks: '',
  passingMarks: '',
  instructions: '',
  status: 'Draft',
};

export default function ExamFormModal({ open, onClose, exam, onSaved }) {
  const isEdit = Boolean(exam);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [batches, setBatches] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    batchApi.list().then(({ data }) => setBatches(data.data)).catch(() => setBatches([]));
    setForm(
      exam
        ? {
            batch: exam.batch?._id || exam.batch || '',
            title: exam.title,
            description: exam.description || '',
            subject: exam.subject,
            examType: exam.examType,
            examDate: toDateInputValue(exam.examDate),
            startTime: exam.startTime,
            endTime: exam.endTime,
            duration: String(exam.duration),
            maximumMarks: String(exam.maximumMarks),
            passingMarks: String(exam.passingMarks),
            instructions: exam.instructions || '',
            status: exam.status,
          }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError('');
  }, [open, exam]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.batch) next.batch = 'Select a batch';
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.subject.trim()) next.subject = 'Subject is required';
    if (!form.examType.trim()) next.examType = 'Exam type is required';
    if (!form.examDate) next.examDate = 'Exam date is required';
    if (!form.startTime.trim()) next.startTime = 'Start time is required';
    if (!form.endTime.trim()) next.endTime = 'End time is required';
    if (!form.duration || Number(form.duration) < 1) next.duration = 'Enter duration in minutes';
    if (!form.maximumMarks || Number(form.maximumMarks) < 1) next.maximumMarks = 'Enter a valid marks value';
    if (!form.passingMarks || Number(form.passingMarks) < 1) next.passingMarks = 'Enter a valid marks value';
    if (Number(form.passingMarks) > Number(form.maximumMarks)) next.passingMarks = 'Cannot exceed maximum marks';
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
        ...form,
        duration: Number(form.duration),
        maximumMarks: Number(form.maximumMarks),
        passingMarks: Number(form.passingMarks),
      };
      if (isEdit) {
        await examApi.update(exam._id, payload);
        toast.success('Exam updated successfully.');
      } else {
        await examApi.create(payload);
        toast.success('Exam created successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this exam.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit exam' : 'Schedule exam'}
      description={isEdit ? 'Update exam schedule and grading rules.' : 'Set up a new exam for a batch.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Schedule exam'}
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
            label="Title"
            required
            placeholder="Potions Midterm"
            value={form.title}
            error={errors.title}
            onChange={(e) => update('title', e.target.value)}
          />
          <Select
            label="Batch"
            required
            placeholder="Select batch"
            value={form.batch}
            error={errors.batch}
            onChange={(e) => update('batch', e.target.value)}
          >
            {batches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.batchName} ({b.batchCode})
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Subject"
            required
            placeholder="Potions Theory"
            value={form.subject}
            error={errors.subject}
            onChange={(e) => update('subject', e.target.value)}
          />
          <Input
            label="Exam type"
            required
            placeholder="Midterm"
            value={form.examType}
            error={errors.examType}
            onChange={(e) => update('examType', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Exam date"
            type="date"
            required
            value={form.examDate}
            error={errors.examDate}
            onChange={(e) => update('examDate', e.target.value)}
          />
          <Input
            label="Start time"
            required
            placeholder="10:00 AM"
            value={form.startTime}
            error={errors.startTime}
            onChange={(e) => update('startTime', e.target.value)}
          />
          <Input
            label="End time"
            required
            placeholder="12:00 PM"
            value={form.endTime}
            error={errors.endTime}
            onChange={(e) => update('endTime', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Duration (mins)"
            type="number"
            min="1"
            required
            value={form.duration}
            error={errors.duration}
            onChange={(e) => update('duration', e.target.value)}
          />
          <Input
            label="Max marks"
            type="number"
            min="1"
            required
            value={form.maximumMarks}
            error={errors.maximumMarks}
            onChange={(e) => update('maximumMarks', e.target.value)}
          />
          <Input
            label="Passing marks"
            type="number"
            min="1"
            required
            value={form.passingMarks}
            error={errors.passingMarks}
            onChange={(e) => update('passingMarks', e.target.value)}
          />
        </div>
        <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
          <option value="Draft">Draft</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Published">Published</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
        <Textarea
          label="Instructions"
          placeholder="Instructions for students"
          value={form.instructions}
          onChange={(e) => update('instructions', e.target.value)}
        />
      </form>
    </Modal>
  );
}
