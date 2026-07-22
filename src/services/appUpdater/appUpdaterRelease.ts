import { Capacitor, CapacitorHttp, WebView } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import logger from '../../utility/logger';
import type { Checksum, Release } from './appUpdaterTypes';

// --------------
// STEP FUNCTIONS
// --------------

/**
 * Get meta data for the currently installed app release.
 *
 * @returns The installed release details.
 */
export async function getCurrentRelease(): Promise<Release | null> {
  logger.debug('AppUpdater: Looking for current release.');

  try {
    const result = await Filesystem.readFile({
      path: 'version.json',
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });

    if (result.data) {
      // Get the active release summary details.
      const data = JSON.parse(result.data as string) as Release;

      // Get the checksum for the active release.
      const checksum = JSON.parse(
        (
          await Filesystem.readFile({
            path: `releases/${data.id}/checksum.json`,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          })
        ).data as string,
      ) as Checksum;

      // Return the release version details.
      logger.debug(`AppUpdater: Found release version '${data.id}'`);

      return {
        id: data.id,
        updated: new Date(data.updated),
        checksum: checksum,
      };
    }
  } catch (ignore) {
    logger.debug(
      'AppUpdater: Could not find "version.json", must be a new app install.',
    );
  }

  return null;
}

/**
 * Set the meta data for the currently installed app release.
 *
 * @param releaseName - The name to the new release.
 * @param timestamp - The timestamp on which the app was updated.
 */
export async function setCurrentRelease(
  releaseName: string,
  timestamp: Date = new Date(),
): Promise<void> {
  logger.debug(`AppUpdater: App configured for release '${releaseName}'.`);

  // Update app release summary file.
  await Filesystem.writeFile({
    path: 'version.json',
    data: JSON.stringify({
      id: releaseName,
      updated: timestamp,
    }),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
    recursive: true,
  });
}

/**
 * Deletes all old release directories from the app container.
 *
 * @param activeReleaseName - The active release not to delete.
 */
export async function deleteOldReleases(
  activeReleaseName: string,
): Promise<void> {
  logger.debug('AppUpdater: Deleting old releases.');

  // Get a list of all the release directories.
  const installedReleases = (
    await Filesystem.readdir({
      path: 'releases',
      directory: Directory.Data,
    })
  ).files;

  // Delete all the directories except for the active release.
  if (installedReleases.length > 0) {
    for (const oldRelease of installedReleases) {
      if (oldRelease.name !== activeReleaseName) {
        try {
          await Filesystem.rmdir({
            path: `releases/${oldRelease}`,
            directory: Directory.Data,
            recursive: true,
          });
        } catch (error) {}
      }
    }
  }
}

/**
 * Activates a downloaded app release package.
 *
 * @param releaseName - The name to the new release.
 */
export async function activateRelease(releaseName: string): Promise<void> {
  logger.debug(`AppUpdater: Reloading app to release '${releaseName}'.`);

  // Get the URI path to the app release directory.
  const releasePath = await Filesystem.getUri({
    path: `releases/${releaseName}`,
    directory: Directory.Data,
  });

  // Saves app release summary file.
  await setCurrentRelease(releaseName, new Date());

  // Point the app web view to the new release folder.
  if (Capacitor.getPlatform() === 'android') {
    await WebView.setServerBasePath({
      path: releasePath.uri.replace('file://', ''),
    });
  } else {
    await WebView.setServerBasePath({
      path: releasePath.uri.replace('file://', ''),
    }); // TODO - test if ios works the same as android, this line might have to change to their file storage convention.
  }

  // Ensure the new base path persists across sessions.
  await WebView.persistServerBasePath();
}

// ----------------
// HELPER FUNCTIONS
// ----------------

/**
 * Downloads a checksum for a given web app.
 *
 * @param url - The url to the web app.
 *
 * @returns The web app checksum data.
 */
export async function getServerChecksum(url: string): Promise<Checksum | null> {
  logger.debug(`AppUpdater: Getting latest release checksum from '${url}'`);

  try {
    const res = await CapacitorHttp.request({
      url: url,
      method: 'GET',
      responseType: 'json',
    });
    if (!!res && res.status === 200 && !!res.data) {
      return res.data as Checksum;
    }
  } catch (error) {
    logger.debug(
      'AppUpdater: Could not download and parse server checksum.\n\n',
      error,
    );
  }

  return null;
}

/**
 * Copies a file from a previous release to a new release.
 *
 * @param fromPath - The path of the file to copy.
 * @param toPath - The path to copy the file to.
 * @param directory - The base directory to work in.
 */
export async function copyFromPreviousRelease(
  fromPath: string,
  toPath: string,
  directory: Directory,
): Promise<void> {
  // logger.debug(`AppUpdater: Copy from previous release: '${fromPath}'`);
  try {
    await Filesystem.copy({
      from: fromPath,
      to: toPath,
      directory: directory,
    });
  } catch (error) {}
}

/**
 * Downloads a file from the app web server to a given directory.
 *
 * @param url - The URL of the file to download.
 * @param path - The path to save the file to.
 * @param directory - The base directory to work in.
 *
 * @returns The file download result.
 */
export async function downloadFileFromWebServer(
  url: string,
  path: string,
  directory: Directory,
): Promise<void> {
  try {
    logger.debug(`AppUpdater: Download from Server:${url} '${path}'`);
    const result = await Filesystem.downloadFile({
      url: url,
      path: path,
      method: 'GET',
      directory: directory,
      connectTimeout: 10 * 1000,
      readTimeout: 10 * 1000,
    });
    logger.debug('🚀 ~ file: AppUpdater.ts.ts:540 ~ result:', result.path);
    // const res = await CapacitorHttp.get({
    //   url: url,
    //   responseType: "blob",
    // });

    // const writeFile = await Filesystem.writeFile({
    //   data: res.data,
    //   path: path,
    //   directory: directory,
    // });
  } catch (error) {
    logger.error(
      '🚀 ~ file: AppUpdater.ts.ts:526 ~ error:',
      JSON.stringify(error),
      error,
      '      url: ',
      url,
      'path: ',
      path,
      'directory',
      directory,
    );
  }
}
