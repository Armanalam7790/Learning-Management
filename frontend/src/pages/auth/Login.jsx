import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

export default function Login() {
  const { login, isAuthenticated, initializing } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  if (!initializing && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/'} replace />;
  }

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}.`);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Invalid email or password.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white shadow-pop">
            <GraduationCap className="h-5.5 w-5.5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Sign in to Orbit LMS</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Manage students, batches, fees and more.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4">
            {formError && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">{formError}</div>
            )}
            <Input
              label="Email address"
              type="email"
              name="email"
              icon={Mail}
              placeholder="you@institute.edu"
              required
              autoComplete="email"
              value={form.email}
              error={errors.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              icon={Lock}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={form.password}
              error={errors.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <Button type="submit" size="lg" className="mt-1 w-full justify-center" loading={submitting}>
              {!submitting && (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
              {submitting && 'Signing in…'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Setting up a new institute?{' '}
          <Link to="/onboarding" className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
