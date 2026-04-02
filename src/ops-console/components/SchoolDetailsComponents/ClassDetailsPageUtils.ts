const CLASS_PREFIX_REGEX = /^class\b[\s:-]*/i;
const KG_REGEX = /^(LKG|UKG)\b(?:[\s-]*(.*))?$/i;
const NUMERIC_REGEX = /^(\d{1,2})(.*)$/;
const MULTI_SPACE_REGEX = /\s+/g;
const LEADING_SEPARATOR_REGEX = /^[-\s]+/;
const MIN_GRADE = 1;
const MAX_GRADE = 10;

type ParsedClassName = { grade: number; section: string; structured: boolean };

export function toCommaString(x: unknown): string {
  // Converts arrays/strings into a clean comma-separated value.
  if (!x) return '';
  if (Array.isArray(x)) return x.filter(Boolean).join(', ') || '';
  if (typeof x === 'string') return x.trim() || '';
  return String(x);
}

function normalize(value: string): string {
  // Trims and collapses duplicate spaces into single spaces.
  return value.trim().replace(MULTI_SPACE_REGEX, ' ');
}

function toUpperToken(value: string): string {
  // Normalizes and uppercases class section tokens (A, B, UKG A, etc.).
  return normalize(value).toUpperCase();
}

function parseClassName(rawClassName: string): ParsedClassName {
  // Parses class text into a normalized grade/section pair.
  const cleaned = normalize(rawClassName);
  if (!cleaned) return { grade: 0, section: '', structured: false };

  const token = cleaned.replace(CLASS_PREFIX_REGEX, '').trim();

  const kgMatch = token.match(KG_REGEX);
  if (kgMatch) {
    const prefix = kgMatch[1].toUpperCase();
    const suffix = toUpperToken(kgMatch[2] ?? '');
    return {
      grade: 0,
      section: suffix ? `${prefix} ${suffix}` : prefix,
      structured: true,
    };
  }

  const numericMatch = token.match(NUMERIC_REGEX);
  if (!numericMatch) {
    return { grade: 0, section: cleaned, structured: false };
  }

  const grade = Number.parseInt(numericMatch[1], 10);
  if (Number.isNaN(grade) || grade < MIN_GRADE || grade > MAX_GRADE) {
    return { grade: 0, section: cleaned, structured: false };
  }

  const suffix = numericMatch[2].replace(LEADING_SEPARATOR_REGEX, '');
  return {
    grade,
    section: suffix ? toUpperToken(suffix) : '',
    structured: true,
  };
}

function toDisplayLabel(parsed: ParsedClassName): string {
  // Converts parsed class object into list display text.
  if (!parsed.structured || parsed.grade === 0) return parsed.section;
  return `${parsed.grade}${parsed.section}`;
}

function formatClassLabel(
  grade?: number | string | null,
  section?: string | null,
): string {
  // Builds fallback label from grade/section when exact class name is unavailable.
  const normalizedSection =
    typeof section === 'string' ? normalize(section) : '';
  const normalizedGrade =
    grade === null || grade === undefined ? '' : String(grade).trim();

  if (!normalizedGrade) {
    if (!normalizedSection) return 'N/A';
    return toDisplayLabel(parseClassName(normalizedSection));
  }

  const numericGrade = Number.parseInt(normalizedGrade, 10);
  if (
    !Number.isNaN(numericGrade) &&
    numericGrade >= MIN_GRADE &&
    numericGrade <= MAX_GRADE
  ) {
    return `${numericGrade}${normalizedSection ? toUpperToken(normalizedSection) : ''}`;
  }

  if (normalizedGrade === '0' && normalizedSection) {
    return toDisplayLabel(parseClassName(normalizedSection));
  }

  return `${normalizedGrade}${normalizedSection ? toUpperToken(normalizedSection) : ''}`;
}

export function parseGradeSection(
  name?: string,
  fallbackGrade?: number | string,
  fallbackSection?: string,
): { grade?: number | string; section?: string } {
  // Returns parsed grade/section; falls back when class format is not supported.
  if (!name) return { grade: fallbackGrade, section: fallbackSection };

  const parsed = parseClassName(name);
  if (!parsed.structured) {
    return { grade: fallbackGrade, section: fallbackSection };
  }

  return {
    grade: parsed.grade,
    // Plain numeric classes (1/2/3) should filter by grade only.
    section: parsed.section || undefined,
  };
}

export function getClassDisplayLabel(
  grade?: number | string | null,
  section?: string | null,
  className?: string | null,
): string {
  // Prefers exact class name from API; otherwise builds normalized fallback label.
  const exactClassName = typeof className === 'string' ? className.trim() : '';
  if (exactClassName) return exactClassName;
  return formatClassLabel(grade, section);
}

export function getExactClassName(classWithidname?: {
  class_name?: string | null;
  name?: string | null;
}): string {
  // Picks exact class label from classWithidname (class_name first, then name).
  const fromClassName =
    typeof classWithidname?.class_name === 'string'
      ? classWithidname.class_name.trim()
      : '';
  if (fromClassName) return fromClassName;

  return typeof classWithidname?.name === 'string'
    ? classWithidname.name.trim()
    : '';
}
