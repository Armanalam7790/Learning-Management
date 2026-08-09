import { useEffect, useState } from 'react';
import { Building2, Mail, Phone, Save } from 'lucide-react';
import { instituteApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import DetailList from '../../components/ui/DetailList';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';
import { CardSkeleton } from '../../components/ui/Loading';
import { formatDate, getErrorMessage } from '../../utils/formatters';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your profile and institute preferences." />

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">My profile</h2>
        <div className="flex items-center gap-4">
          <Avatar name={user?.fullName} src={user?.profileImage} size="lg" />
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">{user?.fullName}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-5">
          <DetailList
            items={[
              { label: 'Phone', value: user?.phone },
              { label: 'Role', value: <Badge tone="primary"><span className="capitalize">{user?.role}</span></Badge> },
              { label: 'Account status', value: <Badge status={user?.isActive === false ? 'Inactive' : 'Active'} /> },
              { label: 'Last login', value: user?.lastLogin ? formatDate(user.lastLogin) : 'Now' },
            ]}
          />
        </div>
      </div>

      {isAdmin && <InstituteSettings />}
    </div>
  );
}

function InstituteSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!user?.institute) return;
    setLoading(true);
    instituteApi
      .getById(user.institute)
      .then(({ data }) => {
        if (cancelled) return;
        const inst = data.data;
        setForm({
          instituteName: inst.instituteName,
          email: inst.email,
          phone: inst.phone,
          website: inst.website || '',
          ownerName: inst.ownerName,
          country: inst.address?.country || '',
          state: inst.address?.state || '',
          city: inst.address?.city || '',
          pincode: inst.address?.pincode || '',
          fullAddress: inst.address?.fullAddress || '',
        });
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user?.institute]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await instituteApi.update(user.institute, {
        instituteName: form.instituteName,
        phone: form.phone,
        website: form.website,
        ownerName: form.ownerName,
        address: {
          country: form.country,
          state: form.state,
          city: form.city,
          pincode: form.pincode,
          fullAddress: form.fullAddress,
        },
      });
      toast.success('Institute settings updated successfully.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update institute settings.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <CardSkeleton className="h-96" />;
  if (error) return <ErrorState message={error} />;
  if (!form) return null;

  return (
    <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        Institute settings
      </h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">These details apply across your institute.</p>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Institute name" required value={form.instituteName} onChange={(e) => update('instituteName', e.target.value)} />
          <Input label="Owner name" required value={form.ownerName} onChange={(e) => update('ownerName', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Email" icon={Mail} value={form.email} disabled hint="Contact support to change your institute email" />
          <Input label="Phone" icon={Phone} required value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <Input label="Website" placeholder="https://…" value={form.website} onChange={(e) => update('website', e.target.value)} />
        <Input label="Full address" required value={form.fullAddress} onChange={(e) => update('fullAddress', e.target.value)} />
        <div className="grid grid-cols-3 gap-4">
          <Input label="City" required value={form.city} onChange={(e) => update('city', e.target.value)} />
          <Input label="State" required value={form.state} onChange={(e) => update('state', e.target.value)} />
          <Input label="Pincode" required value={form.pincode} onChange={(e) => update('pincode', e.target.value)} />
        </div>
        <Input label="Country" required value={form.country} onChange={(e) => update('country', e.target.value)} />

        <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" />
            Save institute settings
          </Button>
        </div>
      </div>
    </form>
  );
}
