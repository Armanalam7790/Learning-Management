import { useEffect, useState } from 'react';
import { submissionApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

export default function SubmissionGradeModal({ open, onClose, submission, maximumMarks, onSaved }) {
  const [form, setForm] = useState({ marksObtained: '', feedback: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (open && submission) {
      setForm({
        marksObtained: submission.marksObtained != null ? String(submission.marksObtained) : '',
        feedback: submission.feedback || '',
      });
      setErrors({});
      setFormError('');
    }
  }, [open, submission]);

  function validate() {
    const next = {};
    const marks = Number(form.marksObtained);
    if (form.marksObtained === '' || Number.isNaN(marks) || marks < 0 || marks > maximumMarks) {
      next.marksObtained = `Enter marks between 0 and ${maximumMarks}`;
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
      await submissionApi.grade(submission._id, { marksObtained: Number(form.marksObtained), feedback: form.feedback });
      toast.success('Submission graded successfully.');
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not grade this submission.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!submission) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Grade submission — ${submission.student?.fullName}`}
      description={`Out of ${maximumMarks} marks`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Save grade
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        {submission.submissionText && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
            {submission.submissionText}
          </div>
        )}
        <Input
          label="Marks obtained"
          type="number"
          min="0"
          max={maximumMarks}
          required
          value={form.marksObtained}
          error={errors.marksObtained}
          onChange={(e) => setForm((f) => ({ ...f, marksObtained: e.target.value }))}
        />
        <Textarea
          label="Feedback"
          placeholder="Share feedback with the student"
          value={form.feedback}
          onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))}
        />
      </form>
    </Modal>
  );
}
