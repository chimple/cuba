import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { COPIED_BUNDLE_FILES_INDEX } from '../../common/constants';
import logger from '../../utility/logger';
import type { Checksum, Release } from './appUpdaterTypes';
import { createDir, removeDir } from './appUpdaterFileSystem';
import { setCurrentRelease } from './appUpdaterRelease';

/**
 * Builds an initial release from the bundled app content.
 *
 * @throws If the release could not be built from the app bundle.
 *
 * @returns The built release details.
 */
export async function buildReleaseFromBundle(): Promise<Release> {
  logger.debug('AppUpdater: Building initial release from app bundle.');

  try {
    // Get the bundled release checksum.
    const response = await fetch('http://localhost/checksum.json');
    const checksum = (await response.json()) as Checksum;

    // Prepare to download a new release.
    await createDir('releases', Directory.Data);

    // Create the empty directory structure for each of the files in the new release package.
    const paths = [
      ...new Set(
        checksum.files.map((file) =>
          file.path.substring(0, file.path.lastIndexOf('/')),
        ),
      ),
    ];

    for (const path of paths) {
      await createDir(`releases/${checksum.id}/${path}`, Directory.Data);
    }

    // Download the release files from the app bundle local web server.
    // let downloadTasks: Promise<boolean>[] = [];
    // const limit = 300;
    const copiedBundleFiles: number = Number(
      localStorage.getItem(COPIED_BUNDLE_FILES_INDEX) ?? 0,
    );

    for (let i = copiedBundleFiles; i < checksum.files.length; i++) {
      const currentFile = checksum.files[i];
      const url = `http://localhost/${currentFile.path}`;
      // const alreadyCopied = copiedBundleFiles.find((value) => url === value);
      logger.debug(
        '🚀 ~ file: AppUpdater.ts:291 ~ buildReleaseFromBundle ~ alreadyCopied:',
        i,
        currentFile.path,
        JSON.stringify(copiedBundleFiles),
      );
      // if (!!alreadyCopied) continue;
      logger.debug(
        '🚀 ~ file: AppUpdater.ts:293 ~ buildReleaseFromBundle ~ continue:',
        currentFile.path,
        'total',
        i,
        '/',
        checksum.files.length,
      );
      // downloadTasks.push(
      await downloadFileFromAppBundle(
        url,
        `releases/${checksum.id}/${currentFile.path}`,
        Directory.Data,
        i + 1,
      );
      // );
      // if (
      //   currentFile.path === checksum.files.at(-1)?.path ||
      //   downloadTasks.length >= limit
      // ) {
      //   await Promise.all(downloadTasks);
      //   await new Promise((resolve, _) => setTimeout(resolve, 500));
      //   downloadTasks = [];
      // }
    }

    // Save the release checksum.
    await Filesystem.writeFile({
      path: `releases/${checksum.id}/checksum.json`,
      directory: Directory.Data,
      data: JSON.stringify(checksum),
      encoding: Encoding.UTF8,
      recursive: true,
    });

    // Saves app release summary file.
    const releaseID = checksum.id;
    const releaseDate = new Date(checksum.timestamp);

    await setCurrentRelease(releaseID, releaseDate);

    // Return the release version details.
    return {
      id: releaseID,
      updated: releaseDate,
      checksum: checksum,
    };
  } catch (error) {
    logger.error(error);

    // Clean-up the job output when things go wrong.
    await removeDir('releases', Directory.Data);

    // Throw the error to break the update process.
    throw new Error('AppUpdater: Could not build release from bundled.');
  }
}

/**
 * Downloads a file from app bundle (localhost) to a given directory.
 *
 * @param url - The URL of the file to download.
 * @param path - The path to save the file to.
 * @param directory - The base directory to work in.
 *
 * @returns True if the file cold be downloaded, otherwise false.
 */
export async function downloadFileFromAppBundle(
  url: RequestInfo,
  path: string,
  directory: Directory,
  index: number,
): Promise<boolean> {
  logger.debug(`AppUpdater: Download from Bundle:,${url} '${path}'`);

  /*
		This is a complex issue to solve without writing native code. But the below workaround works perfectly well
		for copying small files from the bundled app content to another folder on disk.

		A couple of things to note:

		  1) The web assets that is bundled with the native app when it is packaged gets hosted by Capacitor locally
			 on a webserver in app the runs on 'http://localhost'.

		  2) These files cannot be read by the Http plugin, as it sits outside of the webview and thus has no direct
			 contact. So instead we have to get to those files as blobs using fetch requests in the webview.

		  3) All files are served statically as bundled by the web server, except for the *.html files which Capacitor
			 injects about 2000 lines of Javascript for the framework in the <head>. Thus we need to strip out this
			 content before we cache HTML files, otherwise it will cause conflicts when that same file is served again
			 and Capacitor tries to inject the framework again at runtime, i.e. global var naming conflicts occur.

		  4) Capacitor had no official way of writing binary data to the disk. The Filesystem plugin however allows
			 for Base64 strings to be passed which it then internally decodes and writes as binary. This is because
			 the Capacitor bridge only allows for strings to be passed.

		  5) Beware that sending large strings through the bridge my end up crashing the web view, so it's not
			 feasible to attempt to write large media such as videos to the app container. For that purpose consider
			 building a native plugin that downloads and stores the file instead.
	
		For more info on the issue, see these links:

		  - Issue discussion: {@link https://github.com/ionic-team/capacitor/issues/31}
		  - Workaround: {@link https://stackoverflow.com/questions/56644178/how-can-i-save-a-downloaded-file-with-capacitor-in-ionic4-angular}
		  - Official feature request: {@link https://github.com/ionic-team/capacitor/issues/974}
	*/

  // Attempt to copy a file from the app bundle to the specified path.
  try {
    // Get the file from the app bundle local web server.

    // Parse the file response into a base64 string that can be sent through the Capacitor bridge.
    let base64Data: string;

    if (path.endsWith('.html')) {
      const response = await fetch(url);

      // Read the HTML file out as text.
      let text = await response.text();

      // Strip the injected Capacitor framework code out of the <head> tag.
      const stripStart = text.indexOf('<head>') + 6;
      const stripEnd = text.indexOf('</script>') + 9;

      text = text.substring(0, stripStart) + text.substring(stripEnd);

      // Convert the clean-up text to a base64 string.
      base64Data = btoa(text);
    } else if (path.endsWith('.svg')) {
      const response = await fetch(url);

      // Read the HTML file out as text.
      const text = await response.text();

      // Convert the clean-up text to a base64 string.
      base64Data = btoa(text);
    } else {
      const response = await fetch(url);
      const blob = await response.blob();

      // Convert the blob to a base64 string.
      base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (): void => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    }

    // Save the base64 data to disk. Capacitor will parse this back to a binary file type internally.
    if (path.endsWith('.svg')) {
      await Filesystem.writeFile({
        path: path,
        directory: directory,
        data: base64Data,
      });
    } else {
      try {
        await Filesystem.writeFile({
          path: path,
          directory: directory,
          data: base64Data,
        });
      } catch (error) {}
    }
    localStorage.setItem(COPIED_BUNDLE_FILES_INDEX, index.toString());
  } catch (error) {
    logger.debug(
      `AppUpdater: Could not copy '${path}' from app bundle`,
      url,
      error,
    );

    return false;
  }

  return true;
}
