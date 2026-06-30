const normalizeSchoolSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const compactSchoolSearchText = (value: string) =>
  normalizeSchoolSearchText(value).replace(/\s+/g, '');

export const getSchoolSearchScore = (name: string, query: string): number => {
  const normalizedName = normalizeSchoolSearchText(name);
  const normalizedQuery = normalizeSchoolSearchText(query);
  const compactName = compactSchoolSearchText(name);
  const compactQuery = compactSchoolSearchText(query);

  if (!compactQuery) return Number.MAX_SAFE_INTEGER;
  if (compactName === compactQuery) return 0;
  if (compactName.startsWith(compactQuery)) return 1;
  if (
    normalizedName.split(' ').some((token) => token.startsWith(normalizedQuery))
  ) {
    return 2;
  }
  if (compactName.includes(compactQuery)) return 3;
  return 4;
};

export const sortBySchoolSearchRelevance = <T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
): T[] => {
  const normalizedQuery = normalizeSchoolSearchText(query);
  if (!normalizedQuery) return items;

  return [...items].sort((a, b) => {
    const nameA = getName(a) || '';
    const nameB = getName(b) || '';

    const scoreA = getSchoolSearchScore(nameA, normalizedQuery);
    const scoreB = getSchoolSearchScore(nameB, normalizedQuery);

    if (scoreA !== scoreB) return scoreA - scoreB;
    return normalizeSchoolSearchText(nameA).localeCompare(
      normalizeSchoolSearchText(nameB),
    );
  });
};
