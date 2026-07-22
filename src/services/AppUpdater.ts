import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import {
  COPIED_BUNDLE_FILES_INDEX,
  READY_FOR_HOT_UPDATE,
} from '../common/constants';
import { runBackgroundWorkerTask } from '../workers/backgroundWorkerClient';
import logger from '../utility/logger';
import { buildReleaseFromBundle } from './appUpdater/appUpdaterBundle';
import { createDir, removeDir } from './appUpdater/appUpdaterFileSystem';
import { HotUpdateStatus } from './appUpdater/appUpdaterTypes';
import {
  activateRelease,
  copyFromPreviousRelease,
  deleteOldReleases,
  downloadFileFromWebServer,
  getCurrentRelease,
  getServerChecksum,
  setCurrentRelease,
} from './appUpdater/appUpdaterRelease';

export { HotUpdateStatus } from './appUpdater/appUpdaterTypes';
export { downloadFileFromAppBundle } from './appUpdater/appUpdaterBundle';

export const AppUpdater = {
  /**
   * Syncs the online web app to the native app shell.
   *
   * Note: this function triggers a browser reload if the app was updated successfully to point to the new release.
   *
   * @param webServerURL - The URL of the online web server.
   * @param checkDelay - The amount of time to allow between update checks. Defaults to 60 minutes.
   *
   * @returns True, if the app was updated, otherwise false.
   */
  sync: async (
    webServerURL: string,
    statusCallback: (status: HotUpdateStatus) => void,
    // checkDelay: number = 1000 * 60 * 60
    checkDelay: number = 0,
  ): Promise<boolean> => {
    // Do not run the sync job on non-native platforms. On Web the service worker will manage caching file instead.
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const res = await checkForDownloadedHotUpdate();

    if (res) return false;
    // Start the app update job.
    logger.debug('AppUpdater: Starting...');

    try {
      // Get the currently installed release version.
      let activeRelease = await getCurrentRelease();
      statusCallback(HotUpdateStatus.CHECKING_FOR_UPDATE);
      logger.debug(
        '🚀 ~ file: AppUpdater.ts.ts:91 ~ activeRelease:',
        JSON.stringify(activeRelease),
      );

      // Build the initial release from the app bundle if no release has been installed.
      if (!activeRelease) {
        statusCallback(HotUpdateStatus.COPY_FROM_BUNDLE);
        buildReleaseFromBundle();
        logger.debug('copying the files from bundle in background');
        return false;
      }
      localStorage.removeItem(COPIED_BUNDLE_FILES_INDEX);
      const currentRelease = activeRelease;

      // Check that enough time has elapsed before we can check for an update again.
      const lastUpdated = activeRelease.updated;
      const nextUpdateDue = new Date(lastUpdated.getTime() + checkDelay);

      if (new Date() < nextUpdateDue) {
        throw new Error(
          `Last update was run at '${lastUpdated.toJSON()}'. Next update check only due at '${nextUpdateDue.toJSON()}'`,
        );
      }

      // Go online to check what the latest app release is.
      const serverChecksumVersion = await getServerChecksum(
        webServerURL + '/checksum-version.json',
      );

      if (!serverChecksumVersion) {
        statusCallback(HotUpdateStatus.ERROR);
        throw new Error('Unable to get checksum-version from server');
      }

      // Check that latest release is not already installed.
      if (activeRelease.checksum.id === serverChecksumVersion.id) {
        statusCallback(HotUpdateStatus.ALREADY_UPDATED);
        // Nothing changed, reset the update check timestamp so that we don't check again unnecessarily.
        await setCurrentRelease(serverChecksumVersion.id, new Date());

        throw new Error(
          `Latest release already installed (${serverChecksumVersion.id})`,
        );
      }
      const serverChecksum = await getServerChecksum(
        webServerURL + '/checksum.json',
      );
      if (!serverChecksum) {
        statusCallback(HotUpdateStatus.ERROR);
        throw new Error('Unable to get checksum from server');
      }
      statusCallback(HotUpdateStatus.FOUND_UPDATE);

      // Prepare to download a new release.
      await createDir('releases', Directory.Data);
      await removeDir('releases/next', Directory.Data);
      // Create the empty directory structure for each of the files in the new release package.
      const paths = [
        ...new Set(
          serverChecksum.files.map((file) =>
            file.path.substring(0, file.path.lastIndexOf('/')),
          ),
        ),
      ];

      for (const path of paths) {
        await createDir(`releases/next/${path}`, Directory.Data);
      }

      statusCallback(HotUpdateStatus.DOWNLOADING_THE_UPDATES);
      // Download the new release files from the web server.
      const downloadTasks: Promise<any>[] = [];

      const filePlan = await runBackgroundWorkerTask('PLAN_HOT_UPDATE_FILES', {
        activeFiles: currentRelease.checksum.files,
        serverFiles: serverChecksum.files,
      }).catch((error) => {
        logger.warn(
          'AppUpdater: Worker planning failed, falling back to in-thread checksum comparison.',
          error,
        );
        return {
          copyFromPreviousPaths: serverChecksum.files
            .filter((serverFile) =>
              currentRelease.checksum.files.find(
                (activeFile) =>
                  activeFile.path === serverFile.path &&
                  activeFile.hash === serverFile.hash,
              ),
            )
            .map((file) => file.path),
          downloadFromServerPaths: serverChecksum.files
            .filter(
              (serverFile) =>
                !currentRelease.checksum.files.find(
                  (activeFile) =>
                    activeFile.path === serverFile.path &&
                    activeFile.hash === serverFile.hash,
                ),
            )
            .map((file) => file.path),
        };
      });

      for (const path of filePlan.copyFromPreviousPaths) {
        downloadTasks.push(
          copyFromPreviousRelease(
            `releases/${currentRelease.checksum.id}/${path}`,
            `releases/next/${path}`,
            Directory.Data,
          ),
        );
      }
      for (const path of filePlan.downloadFromServerPaths) {
        downloadTasks.push(
          downloadFileFromWebServer(
            `${webServerURL}/${path}`,
            `releases/next/${path}`,
            Directory.Data,
          ),
        );
      }

      await Promise.all(downloadTasks);
      // Save the release checksum.
      await Filesystem.writeFile({
        path: 'releases/next/checksum.json',
        directory: Directory.Data,
        data: JSON.stringify(serverChecksum),
        encoding: Encoding.UTF8,
        recursive: true,
      });
      // Install the downloaded release package.
      await Filesystem.rename({
        from: 'releases/next',
        to: `releases/${serverChecksum.id}`,
        directory: Directory.Data,
      });
      // // Delete any old release packages.
      // await deleteOldReleases(serverChecksum.id);

      // // Activate the downloaded release.
      // await activateRelease(serverChecksum.id);
      localStorage.setItem(READY_FOR_HOT_UPDATE, serverChecksum.id);

      // Report that the app was successfully updated.
      return true;
    } catch (error) {
      // Report that the app did not update.
      return false;
    } finally {
    }
  },
};

export async function checkForDownloadedHotUpdate(): Promise<boolean> {
  const serverChecksumId = localStorage.getItem(READY_FOR_HOT_UPDATE);

  if (!serverChecksumId) return false;
  //  Delete any old release packages.
  await deleteOldReleases(serverChecksumId);

  // Activate the downloaded release.
  await activateRelease(serverChecksumId);
  localStorage.removeItem(READY_FOR_HOT_UPDATE);
  return true;
}
