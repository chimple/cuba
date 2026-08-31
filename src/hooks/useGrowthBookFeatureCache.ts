import { useEffect, useRef } from 'react';
import { useFeatureValue, useGrowthBook } from '@growthbook/growthbook-react';
import {
  BUNDLE_ZIP_URLS,
  LIDO_BUNDLE_ZIP_URLS,
  PAL_LEARNING_RATES_CONFIG,
} from '../common/constants';
import { setCachedGrowthBookFeatureValue } from '../growthbook/Growthbook';
import {
  getBundleZipUrlsForEnv,
  getLidoBundleZipUrlsForEnv,
} from '../services/RemoteConfig';
import { logger } from '../utility/logger';

type GrowthBookJsonConfig = Record<string, unknown>;
type GrowthBookFeatureDebugResult<T> = {
  value: T | null;
  source: string;
};

export const useGrowthBookFeatureCache = () => {
  const growthbook = useGrowthBook();
  const bundleZipUrlsFallbackRef = useRef(getBundleZipUrlsForEnv());
  const lidoBundleZipUrlsFallbackRef = useRef(getLidoBundleZipUrlsForEnv());

  const palLearningRatesConfig = useFeatureValue<GrowthBookJsonConfig>(
    PAL_LEARNING_RATES_CONFIG,
    {},
  );
  const bundleZipUrls = useFeatureValue<string[]>(
    BUNDLE_ZIP_URLS,
    bundleZipUrlsFallbackRef.current,
  );
  const lidoBundleZipUrls = useFeatureValue<string[]>(
    LIDO_BUNDLE_ZIP_URLS,
    lidoBundleZipUrlsFallbackRef.current,
  );

  useEffect(() => {
    if (
      palLearningRatesConfig &&
      typeof palLearningRatesConfig === 'object' &&
      Object.keys(palLearningRatesConfig).length > 0
    ) {
      setCachedGrowthBookFeatureValue(
        PAL_LEARNING_RATES_CONFIG,
        palLearningRatesConfig,
      );
    }
  }, [palLearningRatesConfig]);

  useEffect(() => {
    if (!growthbook) return;

    const getFeatureDebugResult = <T>(
      featureKey: string,
      resolvedValue: T,
      fallbackValue: T,
    ): GrowthBookFeatureDebugResult<T> => {
      if (typeof growthbook?.evalFeature === 'function') {
        const result = growthbook.evalFeature<T>(featureKey);
        return {
          value: result?.value ?? null,
          source: result?.source ?? 'unknown',
        };
      }

      return {
        value: resolvedValue,
        source: resolvedValue === fallbackValue ? 'fallback-or-mock' : 'mocked',
      };
    };

    const bundleZipUrlsResult = getFeatureDebugResult(
      BUNDLE_ZIP_URLS,
      bundleZipUrls,
      bundleZipUrlsFallbackRef.current,
    );
    const lidoBundleZipUrlsResult = getFeatureDebugResult(
      LIDO_BUNDLE_ZIP_URLS,
      lidoBundleZipUrls,
      lidoBundleZipUrlsFallbackRef.current,
    );

    logger.warn('[GrowthBook] bundle ZIP URLs evaluated', {
      featureKey: BUNDLE_ZIP_URLS,
      growthBookSource: bundleZipUrlsResult.source,
      growthBookValue: bundleZipUrlsResult.value,
      fallbackValue: bundleZipUrlsFallbackRef.current,
      resolvedValue: bundleZipUrls,
      usingGrowthBookValue: bundleZipUrlsResult.value !== null,
    });

    logger.warn('[GrowthBook] Lido bundle ZIP URLs evaluated', {
      featureKey: LIDO_BUNDLE_ZIP_URLS,
      growthBookSource: lidoBundleZipUrlsResult.source,
      growthBookValue: lidoBundleZipUrlsResult.value,
      fallbackValue: lidoBundleZipUrlsFallbackRef.current,
      resolvedValue: lidoBundleZipUrls,
      usingGrowthBookValue: lidoBundleZipUrlsResult.value !== null,
    });

    setCachedGrowthBookFeatureValue(BUNDLE_ZIP_URLS, bundleZipUrls);
    setCachedGrowthBookFeatureValue(LIDO_BUNDLE_ZIP_URLS, lidoBundleZipUrls);
  }, [growthbook, bundleZipUrls, lidoBundleZipUrls]);
};
