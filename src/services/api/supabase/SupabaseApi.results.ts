import { SupabaseApiResultsProgress } from './SupabaseApi.results.progress';

export interface SupabaseApiResults {
  [key: string]: any;
}
export class SupabaseApiResults extends SupabaseApiResultsProgress {}
