DO $$
BEGIN
  CREATE TYPE public.student_connectivity_type AS ENUM (
    'keypad_phone',
    'no_phone',
    'parents_outside',
    'jio_phone',
    'otp_not_coming',
    'classcode_incorrect',
    'phone_not_working',
    'blank_screen_issue',
    'app_uninstalled',
    'no_recharge',
    'no_internet_recharge'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS student_connectivity public.student_connectivity_type DEFAULT NULL;
