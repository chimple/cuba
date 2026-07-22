import { SupabaseApiUserLeaderboards } from './SupabaseApi.user.leaderboards';

export interface SupabaseApiUser {
  [key: string]: any;
}
export class SupabaseApiUser extends SupabaseApiUserLeaderboards {}
