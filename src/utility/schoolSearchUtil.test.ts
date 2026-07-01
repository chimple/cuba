import {
  getSchoolSearchScore,
  sortBySchoolSearchRelevance,
} from './schoolSearchUtil';

describe('schoolSearchUtil', () => {
  it('matches school names regardless of dots, spaces, and punctuation', () => {
    expect(getSchoolSearchScore('A.B. School', 'ab school')).toBe(0);
    expect(getSchoolSearchScore('A.B. School', 'a b')).toBe(1);
    expect(getSchoolSearchScore('Alpha-Beta School', 'beta')).toBe(2);
  });

  it('sorts search results using normalized relevance', () => {
    const items = [
      { name: 'Gamma School' },
      { name: 'A.B. School' },
      { name: 'A B School' },
      { name: 'Alpha School' },
    ];

    const sorted = sortBySchoolSearchRelevance(
      items,
      'ab school',
      (item) => item.name,
    );

    expect(sorted.map((item) => item.name)).toEqual([
      'A.B. School',
      'A B School',
      'Alpha School',
      'Gamma School',
    ]);
  });

  it('leaves the list unchanged when the query is empty', () => {
    const items = [{ name: 'Gamma School' }, { name: 'Alpha School' }];

    expect(sortBySchoolSearchRelevance(items, '   ', (item) => item.name)).toBe(
      items,
    );
  });
});
