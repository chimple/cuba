-- -- For school_user
-- CREATE INDEX idx_school_user_user_id_not_deleted ON public.school_user (user_id) WHERE is_deleted = false;
-- CREATE INDEX idx_school_user_school_id_user_id_not_deleted ON public.school_user (school_id, user_id) WHERE is_deleted = false;
-- -- For class_user
-- CREATE INDEX idx_class_user_user_id_not_deleted ON public.class_user (user_id) WHERE is_deleted = false;
-- -- For school
-- CREATE INDEX idx_school_program_id_not_deleted ON public.school (program_id) WHERE is_deleted = false;
--Special User
-- CREATE INDEX IF NOT EXISTS idx_special_users_active_user_role
-- ON public.special_users (user_id, role)
-- WHERE is_deleted = false;
/* is_program_admin_for_school*/
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.school s
    JOIN public.program_user pu ON s.program_id = pu.program_id
    WHERE s.id = p_school_id
      AND pu.user = p_user_id
      AND pu.is_deleted = false
      AND pu.role IN ('program_manager', 'field_coordinator')
  );
END;
/*is_super_admin_or_operational_director*/
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.special_users su
    WHERE su.user_id = p_user_id
      AND su.role IN ('super_admin', 'operational_director')
      AND su.is_deleted = false
  );
END;
/* allow reads for school user for school*/
  (EXISTS ( SELECT 1
   FROM school_user su
  WHERE ((su.school_id = school.id) AND (su.user_id = auth.uid()) AND (su.is_deleted = false))))
EXISTS (SELECT 1 FROM school_user su WHERE su.school_id = school.id AND su.user_id = auth.uid() AND su.is_deleted = false)
------school
/*all*/
  is_super_admin_or_operational_director(auth.uid())
    is_program_admin_for_school(id, auth.uid())
/* select*/
  (EXISTS ( SELECT 1
   FROM (class_user cu
     JOIN class c ON ((c.id = cu.class_id)))
  WHERE ((c.school_id = school.id) AND (cu.user_id = auth.uid()) AND (cu.is_deleted = false))))
    (EXISTS ( SELECT 1
   FROM school_user su
  WHERE ((su.school_id = school.id) AND (su.user_id = auth.uid()) AND (su.is_deleted = false))))
    (EXISTS ( SELECT 1
   FROM school_user su
  WHERE ((su.school_id = school.id) AND (su.user_id = auth.uid()) AND (su.role IS DISTINCT FROM 'sponsor'::role) AND (su.is_deleted = false))))
CREATE OR REPLACE FUNCTION public.is_super_admin_or_operational_director_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1
      FROM special_users
     WHERE user_id = $1
       AND is_deleted = false
       AND role IN ('super_admin', 'operational_director')
     LIMIT 1
  );
$function$;
CREATE INDEX IF NOT EXISTS idx_special_users_user_id_role
  ON special_users (user_id, role)
  WHERE is_deleted = false;