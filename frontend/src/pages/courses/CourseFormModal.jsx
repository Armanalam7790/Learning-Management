import { useEffect, useState } from 'react';
import { courseApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

const EMPTY_FORM = { courseName: '', courseCode: '', description: '', duration: '', totalFees: '', status: 'Active' };

export default function CourseFormModal({ open, onClose, course, onSaved }) {
  const isEdit = Boolean(course);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        course
          ? {
              courseName: course.courseName,
              courseCode: course.courseCode,
              description: course.description || '',
              duration: course.duration,
              totalFees: String(course.totalFees),
              status: course.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setFormError('');
    }
  }, [open, course]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.courseName.trim()) next.courseName = 'Course name is required';
    if (!form.courseCode.trim()) next.courseCode = 'Course code is required';
    if (!form.duration.trim()) next.duration = 'Duration is required';
    if (!form.totalFees || Number(form.totalFees) < 0) next.totalFees = 'Enter a valid fee amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = { ...form, totalFees: Number(form.totalFees) };
      if (isEdit) {
        await courseApi.update(course._id, payload);
        toast.success('Course updated successfully.');
      } else {
        await courseApi.create(payload);
        toast.success('Course created successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this course.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit course' : 'Create course'}
      description={isEdit ? 'Update this course\'s details.' : 'Add a new course offering for your institute.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Create course'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        <Input
          label="Course name"
          required
          placeholder="Full Stack Web Development"
          value={form.courseName}
          error={errors.courseName}
          onChange={(e) => update('courseName', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Course code"
            required
            placeholder="FSWD01"
            value={form.courseCode}
            error={errors.courseCode}
            onChange={(e) => update('courseCode', e.target.value)}
          />
          <Input
            label="Duration"
            required
            placeholder="6 months"
            value={form.duration}
            error={errors.duration}
            onChange={(e) => update('duration', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total fees"
            type="number"
            min="0"
            required
            placeholder="25000"
            value={form.totalFees}
            error={errors.totalFees}
            onChange={(e) => update('totalFees', e.target.value)}
          />
          <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
        <Textarea
          label="Description"
          placeholder="What will students learn in this course?"
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </form>
    </Modal>
  );
}
