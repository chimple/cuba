import type {
  BlendWeights,
  LearningRates,
} from '@chimple/palau-recommendation';
import { PAL_LEARNING_RATES_CONFIG } from '../common/constants';
import { getCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';

type PalConstants = {
  blendWeights: PalLocalLayerConfig<BlendWeights>;
  learningRates: PalLocalLayerConfig<LearningRates>;
};

// Local config mirrors GrowthBook so the same resolution logic works offline.
type PalLocalLayerConfig<T> = {
  default: T;
  subjects: Record<string, T>;
};

type PalLayerConfig<T> = {
  default?: Partial<T>;
  subjects?: Record<string, Partial<T>>;
};

// GrowthBook stores both PAL knobs in one JSON feature, split by config type.
type PalConfig = {
  blendWeights?: PalLayerConfig<BlendWeights>;
  learningRates?: PalLayerConfig<LearningRates>;
};

const BLEND_WEIGHT_KEYS: (keyof BlendWeights)[] = [
  'skill',
  'outcome',
  'competency',
  'domain',
  'subject',
];

const LEARNING_RATE_KEYS: (keyof LearningRates)[] = [
  'skill',
  'outcome',
  'competency',
  'domain',
  'subject',
];

const DEFAULT_BLEND_WEIGHTS: BlendWeights = {
  skill: 0.1,
  outcome: 0.1,
  competency: 0.6,
  domain: 0.1,
  subject: 0.1,
};

const DEFAULT_LEARNING_RATES: LearningRates = {
  skill: 0.5,
  outcome: 0.8,
  competency: 0.3,
  domain: 0.5,
  subject: 0.4,
};

const ENGLISH_SUBJECT_ID = '54abf22e-7102-4e14-915b-acd8eab47d56';
const HINDI_SUBJECT_ID = 'c6e312bc-a832-4b81-964a-e0537cf7f18c';
const MATHS_SUBJECT_ID = 'c5674cc5-48f8-40b8-8123-f5246ea0c5e8';

const ENGLISH_AND_MATHS_BLEND_WEIGHTS: BlendWeights = {
  skill: 0.55,
  outcome: 0.25,
  competency: 0.1,
  domain: 0.05,
  subject: 0.05,
};

const ENGLISH_LEARNING_RATES: LearningRates = {
  skill: 0.10643810749,
  outcome: 0.077417725939,
  competency: 0.029020381551,
  domain: 0.019376962837,
  subject: 0.019376962837,
};

const HINDI_LEARNING_RATES: LearningRates = {
  skill: 0.1583,
  outcome: 0.1151,
  competency: 0.0431,
  domain: 0.0288,
  subject: 0.0288,
};

const MATHS_LEARNING_RATES: LearningRates = {
  skill: 0.7913,
  outcome: 0.5755,
  competency: 0.2157,
  domain: 0.144,
  subject: 0.144,
};

// Local PAL defaults keep recommendations working when GrowthBook is unavailable.
const PAL_CONSTANTS: PalConstants = {
  blendWeights: {
    default: DEFAULT_BLEND_WEIGHTS,
    subjects: {
      // English and Maths use the same fallback blend weights.
      [ENGLISH_SUBJECT_ID]: ENGLISH_AND_MATHS_BLEND_WEIGHTS,
      [MATHS_SUBJECT_ID]: ENGLISH_AND_MATHS_BLEND_WEIGHTS,
    },
  },
  learningRates: {
    default: DEFAULT_LEARNING_RATES,
    subjects: {
      [ENGLISH_SUBJECT_ID]: ENGLISH_LEARNING_RATES,
      [HINDI_SUBJECT_ID]: HINDI_LEARNING_RATES,
      [MATHS_SUBJECT_ID]: MATHS_LEARNING_RATES,
    },
  },
};

const resolveRates = (
  overrides: Partial<LearningRates> | undefined,
  fallback: LearningRates,
): LearningRates => {
  const resolved = { ...fallback };

  if (!overrides || typeof overrides !== 'object') return resolved;

  LEARNING_RATE_KEYS.forEach((key) => {
    const value = overrides[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      resolved[key] = value;
    }
  });

  return resolved;
};

// GrowthBook can send partial blend weights; merge valid values over fallback.
const resolveBlendWeights = (
  overrides: Partial<BlendWeights> | undefined,
  fallback: BlendWeights,
): BlendWeights => {
  const resolved = { ...fallback };

  if (!overrides || typeof overrides !== 'object') return resolved;

  BLEND_WEIGHT_KEYS.forEach((key) => {
    const value = overrides[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      resolved[key] = value;
    }
  });

  return resolved;
};

// Merge only valid numeric keys so a bad GrowthBook value cannot break PAL.
export const resolvePalBlendWeightsForSubject = (
  config: PalConfig | undefined,
  subjectId: string,
): BlendWeights => {
  const localDefault = resolveBlendWeights(
    subjectId ? PAL_CONSTANTS.blendWeights.subjects[subjectId] : undefined,
    PAL_CONSTANTS.blendWeights.default,
  );
  const defaultWeights = resolveBlendWeights(
    config?.blendWeights?.default,
    localDefault,
  );
  const subjectWeights = subjectId
    ? config?.blendWeights?.subjects?.[subjectId]
    : undefined;

  return resolveBlendWeights(subjectWeights, defaultWeights);
};

// Learning rates follow the same local/default/subject fallback order.
export const resolvePalLearningRatesForSubject = (
  config: PalConfig | undefined,
  subjectId: string,
): LearningRates => {
  const localDefault = resolveRates(
    subjectId ? PAL_CONSTANTS.learningRates.subjects[subjectId] : undefined,
    PAL_CONSTANTS.learningRates.default,
  );
  const defaultRates = resolveRates(
    config?.learningRates?.default,
    localDefault,
  );
  const subjectRates = subjectId
    ? config?.learningRates?.subjects?.[subjectId]
    : undefined;

  return resolveRates(subjectRates, defaultRates);
};

export const getPalBlendWeightsForSubject = (
  subjectId: string,
): BlendWeights => {
  // One GrowthBook JSON now owns both blend weights and learning rates.
  const config = getCachedGrowthBookFeatureValue<PalConfig>(
    PAL_LEARNING_RATES_CONFIG,
    {},
  );
  return resolvePalBlendWeightsForSubject(config, subjectId);
};

export const getPalLearningRatesForSubject = (
  subjectId: string,
): LearningRates => {
  // Read the same cached payload so both PAL knobs stay in sync by subject.
  const config = getCachedGrowthBookFeatureValue<PalConfig>(
    PAL_LEARNING_RATES_CONFIG,
    {},
  );
  return resolvePalLearningRatesForSubject(config, subjectId);
};
