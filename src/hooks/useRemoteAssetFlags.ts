import { useEffect, useRef } from 'react';
import { useFeatureIsOn, useFeatureValue } from '@growthbook/growthbook-react';
import {
  CAN_ACCESS_REMOTE_ASSETS,
  HOMEWORK_PATHWAY_ASSETS,
  HOMEWORK_REMOTE_ASSETS_ENABLED,
  LEARNING_PATH_ASSETS,
  SHOULD_SHOW_HOMEWORK_REMOTE_ASSETS,
  SHOULD_SHOW_REMOTE_ASSETS,
} from '../common/constants';
import { Util } from '../utility/util';

type RemoteAssetFeature = {
  uniqueId?: string;
  asset_repo_url?: string;
};

export const useRemoteAssetFlags = () => {
  const shouldShowRemoteAssets = useFeatureIsOn(CAN_ACCESS_REMOTE_ASSETS);
  const shouldShowHomeworkRemoteAssets = useFeatureIsOn(
    HOMEWORK_REMOTE_ASSETS_ENABLED,
  );
  const learningPathAssets = useFeatureValue<RemoteAssetFeature>(
    LEARNING_PATH_ASSETS,
    {},
  );
  const homeworkPathwayAssets = useFeatureValue<RemoteAssetFeature>(
    HOMEWORK_PATHWAY_ASSETS,
    {},
  );
  const downloadedAssetKeysRef = useRef(new Set<string>());

  useEffect(() => {
    localStorage.setItem(
      SHOULD_SHOW_REMOTE_ASSETS,
      JSON.stringify(shouldShowRemoteAssets),
    );

    if (shouldShowRemoteAssets) {
      const { asset_repo_url: assetRepoUrl, uniqueId } = learningPathAssets;
      if (!assetRepoUrl || !uniqueId) {
        return;
      }

      const assetKey = `learning:${uniqueId}`;
      if (!downloadedAssetKeysRef.current.has(assetKey)) {
        downloadedAssetKeysRef.current.add(assetKey);
        void Util.DownloadRemoteAssets(
          assetRepoUrl,
          uniqueId,
          'remoteAsset',
          'Learning Path',
        );
      }
    }
  }, [learningPathAssets, shouldShowRemoteAssets]);

  useEffect(() => {
    localStorage.setItem(
      SHOULD_SHOW_HOMEWORK_REMOTE_ASSETS,
      JSON.stringify(shouldShowHomeworkRemoteAssets),
    );

    if (shouldShowHomeworkRemoteAssets) {
      const { asset_repo_url: assetRepoUrl, uniqueId } = homeworkPathwayAssets;
      if (!assetRepoUrl || !uniqueId) {
        return;
      }

      const assetKey = `homework:${uniqueId}`;
      if (!downloadedAssetKeysRef.current.has(assetKey)) {
        downloadedAssetKeysRef.current.add(assetKey);
        void Util.DownloadRemoteAssets(
          assetRepoUrl,
          uniqueId,
          'homeworkRemoteAsset',
          'Homework',
        );
      }
    }
  }, [homeworkPathwayAssets, shouldShowHomeworkRemoteAssets]);
};
