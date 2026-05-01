import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface FormData {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  interests: string[];
  contact: string;
  message: string;
  notes: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
}

export interface SubmittedResult {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  interests: string;
  contact: string;
  message: string;
  notes: string;
}

export interface AiInterpretResult {
  name?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  interests?: string[];
  contact_method?: string;
  message?: string;
}

const COUNTRY_OPTIONS = [
  { value: '', label: 'Select Country' },
  { value: 'no', label: 'Norway' },
  { value: 'se', label: 'Sweden' },
  { value: 'dk', label: 'Denmark' },
  { value: 'fi', label: 'Finland' },
  { value: 'other', label: 'Other' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INITIAL_FORM: FormData = {
  name: '', email: '', address: '', city: '', country: '',
  interests: [], contact: '', message: '', notes: '',
};

export function validateField(field: keyof FormData, value: string): string | undefined {
  switch (field) {
    case 'name':
      if (!value.trim()) return 'Name is required';
      if (value.trim().length < 2) return 'Name must be at least 2 characters';
      return undefined;
    case 'email':
      if (!value.trim()) return 'Email is required';
      if (!EMAIL_REGEX.test(value)) return 'Please enter a valid email address';
      return undefined;
    default:
      return undefined;
  }
}

export function applyAiPatch(form: FormData, data: AiInterpretResult): FormData {
  return {
    ...form,
    name: data.name || form.name,
    email: data.email || form.email,
    address: data.address || form.address,
    city: data.city || form.city,
    country: data.country || form.country,
    interests: Array.isArray(data.interests) && data.interests.length > 0
      ? data.interests : form.interests,
    contact: data.contact_method || form.contact,
    message: data.message || form.message,
  };
}

export function useContactForm() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<SubmittedResult | null>(null);
  const [dbStatus, setDbStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setClubId(data.club_id);
        });
    });
  }, []);

  useEffect(() => {
    const newErrors: FormErrors = {};
    if (touched.name) {
      const err = validateField('name', form.name);
      if (err) newErrors.name = err;
    }
    if (touched.email) {
      const err = validateField('email', form.email);
      if (err) newErrors.email = err;
    }
    setErrors(newErrors);
  }, [form.name, form.email, touched]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const updateField = useCallback((field: keyof FormData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleInterestChange = useCallback((value: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      interests: checked
        ? [...prev.interests, value]
        : prev.interests.filter(i => i !== value),
    }));
  }, []);

  const patchFromAi = useCallback((data: AiInterpretResult) => {
    setForm(prev => applyAiPatch(prev, data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    const nameError = validateField('name', form.name);
    const emailError = validateField('email', form.email);

    if (nameError || emailError) {
      setErrors({ name: nameError, email: emailError });
      return;
    }

    setIsSubmitting(true);
    setShowSuccess(false);

    const countryLabel = COUNTRY_OPTIONS.find(c => c.value === form.country)?.label || '—';
    setResult({
      name: form.name || '—',
      email: form.email || '—',
      address: form.address || '—',
      city: form.city || '—',
      country: form.country ? countryLabel : '—',
      interests: form.interests.join(', ') || '—',
      contact: form.contact || '—',
      message: form.message || '—',
      notes: form.notes || '—',
    });

    try {
      const supabase = createClient();
      const { error } = await supabase.from('contacts').insert({
        name: form.name,
        email: form.email,
        address: form.address || null,
        city: form.city || null,
        country: form.country || null,
        interests: form.interests,
        contact_method: form.contact || null,
        message: form.message || null,
        notes: form.notes || null,
        club_id: clubId,
      });

      if (error) {
        setDbStatus({ message: `Failed to save: ${error.message}. Please try again.`, isError: true });
      } else {
        setDbStatus({ message: 'Your message has been sent successfully!', isError: false });
        setShowSuccess(true);
      }
    } catch (err) {
      setDbStatus({
        message: `Connection error: ${err instanceof Error ? err.message : 'Please check your internet connection and try again.'}`,
        isError: true,
      });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setDbStatus(null), 5000);
    }
  };

  const handleReset = useCallback(() => {
    setForm(INITIAL_FORM);
    setResult(null);
    setErrors({});
    setTouched({});
    setShowSuccess(false);
  }, []);

  return {
    form,
    errors,
    result,
    dbStatus,
    isSubmitting,
    showSuccess,
    updateField,
    handleInterestChange,
    handleBlur,
    handleSubmit,
    handleReset,
    patchFromAi,
  };
}
