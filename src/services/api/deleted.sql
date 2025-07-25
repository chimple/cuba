create index IF not exists idx_special_users_role_user_id on public.special_users using btree (role, user_id) TABLESPACE pg_default;
create index IF not exists idx_special_users_user_role on public.special_users using btree (user_id, role) TABLESPACE pg_default;
create index IF not exists idx_special_users_active_user_role on public.special_users using btree (user_id, role) TABLESPACE pg_default
where
  (is_deleted = false);