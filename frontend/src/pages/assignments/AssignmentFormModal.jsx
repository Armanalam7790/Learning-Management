import { useEffect, useState } from 'react';
import { assignmentApi, batchApi } from '../../api/endpoints';
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
  instructions: '',
  attachment: '',
  dueDate: '',
  maximumMarks: '',
  status: 'Draft',
};

export default function AssignmentFormModal({ open, onClose, assignment, onSaved }) {
  const isEdit = Boolean(assignment);
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
      assignment
        ? {
            batch: assignment.batch?._id || assignment.batch || '',
            title: assignment.title,
            description: assignment.description || '',
            instructions: assignment.instructions || '',
            attachment: assignment.attachment || '',
            dueDate: toDateInputValue(assignment.dueDate),
            maximumMarks: String(assignment.maximumMarks),
            status: assignment.status,
          }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError('');
  }, [open, assignment]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.batch) next.batch = 'Select a batch';
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.dueDate) next.dueDate = 'Due date is required';
    if (!form.maximumMarks || Number(form.maximumMarks) < 1) next.maximumMarks = 'Enter a valid marks value';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, maximumMarks: Number(form.maximumMarks) };
      if (isEdit) {
        await assignmentApi.update(assignment._id, payload);
        toast.success('Assignment updated successfully.');
      } else {
        await assignmentApi.create(payload);
        toast.success('Assignment created successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this assignment.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit assignment' : 'Create assignment'}
      description={isEdit ? 'Update assignment details.' : 'Publish a new assignment for a batch.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Create assignment'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        <Input
          label="Title"
          required
          placeholder="Potions Essay"
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
        <Textarea
          label="Description"
          placeholder="What is this assignment about?"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
        <Textarea
          label="Instructions"
          placeholder="Submission guidelines for students"
          value={form.instructions}
          onChange={(e) => update('instructions', e.target.value)}
        />
        <Input
          label="Attachment URL"
          placeholder="https://…"
          hint="Optional"
          value={form.attachment}
          onChange={(e) => update('attachment', e.target.value)}
        />
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Due date"
            type="date"
            required
            value={form.dueDate}
            error={errors.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
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
          <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Closed">Closed</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
