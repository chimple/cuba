import { Directory, Filesystem } from '@capacitor/filesystem';
import JSZip from 'jszip';
import LiveQuiz from '../models/LiveQuiz';
import { Util } from '../utility/util';

export const extractPackagedQuizBundle = async (
  bundleId: string,
): Promise<LiveQuiz | undefined> => {
  try {
    // APK builds keep each lesson as one ZIP under the public assets path.
    const packagedZipUrl = `/assets/lessonBundles/${encodeURIComponent(
      bundleId,
    )}.zip`;
    const response = await fetch(packagedZipUrl);
    if (!response.ok) return undefined;

    // Read the ZIP in JavaScript so both config and media can be copied to
    // the same external-storage layout used by online downloads.
    const zip = await JSZip.loadAsync(await response.arrayBuffer());
    // Bundles may contain config.json at the root or under one wrapper
    // directory, so support both layouts.
    const configEntry =
      zip.file('config.json') ??
      Object.values(zip.files).find(
        (file) =>
          !file.dir && file.name.replace(/\\/g, '/').endsWith('/config.json'),
      );
    if (!configEntry) return undefined;

    // Remove a wrapper directory from every extracted path. The player
    // expects config.json and media directly below the lesson directory.
    const configPath = configEntry.name.replace(/\\/g, '/');
    const configRoot = configPath.endsWith('/config.json')
      ? configPath.slice(0, -'config.json'.length)
      : '';
    const configData = await configEntry.async('base64');
    const configText = await configEntry.async('string');
    const configRelativePath = 'config.json';
    try {
      await Filesystem.writeFile({
        path: `${bundleId}/${configRelativePath}`,
        data: configData,
        directory: Directory.External,
        recursive: true,
      });
    } catch {
      // The parsed config can still start the quiz even if local persistence
      // is unavailable on this device.
    }

    const files = Object.values(zip.files).filter(
      (file) => !file.dir && !file.name.startsWith('dist/'),
    );
    const writtenPaths = new Set<string>([configRelativePath]);
    for (const file of files) {
      // Normalize paths and reject traversal/absolute paths from the ZIP.
      const filePath = file.name.replace(/\\/g, '/');
      const relativePath = filePath.startsWith(configRoot)
        ? filePath.slice(configRoot.length)
        : filePath;
      if (
        !relativePath ||
        relativePath.startsWith('../') ||
        relativePath.includes('/../') ||
        relativePath.startsWith('/')
      ) {
        continue;
      }

      if (writtenPaths.has(relativePath)) continue;
      writtenPaths.add(relativePath);

      // Capacitor accepts base64 for binary files and creates parent folders
      // when recursive is enabled.
      try {
        await Filesystem.writeFile({
          path: `${bundleId}/${relativePath}`,
          data: await file.async('base64'),
          directory: Directory.External,
          recursive: true,
        });
      } catch {
        // A broken optional media file must not prevent config.json from
        // loading and blank the Live Quiz screen.
      }
    }

    // Point Live Quiz media URLs to the extracted external lesson folder.
    const androidPath = await Util.getAndroidBundlePath();
    Util.setGameUrl(androidPath);

    return JSON.parse(configText) as LiveQuiz;
  } catch (error) {
    return undefined;
  }
};
