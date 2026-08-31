import { Directory, Filesystem } from '@capacitor/filesystem';
import logger from '../../utility/logger';

// -------------------
// FILE SYSTEM HELPERS
// -------------------

/**
 * Creates a new directory, ignoring warnings in case it already exists.
 *
 * @param path - The path of the directory to create.
 * @param directory - The base directory to work in.
 */
export async function createDir(
  path: string,
  directory: Directory,
): Promise<void> {
  if (!path) {
    return;
  }

  // logger.debug(`AppUpdater: Creating '${path}' directory`);

  try {
    await Filesystem.mkdir({
      path: path,
      directory: directory,
      recursive: true,
    });
  } catch (ignore) {
    logger.debug(`AppUpdater: Directory '${path}' already exists`);
  }
}

/**
 * Deletes a new directory, ignoring warnings in case it has already been removed.
 *
 * @param path - The path of the directory to remove.
 * @param directory - The base directory to work in.
 */
export async function removeDir(
  path: string,
  directory: Directory,
): Promise<void> {
  if (!path) {
    return;
  }

  logger.debug(`AppUpdater: Removing '${path}' directory`);

  try {
    await Filesystem.rmdir({
      path: path,
      directory: directory,
      recursive: true,
    });
  } catch (ignore) {
    logger.debug(`AppUpdater: Directory '${path}' already removed`);
  }
}
