import {
  COMMUNITY_VISIT_PARENT_COUNT_MIN,
  parseCommunityVisitParentsCount,
  sanitizeCommunityVisitParentsInput,
  shouldShowCommunityVisitParentsField,
  validateCommunityVisitParentsCount,
} from './communityVisitParentsField';
import { SchoolVisitAction, SchoolVisitType } from '../../../common/constants';

describe('communityVisitParentsField', () => {
  it('shows the field only for community visit check-out', () => {
    expect(
      shouldShowCommunityVisitParentsField(
        SchoolVisitAction.CheckOut,
        SchoolVisitType.Community,
      ),
    ).toBe(true);
    expect(
      shouldShowCommunityVisitParentsField(
        SchoolVisitAction.CheckIn,
        SchoolVisitType.Community,
      ),
    ).toBe(false);
    expect(
      shouldShowCommunityVisitParentsField(
        SchoolVisitAction.CheckOut,
        SchoolVisitType.Regular,
      ),
    ).toBe(false);
  });

  it('keeps only digits in the input', () => {
    expect(sanitizeCommunityVisitParentsInput('12')).toBe('12');
    expect(sanitizeCommunityVisitParentsInput('1a.2-3')).toBe('123');
  });

  it('parses valid whole numbers and rejects invalid values', () => {
    expect(parseCommunityVisitParentsCount('0')).toBe(
      COMMUNITY_VISIT_PARENT_COUNT_MIN,
    );
    expect(parseCommunityVisitParentsCount('15')).toBe(15);
    expect(parseCommunityVisitParentsCount('')).toBeNull();
    expect(parseCommunityVisitParentsCount('-1')).toBeNull();
    expect(parseCommunityVisitParentsCount('1.5')).toBeNull();
  });

  it('validates the required field for community visits only', () => {
    expect(
      validateCommunityVisitParentsCount(SchoolVisitType.Community, ''),
    ).toBe('Number of Parents is required.');
    expect(
      validateCommunityVisitParentsCount(SchoolVisitType.Community, '4.5'),
    ).toBe('Enter a valid whole number.');
    expect(
      validateCommunityVisitParentsCount(SchoolVisitType.Community, '4'),
    ).toBeNull();
    expect(
      validateCommunityVisitParentsCount(SchoolVisitType.Regular, ''),
    ).toBe(null);
  });
});
