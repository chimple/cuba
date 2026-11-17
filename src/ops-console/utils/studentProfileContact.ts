import { normalizeIndianPhone10 } from './phoneNormalization';

export const DUPLICATE_STUDENT_PROFILE_MESSAGE =
  'A student profile with this name and phone number already exists. Please select the existing profile instead.';

export type ParsedStudentProfileContact = {
  value: string;
  phone?: string;
  email?: string;
};

export const parseStudentProfileContact = (
  rawContact: string,
): ParsedStudentProfileContact | null => {
  const contact = rawContact.trim();
  if (!contact) return { value: '' };

  if (contact.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
      ? { value: contact.toLowerCase(), email: contact.toLowerCase() }
      : null;
  }

  const phone = normalizeIndianPhone10(contact);
  return phone ? { value: phone, phone } : null;
};
