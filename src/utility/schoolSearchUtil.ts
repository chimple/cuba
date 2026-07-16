export const getSchoolSearchScore = (
  name: string,
  normalizedQuery: string,
): number => {
  if (!normalizedQuery) return 0;
  if (name === normalizedQuery) return 0;
  if (name.startsWith(normalizedQuery)) return 1;
  if (name.includes(normalizedQuery)) return 2;
  return 3;
};

export const sortBySchoolSearchRelevance = <T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
): T[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return [...items].sort((a, b) => {
    const nameA = (getName(a) || '').toLowerCase();
    const nameB = (getName(b) || '').toLowerCase();

    const scoreA = getSchoolSearchScore(nameA, normalizedQuery);
    const scoreB = getSchoolSearchScore(nameB, normalizedQuery);

    if (scoreA !== scoreB) return scoreA - scoreB;
    return nameA.localeCompare(nameB);
  });
};
