import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { instituteApi, authApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

const STEPS = ['Institute details', 'Administrator account'];

export default function Onboarding() {
  const { login, isAuthenticated, initializing } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [instituteId, setInstituteId] = useState(null);

  const [institute, setInstitute] = useState({
    instituteName: '',
    instituteCode: '',
    email: '',
    phone: '',
    ownerName: '',
    country: '',
    state: '',
    city: '',
    pincode: '',
    fullAddress: '',
  });

  const [admin, setAdmin] = useState({ fullName: '', email: '', password: '', phone: '' });

  if (!initializing && isAuthenticated) return <Navigate to="/" replace />;

  function updateInstitute(key, value) {
    setInstitute((prev) => ({ ...prev, [key]: value }));
  }
  function updateAdmin(key, value) {
    setAdmin((prev) => ({ ...prev, [key]: value }));
  }

  async function handleInstituteSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const { data } = await instituteApi.register({
        instituteName: institute.instituteName,
        instituteCode: institute.instituteCode.toUpperCase(),
        email: institute.email,
        phone: institute.phone,
        ownerName: institute.ownerName,
        address: {
          country: institute.country,
          state: institute.state,
          city: institute.city,
          pincode: institute.pincode,
          fullAddress: institute.fullAddress,
        },
      });
      setInstituteId(data.data._id);
      setAdmin((prev) => ({ ...prev, email: prev.email || institute.email }));
      setStep(1);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not register the institute.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdminSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await authApi.setupAdmin({
        fullName: admin.fullName,
        email: admin.email,
        password: admin.password,
        phone: admin.phone,
        institute: instituteId,
      });
      const user = await login(admin.email, admin.password);
      toast.success(`Institute ready. Welcome, ${user.fullName.split(' ')[0]}.`);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create the administrator account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-pop">
            <GraduationCap className="h-5.5 w-5.5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Set up your institute</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Two quick steps and you're ready to manage your institute.</p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-3">
          {STEPS.map((label, idx) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ' +
                    (idx < step
                      ? 'bg-primary-600 text-white'
                      : idx === step
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500/30 dark:bg-primary-500/15 dark:text-primary-400'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500')
                  }
                >
                  {idx < step ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <span className={idx === step ? 'text-sm font-medium text-slate-800 dark:text-slate-100' : 'text-sm text-slate-400 dark:text-slate-500'}>
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && <div className="h-px w-6 bg-slate-200 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{formError}</div>
          )}

          {step === 0 ? (
            <form onSubmit={handleInstituteSubmit} className="flex flex-col gap-4">
              <Input
                label="Institute name"
                required
                placeholder="Cambridge International Academy"
                value={institute.instituteName}
                onChange={(e) => updateInstitute('instituteName', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Institute code"
                  required
                  placeholder="CIA2026"
                  hint="Unique short code"
                  value={institute.instituteCode}
                  onChange={(e) => updateInstitute('instituteCode', e.target.value)}
                />
                <Input
                  label="Owner name"
                  required
                  placeholder="Jane Doe"
                  value={institute.ownerName}
                  onChange={(e) => updateInstitute('ownerName', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Institute email"
                  type="email"
                  required
                  placeholder="contact@institute.edu"
                  value={institute.email}
                  onChange={(e) => updateInstitute('email', e.target.value)}
                />
                <Input
                  label="Phone"
                  required
                  placeholder="9876543210"
                  value={institute.phone}
                  onChange={(e) => updateInstitute('phone', e.target.value)}
                />
              </div>
              <Input
                label="Full address"
                required
                placeholder="123 Campus Road"
                value={institute.fullAddress}
                onChange={(e) => updateInstitute('fullAddress', e.target.value)}
              />
              <div className="grid grid-cols-3 gap-4">
                <Input label="City" required value={institute.city} onChange={(e) => updateInstitute('city', e.target.value)} />
                <Input label="State" required value={institute.state} onChange={(e) => updateInstitute('state', e.target.value)} />
                <Input
                  label="Pincode"
                  required
                  value={institute.pincode}
                  onChange={(e) => updateInstitute('pincode', e.target.value)}
                />
              </div>
              <Input
                label="Country"
                required
                placeholder="India"
                value={institute.country}
                onChange={(e) => updateInstitute('country', e.target.value)}
              />
              <Button type="submit" size="lg" className="mt-1 w-full justify-center" loading={submitting}>
                Continue
                {!submitting && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
              <Input
                label="Full name"
                required
                placeholder="Jane Doe"
                value={admin.fullName}
                onChange={(e) => updateAdmin('fullName', e.target.value)}
              />
              <Input
                label="Email address"
                type="email"
                required
                placeholder="admin@institute.edu"
                value={admin.email}
                onChange={(e) => updateAdmin('email', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone"
                  required
                  placeholder="9876543210"
                  value={admin.phone}
                  onChange={(e) => updateAdmin('phone', e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={admin.password}
                  onChange={(e) => updateAdmin('password', e.target.value)}
                />
              </div>
              <div className="mt-1 flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={() => setStep(0)} disabled={submitting}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" size="lg" className="flex-1 justify-center" loading={submitting}>
                  Create institute
                </Button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
