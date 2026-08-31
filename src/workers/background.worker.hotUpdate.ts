import { ChecksumFile, PlanHotUpdatePayload } from './background.worker.types';

const fileKey = (file: ChecksumFile): string => `${file.path}@@${file.hash}`;

export const planHotUpdateFiles = (payload: PlanHotUpdatePayload) => {
  const activeSet = new Set(payload.activeFiles.map(fileKey));
  const copyFromPreviousPaths: string[] = [];
  const downloadFromServerPaths: string[] = [];

  for (const serverFile of payload.serverFiles) {
    if (activeSet.has(fileKey(serverFile))) {
      copyFromPreviousPaths.push(serverFile.path);
    } else {
      downloadFromServerPaths.push(serverFile.path);
    }
  }

  return { copyFromPreviousPaths, downloadFromServerPaths };
};
