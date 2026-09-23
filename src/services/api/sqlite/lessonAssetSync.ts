import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import logger from '../../../utility/logger';
import { Util } from '../../../utility/util';

export type LessonAssetRow = Record<string, unknown>;

export async function hasLocalLessonAsset(
  lessonId: string | null | undefined,
): Promise<boolean> {
  if (!lessonId) return false;

  let timeout: number | undefined;
  try {
    const controller = new AbortController();
    timeout = window.setTimeout(() => controller.abort(), 3000);
    const packaged = await fetch(
      `/assets/lessonBundles/${encodeURIComponent(lessonId)}.zip`,
      { method: 'HEAD', signal: controller.signal },
    );
    if (packaged.ok) return true;
  } catch (error) {
    logger.warn('[LessonSync] Packaged asset check failed', error);
  } finally {
    if (timeout !== undefined) window.clearTimeout(timeout);
  }

  try {
    return Boolean(await Util.getLessonPath({ lessonId }));
  } catch {
    return false;
  }
}

export async function preserveLessonAssetIds(
  db: SQLiteDBConnection,
  incomingLessons: LessonAssetRow[],
  assetCandidates?: Map<string, { lido?: string; cocos?: string }>,
): Promise<LessonAssetRow[]> {
  if (!incomingLessons.length) return incomingLessons;

  const lessonIds = incomingLessons
    .map((lesson) => lesson.id)
    .filter((id): id is string => typeof id === 'string' && Boolean(id));
  if (!lessonIds.length) return incomingLessons;

  const placeholders = lessonIds.map(() => '?').join(', ');
  const result = await db.query(
    `SELECT id, lido_lesson_id, cocos_lesson_id,
            previous_lido_lesson_id, previous_cocos_lesson_id
       FROM lesson
      WHERE id IN (${placeholders})`,
    lessonIds,
  );
  const localById = new Map<string, LessonAssetRow>(
    (result.values ?? []).map((row: LessonAssetRow) => [String(row.id), row]),
  );

  return Promise.all(
    incomingLessons.map(async (incoming) => {
      const incomingRowId =
        typeof incoming.id === 'string' ? incoming.id : undefined;
      const local = incomingRowId ? localById.get(incomingRowId) : undefined;
      if (!local) return incoming;

      const enriched = { ...incoming };
      for (const [currentKey, previousKey] of [
        ['lido_lesson_id', 'previous_lido_lesson_id'],
        ['cocos_lesson_id', 'previous_cocos_lesson_id'],
      ] as const) {
        const localId =
          typeof local[currentKey] === 'string' ? local[currentKey] : undefined;
        const incomingId =
          typeof incoming[currentKey] === 'string'
            ? incoming[currentKey]
            : undefined;
        const existingPreviousId =
          typeof local[previousKey] === 'string'
            ? local[previousKey]
            : undefined;

        if (existingPreviousId) enriched[previousKey] = existingPreviousId;
        if (incomingRowId && localId && incomingId !== localId) {
          const candidate = assetCandidates?.get(incomingRowId) ?? {};
          if (currentKey === 'lido_lesson_id') candidate.lido = localId;
          else candidate.cocos = localId;
          assetCandidates?.set(incomingRowId, candidate);
        }
      }
      return enriched;
    }),
  );
}
