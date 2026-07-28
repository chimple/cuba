type ContactLike = {
  id?: string | null;
  phone?: string | number | null;
  email?: string | null;
};

type StudentContactLike = {
  user?: ContactLike | null;
  parent?: ContactLike | null;
  parents?: ContactLike[] | null;
};

export type StudentContactEntry = {
  type: 'phone' | 'email';
  value: string;
};

const normalizePhoneKey = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits || value.trim().toLowerCase();
};

const addUniquePhone = (
  phones: string[],
  seen: Set<string>,
  phone: string | number | null | undefined,
) => {
  const value = String(phone ?? '').trim();
  if (!value) return;

  const key = normalizePhoneKey(value);
  if (!key || seen.has(key)) return;

  seen.add(key);
  phones.push(value);
};

const addUniqueEmail = (
  emails: string[],
  seen: Set<string>,
  email: string | null | undefined,
) => {
  const value = String(email ?? '').trim();
  if (!value) return;

  const key = value.toLowerCase();
  if (seen.has(key)) return;

  seen.add(key);
  emails.push(value);
};

export const getStudentPhoneNumbers = (
  student: StudentContactLike | null | undefined,
): string[] => {
  if (!student) return [];

  const phones: string[] = [];
  const seen = new Set<string>();
  const parents = Array.isArray(student.parents) ? student.parents : [];

  parents.forEach((parent) => addUniquePhone(phones, seen, parent?.phone));
  addUniquePhone(phones, seen, student.parent?.phone);
  addUniquePhone(phones, seen, student.user?.phone);

  return phones;
};

export const getStudentEmailAddresses = (
  student: StudentContactLike | null | undefined,
): string[] => {
  if (!student) return [];

  const emails: string[] = [];
  const seen = new Set<string>();
  const parents = Array.isArray(student.parents) ? student.parents : [];

  parents.forEach((parent) => addUniqueEmail(emails, seen, parent?.email));
  addUniqueEmail(emails, seen, student.parent?.email);
  addUniqueEmail(emails, seen, student.user?.email);

  return emails;
};

export const getStudentContactValues = (
  student: StudentContactLike | null | undefined,
): string[] =>
  getStudentContactEntries(student).map((contact) => contact.value);

export const getStudentContactEntries = (
  student: StudentContactLike | null | undefined,
): StudentContactEntry[] => [
  ...getStudentPhoneNumbers(student).map((value) => ({
    type: 'phone' as const,
    value,
  })),
  ...getStudentEmailAddresses(student).map((value) => ({
    type: 'email' as const,
    value,
  })),
];

export const getStudentPrimaryContact = (
  student: StudentContactLike | null | undefined,
): string => {
  return getStudentContactValues(student)[0] ?? '';
};

export const formatStudentPhoneList = (
  student: StudentContactLike | null | undefined,
  fallback = 'N/A',
): string => {
  const phones = getStudentPhoneNumbers(student);
  return phones.length > 0 ? phones.join(' / ') : fallback;
};

export const formatStudentContactList = (
  student: StudentContactLike | null | undefined,
  fallback = 'N/A',
): string => {
  const contacts = getStudentContactValues(student);
  return contacts.length > 0 ? contacts.join(' / ') : fallback;
};
