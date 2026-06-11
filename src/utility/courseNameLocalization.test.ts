import type { TableTypes } from '../common/constants';
import { getCourseDisplayName } from './courseNameLocalization';

const translations: Record<string, string> = {
  Math: '\u0917\u0923\u093f\u0924',
  Hindi: '\u0939\u093f\u0928\u094d\u0926\u0940',
  Kannada: '\u0c95\u0ca8\u0ccd\u0ca8\u0ca1',
  Science: '\u0935\u093f\u091c\u094d\u091e\u093e\u0928',
  'Digital Skills':
    '\u0921\u093f\u091c\u093f\u091f\u0932 \u0915\u094c\u0936\u0932',
};

jest.mock('i18next', () => ({
  t: (key: string) => translations[key] ?? key,
}));

const course = (name: string, code: string): TableTypes<'course'> =>
  ({ name, code }) as TableTypes<'course'>;

describe('getCourseDisplayName', () => {
  it('keeps Hindi Maths DB display names exactly as stored', () => {
    expect(
      getCourseDisplayName(course('\u0917\u0923\u093f\u0924', 'maths-hi')),
    ).toBe('\u0917\u0923\u093f\u0924');
  });

  it('keeps Kannada Maths DB display names exactly as stored', () => {
    expect(
      getCourseDisplayName(course('\u0c97\u0ca3\u0cbf\u0ca4', 'maths-kn')),
    ).toBe('\u0c97\u0ca3\u0cbf\u0ca4');
  });

  it('uses final DB display names for stale localized Maths rows', () => {
    expect(getCourseDisplayName(course('Math-Hindi', 'maths-hi'))).toBe(
      '\u0917\u0923\u093f\u0924',
    );
    expect(getCourseDisplayName(course('Math-Kannada', 'maths-kn'))).toBe(
      '\u0c97\u0ca3\u0cbf\u0ca4',
    );
  });

  it('keeps language-only subjects in their standard stored display name', () => {
    expect(getCourseDisplayName(course('English', 'en'))).toBe('English');
  });

  it('uses existing single-name localization for non-language courses', () => {
    expect(
      getCourseDisplayName(course('Digital Skills', 'digital-skills')),
    ).toBe('\u0921\u093f\u091c\u093f\u091f\u0932 \u0915\u094c\u0936\u0932');
  });
});
