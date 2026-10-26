const normalizeSchoolSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const compactSchoolSearchText = (value: string) =>
  normalizeSchoolSearchText(value).replace(/\s+/g, '');

type NormalizedSearchKey = {
  normalized: string;
  compact: string;
};

export const buildSchoolSearchKey = (value: string): NormalizedSearchKey => ({
  normalized: normalizeSchoolSearchText(value),
  compact: compactSchoolSearchText(value),
});

export const getSchoolSearchScore = (
  nameKey: NormalizedSearchKey,
  queryKey: NormalizedSearchKey,
): number => {
  if (!queryKey.compact) return Number.MAX_SAFE_INTEGER;
  if (nameKey.compact === queryKey.compact) return 0;
  if (nameKey.compact.startsWith(queryKey.compact)) return 1;
  if (
    nameKey.normalized
      .split(' ')
      .some((token) => token.startsWith(queryKey.normalized))
  ) {
    return 2;
  }
  if (nameKey.compact.includes(queryKey.compact)) return 3;
  return 4;
};

export const sortBySchoolSearchRelevance = <T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
): T[] => {
  const queryKey = buildSchoolSearchKey(query);
  if (!queryKey.normalized) return items;

  const prepared = items.map((item) => {
    const name = getName(item) || '';
    return {
      item,
      name,
      key: buildSchoolSearchKey(name),
    };
  });

  prepared.sort((a, b) => {
    const scoreA = getSchoolSearchScore(a.key, queryKey);
    const scoreB = getSchoolSearchScore(b.key, queryKey);

    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.key.normalized.localeCompare(b.key.normalized);
  });

  return prepared.map((entry) => entry.item);
};
