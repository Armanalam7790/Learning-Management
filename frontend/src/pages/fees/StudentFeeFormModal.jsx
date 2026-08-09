import { useEffect, useState } from 'react';
import { studentFeeApi, studentApi, feeStructureApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { formatCurrency, getErrorMessage } from '../../utils/formatters';

const EMPTY_FORM = { student: '', feeStructure: '', discount: '0', scholarship: '0', lateFee: '0' };

export default function StudentFeeFormModal({ open, onClose, studentFee, onSaved }) {
  const isEdit = Boolean(studentFee);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    if (!isEdit) {
      studentApi.list().then(({ data }) => setStudents(data.data)).catch(() => setStudents([]));
      feeStructureApi.list().then(({ data }) => setFeeStructures(data.data)).catch(() => setFeeStructures([]));
    }
    setForm(
      studentFee
        ? {
            student: studentFee.student?._id || '',
            feeStructure: studentFee.feeStructure?._id || '',
            discount: String(studentFee.discount),
            scholarship: String(studentFee.scholarship),
            lateFee: String(studentFee.lateFee),
          }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError('');
  }, [open, studentFee, isEdit]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!isEdit && !form.student) next.student = 'Select a student';
    if (!isEdit && !form.feeStructure) next.feeStructure = 'Select a fee structure';
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
        discount: Number(form.discount) || 0,
        scholarship: Number(form.scholarship) || 0,
        lateFee: Number(form.lateFee) || 0,
      };
      if (isEdit) {
        await studentFeeApi.update(studentFee._id, payload);
        toast.success('Student fee ledger updated successfully.');
      } else {
        await studentFeeApi.create({ ...payload, student: form.student, feeStructure: form.feeStructure });
        toast.success('Fee structure assigned to student successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this fee ledger.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Adjust fee ledger' : 'Assign fee to student'}
      description={isEdit ? 'Update discount, scholarship or late fee amounts.' : 'Assign a fee structure to a student.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Assign fee'}
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
              label="Fee structure"
              required
              placeholder="Select fee structure"
              value={form.feeStructure}
              error={errors.feeStructure}
              onChange={(e) => update('feeStructure', e.target.value)}
            >
              {feeStructures.map((fs) => (
                <option key={fs._id} value={fs._id}>
                  {fs.feeName} — {fs.batch?.batchName} ({formatCurrency(fs.totalFee)})
                </option>
              ))}
            </Select>
          </>
        )}
        <div className="grid grid-cols-3 gap-4">
          <Input label="Discount" type="number" min="0" value={form.discount} onChange={(e) => update('discount', e.target.value)} />
          <Input label="Scholarship" type="number" min="0" value={form.scholarship} onChange={(e) => update('scholarship', e.target.value)} />
          <Input label="Late fee" type="number" min="0" value={form.lateFee} onChange={(e) => update('lateFee', e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}
