CREATE INDEX idx_program_user_user ON public.program_user("user");
CREATE INDEX idx_program_user_program_id ON public.program_user(program_id);
CREATE INDEX idx_program_user_role ON public.program_user(role);
CREATE INDEX idx_program_user_is_deleted ON public.program_user(is_deleted);