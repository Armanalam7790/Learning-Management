import { useEffect, useMemo, useState } from 'react';
import { paymentApi, studentFeeApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { formatCurrency, getErrorMessage } from '../../utils/formatters';

const EMPTY_FORM = { studentFee: '', amount: '', paymentMode: 'Cash', transactionId: '', remarks: '' };

export default function PaymentFormModal({ open, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [ledgers, setLedgers] = useState([]);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    studentFeeApi
      .list()
      .then(({ data }) => setLedgers(data.data.filter((l) => l.pendingAmount > 0)))
      .catch(() => setLedgers([]));
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError('');
  }, [open]);

  const selectedLedger = useMemo(() => ledgers.find((l) => l._id === form.studentFee), [ledgers, form.studentFee]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.studentFee) next.studentFee = 'Select a student fee ledger';
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      next.amount = 'Enter a valid amount';
    } else if (selectedLedger && amount > selectedLedger.pendingAmount) {
      next.amount = `Cannot exceed pending balance of ${formatCurrency(selectedLedger.pendingAmount)}`;
    }
    if (!form.paymentMode.trim()) next.paymentMode = 'Select a payment mode';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await paymentApi.create({
        studentFee: form.studentFee,
        amount: Number(form.amount),
        paymentMode: form.paymentMode,
        transactionId: form.transactionId,
        remarks: form.remarks,
      });
      toast.success('Payment recorded successfully.');
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not record this payment.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description="Collect a payment against a student's fee ledger."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            Record payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        <Select
          label="Student fee ledger"
          required
          placeholder="Select a ledger with pending balance"
          value={form.studentFee}
          error={errors.studentFee}
          onChange={(e) => update('studentFee', e.target.value)}
        >
          {ledgers.map((l) => (
            <option key={l._id} value={l._id}>
              {l.student?.fullName} — {l.feeStructure?.feeName} (pending {formatCurrency(l.pendingAmount)})
            </option>
          ))}
        </Select>
        <Input
          label="Amount"
          type="number"
          min="1"
          required
          hint={selectedLedger ? `Pending balance: ${formatCurrency(selectedLedger.pendingAmount)}` : undefined}
          value={form.amount}
          error={errors.amount}
          onChange={(e) => update('amount', e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Payment mode" required value={form.paymentMode} error={errors.paymentMode} onChange={(e) => update('paymentMode', e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </Select>
          <Input
            label="Transaction ID"
            placeholder="TXN-99901"
            hint="Optional"
            value={form.transactionId}
            onChange={(e) => update('transactionId', e.target.value)}
          />
        </div>
        <Textarea
          label="Remarks"
          placeholder="Optional notes"
          value={form.remarks}
          onChange={(e) => update('remarks', e.target.value)}
        />
      </form>
    </Modal>
  );
}
