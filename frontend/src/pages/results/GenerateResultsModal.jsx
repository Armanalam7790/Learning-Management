import { useEffect, useState } from 'react';
import { academicResultApi, examApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

export default function GenerateResultsModal({ open, onClose, onSaved }) {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    examApi.list().then(({ data }) => setExams(data.data)).catch(() => setExams([]));
    setExamId('');
    setFormError('');
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!examId) {
      setFormError('Select an exam to generate results for.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const { data } = await academicResultApi.generateForBatch(examId);
      toast.success(`Generated results for ${data.data.length} student${data.data.length === 1 ? '' : 's'}.`);
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not generate results.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate academic results"
      description="Compiles results for every actively enrolled student in the exam's batch."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Generate results
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        <Select label="Exam" required placeholder="Select an exam" value={examId} onChange={(e) => setExamId(e.target.value)}>
          {exams.map((ex) => (
            <option key={ex._id} value={ex._id}>
              {ex.title} — {ex.batch?.batchName}
            </option>
          ))}
        </Select>
      </form>
    </Modal>
  );
}
