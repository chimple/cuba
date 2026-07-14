import { ServiceApi } from './ServiceApi';
import { SupabaseApiPal } from './supabase/SupabaseApi.pal';

export class SupabaseApi extends SupabaseApiPal implements ServiceApi {
  public static i: SupabaseApi;

  public static getInstance(): SupabaseApi {
    if (!SupabaseApi.i) {
      SupabaseApi.i = new SupabaseApi();
      SupabaseApi.i.init();
    }
    return SupabaseApi.i;
  }
}
