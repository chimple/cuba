import { sortBySchoolSearchRelevance } from './schoolSearchUtil';

describe('schoolSearchUtil', () => {
  it('matches school names regardless of dots, spaces, and punctuation', () => {
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

  it('orders exact, prefix, and contains matches by relevance', () => {
    const items = [
      { name: 'Alpha School Annex' },
      { name: 'My Alpha School' },
      { name: 'Alpha School' },
      { name: 'Completely Different School' },
    ];

    const sorted = sortBySchoolSearchRelevance(
      items,
      'alpha school',
      (item) => item.name,
    );

    expect(sorted.map((item) => item.name)).toEqual([
      'Alpha School',
      'Alpha School Annex',
      'My Alpha School',
      'Completely Different School',
    ]);
  });

  it('leaves the list unchanged when the query is empty', () => {
    const items = [{ name: 'Gamma School' }, { name: 'Alpha School' }];

    expect(sortBySchoolSearchRelevance(items, '   ', (item) => item.name)).toBe(
      items,
    );
  });
});
