import { needsTermsAgreement, normalizeTcVersion } from './termsAndConditions';

describe('termsAndConditions utilities', () => {
  it('does not require terms agreement when user is null', () => {
    expect(needsTermsAgreement(null, 3)).toBe(false);
  });

  it('does not require terms agreement when user id is missing', () => {
    expect(
      needsTermsAgreement(
        {
          tc_agreed_version: 0,
        },
        3,
      ),
    ).toBe(false);
  });

  it('requires terms agreement only for valid users below the latest version', () => {
    expect(
      needsTermsAgreement(
        {
          id: 'parent-1',
          tc_agreed_version: 1,
        },
        3,
      ),
    ).toBe(true);

    expect(
      needsTermsAgreement(
        {
          id: 'parent-1',
          tc_agreed_version: normalizeTcVersion(3),
        },
        3,
      ),
    ).toBe(false);
  });
});
