import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt, Plus, Trash2, X } from 'lucide-react';
import { paymentApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { TableSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { formatCurrency, formatDateTime, getErrorMessage } from '../../utils/formatters';
import PaymentFormModal from './PaymentFormModal';

export default function PaymentsPage() {
  const { data: payments, loading, error, refetch } = useFetch(() => paymentApi.list(), []);
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === ROLES.ADMIN;
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdFilter = searchParams.get('studentId');

  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filteredStudentName = useMemo(() => {
    if (!studentIdFilter || !payments) return null;
    const match = payments.find((p) => p.studentFee?.student?._id === studentIdFilter);
    return match?.studentFee?.student?.fullName || null;
  }, [studentIdFilter, payments]);

  const filtered = useMemo(() => {
    if (!payments) return [];
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesStudent = !studentIdFilter || p.studentFee?.student?._id === studentIdFilter;
      const matchesSearch =
        !q ||
        p.studentFee?.student?.fullName?.toLowerCase().includes(q) ||
        p.transactionId?.toLowerCase().includes(q) ||
        p.receiptNumber?.toLowerCase().includes(q);
      const matchesMode = !modeFilter || p.paymentMode === modeFilter;
      return matchesStudent && matchesSearch && matchesMode;
    });
  }, [payments, search, modeFilter, studentIdFilter]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentApi.remove(deleteTarget._id);
      toast.success('Payment record deleted and ledger adjusted.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this payment.'));
    } finally {
      setDeleting(false);
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.studentFee?.student?.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{row.studentFee?.student?.fullName || 'Unknown'}</p>
            <p className="truncate text-xs text-slate-400">{row.studentFee?.feeStructure?.feeName}</p>
          </div>
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', render: (row) => <span className="font-semibold text-emerald-600">{formatCurrency(row.amount)}</span> },
    { key: 'date', header: 'Date', render: (row) => formatDateTime(row.paymentDate) },
    { key: 'mode', header: 'Mode', render: (row) => row.paymentMode },
    {
      key: 'reference',
      header: 'Reference',
      hideOnMobile: true,
      render: (row) => <span className="text-xs text-slate-400">{row.transactionId || row.receiptNumber}</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.paymentStatus} /> },
    isAdmin && {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton items={[{ label: 'Delete payment', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) }]} />
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <PageHeader
        title="Payments"
        description="A complete log of fee payments collected across your institute."
        actions={
          isAdmin && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Record payment
            </Button>
          )
        }
      />

      {studentIdFilter && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3.5 py-2 text-sm text-primary-700">
          Showing payments for <span className="font-medium">{filteredStudentName || 'this student'}</span>
          <button
            onClick={() => setSearchParams({})}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student or reference…" className="sm:w-72" />
          <Select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="sm:w-44">
            <option value="">All payment modes</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Cheque">Cheque</option>
          </Select>
        </div>
        <p className="text-sm text-slate-400">
          {loading ? 'Loading…' : `${filtered.length} payment${filtered.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && <TableSkeleton cols={6} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Receipt}
          title={search || modeFilter || studentIdFilter ? 'No payments match your filters' : 'No payments yet'}
          description={search || modeFilter || studentIdFilter ? 'Try adjusting your search or filters.' : 'Recorded payments will appear here.'}
          action={
            isAdmin &&
            !search &&
            !modeFilter &&
            !studentIdFilter && (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />
                Record payment
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && <Table columns={columns} data={filtered} />}

      <PaymentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this payment?"
        description="The student's fee ledger balance will be adjusted automatically."
        confirmLabel="Delete"
      />
    </div>
  );
}
