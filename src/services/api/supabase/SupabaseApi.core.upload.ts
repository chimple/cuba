import { RealtimeChannel } from '@supabase/supabase-js';
import logger from '../../../utility/logger';
import { ServiceConfig } from '../../ServiceConfig';
import { SupabaseApiCoreStorage } from './SupabaseApi.core.storage';
export interface SupabaseApiCoreUpload {
  [key: string]: any;
}
export class SupabaseApiCoreUpload extends SupabaseApiCoreStorage {
  async uploadData(payload: any): Promise<boolean | null> {
    if (!this.supabase) return false;

    const supabase = this.supabase;
    let resolved = false;
    const currentuserData =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const uploadingUser = currentuserData?.id;
    return new Promise(async (resolve) => {
      let uploadId: string | undefined;
      let directChannel: RealtimeChannel | null = null;
      let subscriptionFailCount = 0;
      const subscribeToDirectChannel = (): RealtimeChannel => {
        const channel = supabase
          .channel(`upload-status-${uploadId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'upload_queue',
              filter: `id=eq.${uploadId}`,
            },
            async (payload) => {
              const status = payload.new?.status;
              logger.info('🔄 Realtime update received:', status);
              if ((status === 'success' || status === 'failed') && !resolved) {
                resolved = true;
                await channel.unsubscribe();
                resolve(status === 'success');
              }
            },
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              logger.info('📡 Realtime subscription active.');
              subscriptionFailCount = 0;
            } else {
              subscriptionFailCount++;
              logger.warn('⚠️ Subscription status:', status);
              if (subscriptionFailCount > 2) {
                logger.warn(
                  '🔁 Reinitializing subscription due to failures...',
                );
                await channel.unsubscribe();
                directChannel = subscribeToDirectChannel();
              }
            }
          });
        return channel;
      };
      const fallbackChannel = uploadingUser
        ? supabase
            .channel(`upload-fallback-${uploadingUser}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'upload_queue',
                filter: `uploading_user=eq.${uploadingUser}`,
              },
              async (payload) => {
                const status = payload.new?.status;
                const id = payload.new?.id;
                logger.info(
                  '🔄 [Fallback] Realtime update:',
                  status,
                  'ID:',
                  id,
                );
                if (
                  (status === 'success' || status === 'failed') &&
                  !resolved
                ) {
                  resolved = true;
                  await fallbackChannel?.unsubscribe();
                  logger.info(
                    `✅ / ❌ Fallback resolved with status: ${status}`,
                  );
                  resolve(status === 'success');
                }
              },
            )
            .subscribe()
        : null;
      const { data, error: functionError } = await supabase.functions.invoke(
        'ops-data-insert',
        {
          body: payload,
        },
      );
      uploadId = data?.upload_id;
      if (uploadId) {
        logger.info('📡 Received upload_id:', uploadId);
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
        }
        const { data: row } = await supabase
          .from('upload_queue')
          .select('status')
          .eq('id', uploadId)
          .single();
        if (row?.status === 'success') {
          return resolve(true);
        }
        if (row?.status === 'failed') {
          return resolve(false);
        }
        directChannel = subscribeToDirectChannel();
      } else {
        logger.warn('❗ No upload_id returned — using fallback listener.');
      }
    });
  }

  async migrateSchoolData(payload: { school_ids: string[] }): Promise<boolean> {
    if (!this.supabase) return false;

    const supabase = this.supabase;
    const schoolIds = Array.isArray(payload?.school_ids)
      ? payload.school_ids
          .map((id) => String(id ?? '').trim())
          .filter((id) => id.length > 0)
      : [];
    if (schoolIds.length === 0) return false;

    let resolved = false;
    const currentUserData =
      await ServiceConfig.getI().authHandler.getCurrentUser();
    const uploadingUser = currentUserData?.id;

    return new Promise(async (resolve) => {
      let uploadId: string | undefined;
      let directChannel: RealtimeChannel | null = null;
      let fallbackChannel: RealtimeChannel | null = null;
      let subscriptionFailCount = 0;

      const resolveOnce = async (isSuccess: boolean) => {
        if (resolved) return;
        resolved = true;
        if (directChannel) {
          await directChannel.unsubscribe();
        }
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
        }
        resolve(isSuccess);
      };

      const subscribeToDirectChannel = (): RealtimeChannel => {
        const channel = supabase
          .channel(`school-migrate-status-${uploadId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'upload_queue',
              filter: `id=eq.${uploadId}`,
            },
            async (realtimePayload) => {
              const status = realtimePayload.new?.status;
              if ((status === 'success' || status === 'failed') && !resolved) {
                await resolveOnce(status === 'success');
              }
            },
          )
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              subscriptionFailCount = 0;
            } else {
              subscriptionFailCount++;
              if (subscriptionFailCount > 2) {
                await channel.unsubscribe();
                directChannel = subscribeToDirectChannel();
              }
            }
          });
        return channel;
      };

      fallbackChannel = uploadingUser
        ? supabase
            .channel(`school-migrate-fallback-${uploadingUser}`)
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'upload_queue',
                filter: `uploading_user=eq.${uploadingUser}`,
              },
              async (realtimePayload) => {
                const status = realtimePayload.new?.status;
                const id = realtimePayload.new?.id;
                if (
                  (status === 'success' || status === 'failed') &&
                  !resolved &&
                  (!uploadId || id === uploadId)
                ) {
                  await resolveOnce(status === 'success');
                }
              },
            )
            .subscribe()
        : null;

      const { data, error: functionError } = await supabase.functions.invoke(
        'school-data-migrate',
        {
          body: {
            school_ids: schoolIds,
          },
        },
      );

      if (functionError) {
        logger.error(
          'Edge function error in school-data-migrate:',
          functionError,
        );
        await resolveOnce(false);
        return;
      }

      uploadId = data?.upload_id || data?.migration_id || data?.id;
      if (uploadId) {
        if (fallbackChannel) {
          await fallbackChannel.unsubscribe();
          fallbackChannel = null;
        }

        const { data: row } = await supabase
          .from('upload_queue')
          .select('status')
          .eq('id', uploadId)
          .single();

        if (row?.status === 'success') {
          await resolveOnce(true);
          return;
        }
        if (row?.status === 'failed') {
          await resolveOnce(false);
          return;
        }

        directChannel = subscribeToDirectChannel();
        return;
      }

      if (
        data &&
        typeof data === 'object' &&
        'success' in (data as Record<string, unknown>)
      ) {
        await resolveOnce(Boolean((data as Record<string, unknown>).success));
        return;
      }

      if (!fallbackChannel) {
        await resolveOnce(false);
      }
    });
  }
}
