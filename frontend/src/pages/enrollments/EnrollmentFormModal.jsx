import { useEffect, useState } from 'react';
import { enrollmentApi, studentApi, batchApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getErrorMessage, toDateInputValue } from '../../utils/formatters';

const EMPTY_FORM = { student: '', batch: '', enrollmentDate: '', status: 'Active', remarks: '' };

export default function EnrollmentFormModal({ open, onClose, enrollment, onSaved }) {
  const isEdit = Boolean(enrollment);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      studentApi.list().then(({ data }) => setStudents(data.data)).catch(() => setStudents([]));
      batchApi.list().then(({ data }) => setBatches(data.data)).catch(() => setBatches([]));
    }
    setForm(
      enrollment
        ? {
            student: enrollment.student?._id || '',
            batch: enrollment.batch?._id || '',
            enrollmentDate: toDateInputValue(enrollment.enrollmentDate),
            status: enrollment.status,
            remarks: enrollment.remarks || '',
          }
        : { ...EMPTY_FORM, enrollmentDate: toDateInputValue(new Date()) }
    );
    setErrors({});
    setFormError('');
  }, [open, enrollment, isEdit]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!isEdit && !form.student) next.student = 'Select a student';
    if (!isEdit && !form.batch) next.batch = 'Select a batch';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await enrollmentApi.update(enrollment._id, { status: form.status, remarks: form.remarks });
        toast.success('Enrollment updated successfully.');
      } else {
        await enrollmentApi.create(form);
        toast.success('Student enrolled successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this enrollment.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Update enrollment' : 'Enroll student'}
      description={isEdit ? 'Update the status or remarks for this enrollment.' : 'Enroll a student into a batch.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Enroll student'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        {!isEdit && (
          <>
            <Select
              label="Student"
              required
              placeholder="Select student"
              value={form.student}
              error={errors.student}
              onChange={(e) => update('student', e.target.value)}
            >
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </Select>
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
            <Input
              label="Enrollment date"
              type="date"
              value={form.enrollmentDate}
              onChange={(e) => update('enrollmentDate', e.target.value)}
            />
          </>
        )}
        <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Dropped">Dropped</option>
          <option value="Cancelled">Cancelled</option>
        </Select>
        <Textarea
          label="Remarks"
          placeholder="Optional notes about this enrollment"
          value={form.remarks}
          onChange={(e) => update('remarks', e.target.value)}
        />
      </form>
    </Modal>
  );
}
