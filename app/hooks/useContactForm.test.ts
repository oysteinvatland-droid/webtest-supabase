import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }));

import { validateField, applyAiPatch, INITIAL_FORM } from './useContactForm';
import type { FormData, AiInterpretResult } from './useContactForm';

describe('validateField', () => {
  describe('name', () => {
    it('requires a value', () => {
      expect(validateField('name', '')).toBe('Name is required');
      expect(validateField('name', '   ')).toBe('Name is required');
    });
    it('requires at least 2 characters', () => {
      expect(validateField('name', 'J')).toBe('Name must be at least 2 characters');
    });
    it('passes for valid names', () => {
      expect(validateField('name', 'Jo')).toBeUndefined();
      expect(validateField('name', 'John Doe')).toBeUndefined();
    });
  });

  describe('email', () => {
    it('requires a value', () => {
      expect(validateField('email', '')).toBe('Email is required');
    });
    it('rejects invalid formats', () => {
      expect(validateField('email', 'notanemail')).toBe('Please enter a valid email address');
      expect(validateField('email', '@nodomain')).toBe('Please enter a valid email address');
      expect(validateField('email', 'missing@')).toBe('Please enter a valid email address');
    });
    it('passes for valid emails', () => {
      expect(validateField('email', 'test@example.com')).toBeUndefined();
      expect(validateField('email', 'user+tag@sub.domain.no')).toBeUndefined();
    });
  });

  it('returns undefined for non-validated fields', () => {
    expect(validateField('address', '')).toBeUndefined();
    expect(validateField('city', 'anything')).toBeUndefined();
    expect(validateField('notes', '')).toBeUndefined();
  });
});

describe('applyAiPatch', () => {
  it('fills empty fields from AI result', () => {
    const result = applyAiPatch(INITIAL_FORM, { name: 'Jane', email: 'jane@example.com' });
    expect(result.name).toBe('Jane');
    expect(result.email).toBe('jane@example.com');
  });

  it('preserves existing form values when AI returns empty strings', () => {
    const form: FormData = { ...INITIAL_FORM, name: 'Existing Name', city: 'Oslo' };
    const result = applyAiPatch(form, { name: '', city: '' });
    expect(result.name).toBe('Existing Name');
    expect(result.city).toBe('Oslo');
  });

  it('replaces interests when AI returns a non-empty array', () => {
    const form: FormData = { ...INITIAL_FORM, interests: ['sport'] };
    const result = applyAiPatch(form, { interests: ['teknologi', 'musikk'] });
    expect(result.interests).toEqual(['teknologi', 'musikk']);
  });

  it('keeps existing interests when AI returns an empty array', () => {
    const form: FormData = { ...INITIAL_FORM, interests: ['sport'] };
    expect(applyAiPatch(form, { interests: [] }).interests).toEqual(['sport']);
  });

  it('keeps existing interests when AI omits the field', () => {
    const form: FormData = { ...INITIAL_FORM, interests: ['sport'] };
    expect(applyAiPatch(form, {}).interests).toEqual(['sport']);
  });

  it('maps contact_method to the contact field', () => {
    const result = applyAiPatch(INITIAL_FORM, { contact_method: 'phone' });
    expect(result.contact).toBe('phone');
  });

  it('never touches the notes field', () => {
    const form: FormData = { ...INITIAL_FORM, notes: 'my dictated notes' };
    const result = applyAiPatch(form, { name: 'Test' } as AiInterpretResult);
    expect(result.notes).toBe('my dictated notes');
  });

  it('returns a new object, does not mutate input', () => {
    const form: FormData = { ...INITIAL_FORM };
    const result = applyAiPatch(form, { name: 'Jane' });
    expect(result).not.toBe(form);
    expect(form.name).toBe('');
  });
});
