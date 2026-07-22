import { SupabaseApiCoreTableSync } from './SupabaseApi.core.tableSync';

export interface SupabaseApiCore {
  [key: string]: any;
}
export class SupabaseApiCore extends SupabaseApiCoreTableSync {}
