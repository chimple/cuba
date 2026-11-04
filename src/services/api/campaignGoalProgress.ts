import type { Json } from '../database';

const CAMPAIGN_DAY_MS = 24 * 60 * 60 * 1000;

type CampaignRule = { rank: number; min: number };

const isCampaignRecord = (
  value: Json,
): value is Record<string, Json | undefined> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getCampaignGoalTarget = (
  rulesJson: string | Json | null,
  rankAchieved: number | null = null,
): number | null => {
  let parsed: Json | null = rulesJson;
  if (typeof rulesJson === 'string') {
    try {
      parsed = JSON.parse(rulesJson) as Json;
    } catch {
      return null;
    }
  }
  if (!parsed || !isCampaignRecord(parsed)) return null;

  // Campaign reward thresholds use the same 0-100 completion scale as evaluation.
  const directTarget = parsed.target;
  if (
    typeof directTarget === 'number' &&
    Number.isFinite(directTarget) &&
    directTarget > 0 &&
    directTarget <= 100
  ) {
    return directTarget;
  }

  const configuredRules = parsed.rules;
  if (!Array.isArray(configuredRules)) return null;
  const rules: CampaignRule[] = configuredRules.flatMap((rule) => {
    if (!isCampaignRecord(rule)) return [];
    const { rank, min } = rule;
    return typeof rank === 'number' &&
      Number.isFinite(rank) &&
      typeof min === 'number' &&
      Number.isFinite(min) &&
      min > 0 &&
      min <= 100
      ? [{ rank, min }]
      : [];
  });
  if (!rules.length) return null;

  // Keep the earned certificate's threshold visible; otherwise show the first attainable reward.
  const earnedRule = rules.find((rule) => rule.rank === rankAchieved);
  return earnedRule?.min ?? Math.min(...rules.map((rule) => rule.min));
};

export const isCampaignLive = (
  startDate: string,
  endDate: string,
  now = Date.now(),
): boolean => {
  const startsAt = Date.parse(startDate);
  const endsAt = Date.parse(endDate);
  // Campaign dates without times stay live through their full end date.
  const inclusiveEnd = /^\d{4}-\d{2}-\d{2}$/.test(endDate)
    ? endsAt + CAMPAIGN_DAY_MS
    : endsAt;

  return (
    Number.isFinite(startsAt) &&
    Number.isFinite(endsAt) &&
    startsAt <= now &&
    now < inclusiveEnd
  );
};
