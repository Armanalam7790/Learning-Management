import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, AlertCircle, Receipt, Plus, Pencil, Trash2, FileStack, Users2, Eye } from 'lucide-react';
import { feeStructureApi, studentFeeApi } from '../../api/endpoints';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import SearchInput from '../../components/ui/SearchInput';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { TableSkeleton, CardSkeleton } from '../../components/ui/Loading';
import { MenuButton } from '../../components/ui/Menu';
import { formatCurrency, getErrorMessage } from '../../utils/formatters';
import FeeStructureFormModal from './FeeStructureFormModal';
import StudentFeeFormModal from './StudentFeeFormModal';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'structures', label: 'Fee Structures' },
  { value: 'student-fees', label: 'Student Fees' },
];

export default function FeeManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const isAdmin = user?.role === ROLES.ADMIN;

  const [tab, setTab] = useState('overview');

  const { data: structures, loading: structuresLoading, error: structuresError, refetch: refetchStructures } = useFetch(
    () => feeStructureApi.list(),
    []
  );
  const { data: studentFees, loading: feesLoading, error: feesError, refetch: refetchFees } = useFetch(
    () => studentFeeApi.list(),
    []
  );

  const overview = useMemo(() => {
    if (!studentFees) return null;
    const totalFees = studentFees.reduce((s, f) => s + (f.totalFee || 0), 0);
    const collected = studentFees.reduce((s, f) => s + (f.paidAmount || 0), 0);
    const pending = studentFees.reduce((s, f) => s + (f.pendingAmount || 0), 0);
    const unpaidBalance = studentFees.filter((f) => f.status === 'Unpaid').reduce((s, f) => s + (f.pendingAmount || 0), 0);
    const collectionRate = totalFees > 0 ? Math.round((collected / totalFees) * 100) : 0;
    return { totalFees, collected, pending, unpaidBalance, collectionRate, count: studentFees.length };
  }, [studentFees]);

  return (
    <div>
      <PageHeader title="Fee Management" description="Overview, fee structures and student fee ledgers." />

      <div className="mb-5">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === 'overview' && (
        <OverviewTab overview={overview} loading={feesLoading} error={feesError} onRetry={refetchFees} />
      )}

      {tab === 'structures' && (
        <StructuresTab
          structures={structures}
          loading={structuresLoading}
          error={structuresError}
          refetch={refetchStructures}
          isAdmin={isAdmin}
        />
      )}

      {tab === 'student-fees' && (
        <StudentFeesTab
          studentFees={studentFees}
          loading={feesLoading}
          error={feesError}
          refetch={refetchFees}
          isAdmin={isAdmin}
          onViewPayments={(studentId) => navigate(`/payments?studentId=${studentId}`)}
        />
      )}
    </div>
  );
}

function OverviewTab({ overview, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (!overview) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Expected Fees" value={formatCurrency(overview.totalFees)} icon={Wallet} tone="slate" sub={`${overview.count} ledgers`} />
        <StatCard label="Total Collected" value={formatCurrency(overview.collected)} icon={TrendingUp} tone="success" />
        <StatCard label="Total Pending" value={formatCurrency(overview.pending)} icon={AlertCircle} tone="warning" />
        <StatCard label="Unpaid Balance" value={formatCurrency(overview.unpaidBalance)} icon={Receipt} tone="danger" sub="No payment made yet" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700">Collection progress</span>
          <span className="font-semibold text-primary-600">{overview.collectionRate}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary-600 transition-all duration-500" style={{ width: `${overview.collectionRate}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{formatCurrency(overview.collected)} collected</span>
          <span>{formatCurrency(overview.pending)} pending</span>
        </div>
      </div>
    </div>
  );
}

function StructuresTab({ structures, loading, error, refetch, isAdmin }) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    if (!structures) return [];
    const q = search.trim().toLowerCase();
    if (!q) return structures;
    return structures.filter(
      (s) => s.feeName.toLowerCase().includes(q) || s.batch?.batchName?.toLowerCase().includes(q)
    );
  }, [structures, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  async function handleDelete(structure) {
    try {
      await feeStructureApi.remove(structure._id);
      toast.success('Fee structure deleted successfully.');
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this fee structure.'));
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Fee structure',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800">{row.feeName}</p>
          <p className="truncate text-xs text-slate-400">{row.batch?.batchName} · {row.academicYear}</p>
        </div>
      ),
    },
    { key: 'total', header: 'Total fee', render: (row) => formatCurrency(row.totalFee) },
    { key: 'plan', header: 'Installment plan', render: (row) => row.installmentPlan },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    isAdmin && {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'Edit', icon: Pencil, onClick: () => { setEditing(row); setFormOpen(true); } },
              { label: 'Delete', icon: Trash2, danger: true, onClick: () => handleDelete(row) },
            ]}
          />
        </div>
      ),
    },
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by fee name or batch…" className="sm:w-72" />
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Create fee structure
          </Button>
        )}
      </div>

      {loading && <TableSkeleton cols={4} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={FileStack}
          title={search ? 'No fee structures match your search' : 'No fee structures yet'}
          description={search ? 'Try a different search term.' : 'Create a fee structure to start assigning fees to students.'}
          action={
            isAdmin &&
            !search && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Create fee structure
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && <Table columns={columns} data={filtered} />}

      <FeeStructureFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        feeStructure={editing}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

function StudentFeesTab({ studentFees, loading, error, refetch, isAdmin, onViewPayments }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    if (!studentFees) return [];
    const q = search.trim().toLowerCase();
    return studentFees.filter((f) => {
      const matchesSearch = !q || f.student?.fullName?.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [studentFees, search, statusFilter]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.student?.fullName} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">{row.student?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{row.batch?.batchName}</p>
          </div>
        </div>
      ),
    },
    { key: 'total', header: 'Total fee', render: (row) => formatCurrency(row.totalFee) },
    { key: 'paid', header: 'Paid', render: (row) => formatCurrency(row.paidAmount) },
    { key: 'pending', header: 'Pending', render: (row) => formatCurrency(row.pendingAmount) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <MenuButton
            items={[
              { label: 'View payments', icon: Eye, onClick: () => onViewPayments(row.student?._id) },
              isAdmin && { label: 'Adjust ledger', icon: Pencil, onClick: () => { setEditing(row); setFormOpen(true); } },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by student…" className="sm:w-64" />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:w-44">
            <option value="">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Unpaid">Unpaid</option>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Assign fee
          </Button>
        )}
      </div>

      {loading && <TableSkeleton cols={5} />}
      {!loading && error && <ErrorState message={error} onRetry={refetch} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Users2}
          title={search || statusFilter ? 'No fee ledgers match your filters' : 'No student fees yet'}
          description={search || statusFilter ? 'Try adjusting your search or filters.' : 'Assign a fee structure to a student to get started.'}
          action={
            isAdmin &&
            !search &&
            !statusFilter && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" />
                Assign fee
              </Button>
            )
          }
        />
      )}
      {!loading && !error && filtered.length > 0 && <Table columns={columns} data={filtered} />}

      <StudentFeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        studentFee={editing}
        onSaved={() => {
          setFormOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
