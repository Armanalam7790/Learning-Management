import { useEffect, useState } from 'react';
import { feeStructureApi, batchApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

const EMPTY_FORM = {
  batch: '',
  academicYear: '',
  feeName: '',
  tuitionFee: '0',
  admissionFee: '0',
  examFee: '0',
  libraryFee: '0',
  transportFee: '0',
  otherCharges: '0',
  installmentPlan: 'One-time',
  status: 'Active',
};

const FEE_FIELDS = [
  { key: 'tuitionFee', label: 'Tuition fee' },
  { key: 'admissionFee', label: 'Admission fee' },
  { key: 'examFee', label: 'Exam fee' },
  { key: 'libraryFee', label: 'Library fee' },
  { key: 'transportFee', label: 'Transport fee' },
  { key: 'otherCharges', label: 'Other charges' },
];

export default function FeeStructureFormModal({ open, onClose, feeStructure, onSaved }) {
  const isEdit = Boolean(feeStructure);
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
      feeStructure
        ? {
            batch: feeStructure.batch?._id || feeStructure.batch || '',
            academicYear: feeStructure.academicYear,
            feeName: feeStructure.feeName,
            tuitionFee: String(feeStructure.tuitionFee),
            admissionFee: String(feeStructure.admissionFee),
            examFee: String(feeStructure.examFee),
            libraryFee: String(feeStructure.libraryFee),
            transportFee: String(feeStructure.transportFee),
            otherCharges: String(feeStructure.otherCharges),
            installmentPlan: feeStructure.installmentPlan,
            status: feeStructure.status,
          }
        : EMPTY_FORM
    );
    setErrors({});
    setFormError('');
  }, [open, feeStructure]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const total = FEE_FIELDS.reduce((sum, f) => sum + (Number(form[f.key]) || 0), 0);

  function validate() {
    const next = {};
    if (!form.batch) next.batch = 'Select a batch';
    if (!form.academicYear.trim()) next.academicYear = 'Academic year is required';
    if (!form.feeName.trim()) next.feeName = 'Fee name is required';
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
        batch: form.batch,
        academicYear: form.academicYear,
        feeName: form.feeName,
        installmentPlan: form.installmentPlan,
        status: form.status,
        ...Object.fromEntries(FEE_FIELDS.map((f) => [f.key, Number(form[f.key]) || 0])),
      };
      if (isEdit) {
        await feeStructureApi.update(feeStructure._id, payload);
        toast.success('Fee structure updated successfully.');
      } else {
        await feeStructureApi.create(payload);
        toast.success('Fee structure created successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this fee structure.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit fee structure' : 'Create fee structure'}
      description={isEdit ? 'Update the fee breakdown for this batch.' : 'Define a new fee breakdown for a batch.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Create fee structure'}
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
            label="Fee name"
            required
            placeholder="Standard Annual Fee"
            value={form.feeName}
            error={errors.feeName}
            onChange={(e) => update('feeName', e.target.value)}
          />
          <Input
            label="Academic year"
            required
            placeholder="2026-2027"
            value={form.academicYear}
            error={errors.academicYear}
            onChange={(e) => update('academicYear', e.target.value)}
          />
        </div>
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

        <div className="grid grid-cols-3 gap-4">
          {FEE_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={f.label}
              type="number"
              min="0"
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <span className="font-medium text-slate-600">Total fee</span>
          <span className="font-semibold text-slate-900">₹{total.toLocaleString('en-IN')}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Installment plan" value={form.installmentPlan} onChange={(e) => update('installmentPlan', e.target.value)}>
            <option value="One-time">One-time</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Monthly">Monthly</option>
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
      </form>
    </Modal>
  );
}
