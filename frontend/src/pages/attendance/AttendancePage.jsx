import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Save, Users } from 'lucide-react';
import { batchApi, enrollmentApi, attendanceApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { PageLoader } from '../../components/ui/Loading';
import { cn } from '../../utils/cn';
import { getErrorMessage, toDateInputValue } from '../../utils/formatters';

const STATUSES = [
  { value: 'Present', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200', activeTone: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'Absent', tone: 'text-red-700 bg-red-50 border-red-200', activeTone: 'bg-red-600 text-white border-red-600' },
  { value: 'Late', tone: 'text-amber-700 bg-amber-50 border-amber-200', activeTone: 'bg-amber-600 text-white border-amber-600' },
  { value: 'Leave', tone: 'text-slate-600 bg-slate-50 border-slate-200', activeTone: 'bg-slate-600 text-white border-slate-600' },
];

export default function AttendancePage() {
  const toast = useToast();
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [date, setDate] = useState(toDateInputValue(new Date()));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roster, setRoster] = useState([]); // [{ enrollmentId, student, recordId, status, remarks }]
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    batchApi
      .list()
      .then(({ data }) => {
        setBatches(data.data);
        if (data.data.length > 0) setBatchId(data.data[0]._id);
      })
      .catch(() => setBatches([]));
  }, []);

  const loadRoster = useCallback(async () => {
    if (!batchId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const [enrollmentsRes, attendanceRes] = await Promise.all([
        enrollmentApi.byBatch(batchId),
        attendanceApi.byBatch(batchId),
      ]);
      const activeEnrollments = enrollmentsRes.data.data.filter((e) => e.status === 'Active');
      const existingForDate = attendanceRes.data.data.filter(
        (a) => toDateInputValue(a.attendanceDate) === date
      );

      setRoster(
        activeEnrollments.map((enr) => {
          const existing = existingForDate.find((a) => a.student?._id === enr.student?._id);
          return {
            enrollmentId: enr._id,
            student: enr.student,
            recordId: existing?._id || null,
            status: existing?.status || 'Present',
            remarks: existing?.remarks || '',
            dirty: false,
          };
        })
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [batchId, date]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  function setStatus(studentId, status) {
    setRoster((prev) => prev.map((r) => (r.student._id === studentId ? { ...r, status, dirty: true } : r)));
  }

  function markAll(status) {
    setRoster((prev) => prev.map((r) => ({ ...r, status, dirty: true })));
  }

  const summary = useMemo(() => {
    const counts = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    roster.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [roster]);

  async function handleSave() {
    const dirtyRows = roster.filter((r) => r.dirty || !r.recordId);
    if (dirtyRows.length === 0) {
      toast.info('No attendance changes to save.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        dirtyRows.map((row) =>
          row.recordId
            ? attendanceApi.update(row.recordId, { status: row.status, remarks: row.remarks })
            : attendanceApi.create({
                student: row.student._id,
                batch: batchId,
                attendanceDate: date,
                status: row.status,
                remarks: row.remarks,
              })
        )
      );
      toast.success('Attendance saved successfully.');
      loadRoster();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save attendance for all students.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader title="Attendance" description="Mark and review daily attendance by batch." />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card sm:flex-row sm:items-end">
        <Select label="Batch" value={batchId} onChange={(e) => setBatchId(e.target.value)} className="sm:w-64">
          {batches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.batchName} ({b.batchCode})
            </option>
          ))}
        </Select>
        <Input label="Date" type="date" value={date} max={toDateInputValue(new Date())} onChange={(e) => setDate(e.target.value)} className="sm:w-48" />
        <div className="flex-1" />
        <Button onClick={handleSave} loading={saving} disabled={loading || roster.length === 0}>
          <Save className="h-4 w-4" />
          Save attendance
        </Button>
      </div>

      {loading && <PageLoader label="Loading roster…" />}
      {!loading && error && <ErrorState message={error} onRetry={loadRoster} />}

      {!loading && !error && batches.length === 0 && (
        <EmptyState icon={CalendarCheck} title="No batches available" description="Create a batch before marking attendance." />
      )}

      {!loading && !error && batches.length > 0 && roster.length === 0 && (
        <EmptyState icon={Users} title="No active students in this batch" description="Enroll students into this batch to mark attendance." />
      )}

      {!loading && !error && roster.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {STATUSES.map((s) => (
              <div key={s.value} className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium', s.tone)}>
                <span>{s.value}</span>
                <span className="font-semibold">{summary[s.value] || 0}</span>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-400">Mark all:</span>
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => markAll(s.value)}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="divide-y divide-slate-100">
              {roster.map((row) => (
                <div key={row.enrollmentId} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={row.student?.fullName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{row.student?.fullName}</p>
                      <p className="text-xs text-slate-400">{row.student?.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStatus(row.student._id, s.value)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                          row.status === s.value ? s.activeTone : cn(s.tone, 'opacity-60 hover:opacity-100')
                        )}
                      >
                        {s.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
