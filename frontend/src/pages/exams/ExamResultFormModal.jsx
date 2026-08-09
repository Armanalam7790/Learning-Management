import { useEffect, useState } from 'react';
import { examApi, examResultApi, enrollmentApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { computeGrade } from '../../utils/constants';
import { getErrorMessage } from '../../utils/formatters';

export default function ExamResultFormModal({ open, onClose, exam, result, existingResults, onSaved }) {
  const isEdit = Boolean(result);
  const [form, setForm] = useState({ student: '', obtainedMarks: '', grade: '', remarks: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [students, setStudents] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    if (!isEdit && exam?.batch?._id) {
      enrollmentApi
        .byBatch(exam.batch._id)
        .then(({ data }) => {
          const alreadyGraded = new Set((existingResults || []).map((r) => r.student?._id));
          setStudents(
            data.data
              .filter((e) => e.status === 'Active' && !alreadyGraded.has(e.student?._id))
              .map((e) => e.student)
          );
        })
        .catch(() => setStudents([]));
    }
    setForm(
      result
        ? {
            student: result.student?._id || '',
            obtainedMarks: String(result.obtainedMarks),
            grade: result.grade || '',
            remarks: result.remarks || '',
          }
        : { student: '', obtainedMarks: '', grade: '', remarks: '' }
    );
    setErrors({});
    setFormError('');
  }, [open, exam, result, isEdit, existingResults]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleMarksChange(value) {
    const marks = Number(value);
    const auto =
      value !== '' && !Number.isNaN(marks) && exam?.maximumMarks
        ? computeGrade((marks / exam.maximumMarks) * 100)
        : form.grade;
    setForm((f) => ({ ...f, obtainedMarks: value, grade: auto }));
  }

  function validate() {
    const next = {};
    if (!isEdit && !form.student) next.student = 'Select a student';
    const marks = Number(form.obtainedMarks);
    if (form.obtainedMarks === '' || Number.isNaN(marks) || marks < 0 || marks > exam.maximumMarks) {
      next.obtainedMarks = `Enter marks between 0 and ${exam.maximumMarks}`;
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
      const payload = { obtainedMarks: Number(form.obtainedMarks), grade: form.grade, remarks: form.remarks };
      if (isEdit) {
        await examResultApi.update(result._id, payload);
        toast.success('Result updated successfully.');
      } else {
        await examApi.createResult(exam._id, { ...payload, student: form.student });
        toast.success('Result submitted successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this result.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Update result' : 'Add exam result'}
      description={`Out of ${exam?.maximumMarks} marks`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Submit result'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        {!isEdit && (
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
                {s.fullName}
              </option>
            ))}
          </Select>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Obtained marks"
            type="number"
            min="0"
            max={exam?.maximumMarks}
            required
            value={form.obtainedMarks}
            error={errors.obtainedMarks}
            onChange={(e) => handleMarksChange(e.target.value)}
          />
          <Input label="Grade" value={form.grade} onChange={(e) => update('grade', e.target.value)} />
        </div>
        <Textarea
          label="Remarks"
          placeholder="Optional evaluator remarks"
          value={form.remarks}
          onChange={(e) => update('remarks', e.target.value)}
        />
      </form>
    </Modal>
  );
}
