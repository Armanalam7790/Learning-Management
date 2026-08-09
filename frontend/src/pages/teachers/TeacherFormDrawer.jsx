import { useEffect, useState } from 'react';
import { teacherApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import Drawer from '../../components/ui/Drawer';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/formatters';

const EMPTY_FORM = { fullName: '', email: '', phone: '', password: '', profileImage: '' };

export default function TeacherFormDrawer({ open, onClose, teacher, onSaved }) {
  const isEdit = Boolean(teacher);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(
        teacher
          ? { fullName: teacher.fullName, email: teacher.email, phone: teacher.phone, password: '', profileImage: teacher.profileImage || '' }
          : EMPTY_FORM
      );
      setErrors({});
      setFormError('');
    }
  }, [open, teacher]);

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    if (!form.phone.trim()) next.phone = 'Phone number is required';
    if (!isEdit && form.password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await teacherApi.update(teacher._id, {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          profileImage: form.profileImage,
        });
        toast.success('Teacher updated successfully.');
      } else {
        await teacherApi.create(form);
        toast.success('Teacher added successfully.');
      }
      onSaved();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save this teacher.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit teacher' : 'Add teacher'}
      description={isEdit ? 'Update this teacher\'s profile details.' : 'Create a new teacher account for your institute.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {isEdit ? 'Save changes' : 'Add teacher'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">{formError}</div>
        )}
        <Input
          label="Full name"
          required
          placeholder="Professor Snape"
          value={form.fullName}
          error={errors.fullName}
          onChange={(e) => update('fullName', e.target.value)}
        />
        <Input
          label="Email address"
          type="email"
          required
          placeholder="teacher@institute.edu"
          value={form.email}
          error={errors.email}
          onChange={(e) => update('email', e.target.value)}
        />
        <Input
          label="Phone number"
          required
          placeholder="9876543210"
          value={form.phone}
          error={errors.phone}
          onChange={(e) => update('phone', e.target.value)}
        />
        {!isEdit && (
          <Input
            label="Temporary password"
            type="password"
            required
            hint="The teacher can change this after logging in."
            placeholder="••••••••"
            value={form.password}
            error={errors.password}
            onChange={(e) => update('password', e.target.value)}
          />
        )}
        <Input
          label="Profile image URL"
          placeholder="https://…"
          hint="Optional"
          value={form.profileImage}
          onChange={(e) => update('profileImage', e.target.value)}
        />
      </form>
    </Drawer>
  );
}
