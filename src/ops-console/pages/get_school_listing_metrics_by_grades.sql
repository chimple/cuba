create or replace function public.get_school_listing_metrics_by_grades(
  p_grade_ids uuid[],
  p_days integer default 7,
  p_page integer default 1,
  p_page_size integer default 20,
  p_order_by text default 'school_name',
  p_order_dir text default 'asc',
  p_search text default '',
  p_filters jsonb default '{}'::jsonb,
  p_percentage_filters jsonb default '{}'::jsonb,
  p_school_performance_filter text default null,
  p_program_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_page_size integer := greatest(coalesce(p_page_size, 20), 1);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * greatest(coalesce(p_page_size, 20), 1);
  v_order_by text := coalesce(nullif(p_order_by, ''), 'school_name');
  v_order_dir text := lower(coalesce(nullif(p_order_dir, ''), 'asc'));
  v_search text := nullif(trim(coalesce(p_search, '')), '');
  v_filters jsonb := coalesce(p_filters, '{}'::jsonb);
  v_percentage_filters jsonb := coalesce(p_percentage_filters, '{}'::jsonb);
  v_school_performance_filter text := nullif(trim(coalesce(p_school_performance_filter, '')), '');
begin
  if p_grade_ids is null or cardinality(p_grade_ids) = 0 then
    return jsonb_build_object('data', '[]'::jsonb, 'total', 0);
  end if;

  return (
    with user_roles as (
      select coalesce(array_agg(role::text), array[]::text[]) as roles
      from public.special_users
      where user_id = v_user_id
        and is_deleted = false
        and role::text in (
          'super_admin',
          'operational_director',
          'program_manager',
          'field_coordinator',
          'external_user'
        )
    ),
    access_flags as (
      select
        roles,
        ('super_admin' = any(roles) or 'operational_director' = any(roles)) as is_admin_or_director
      from user_roles
    ),
    school_access as (
      select distinct su.school_id
      from public.school_user su
      cross join access_flags af
      where not af.is_admin_or_director
        and su.user_id = v_user_id
        and su.is_deleted = false
    ),
    program_access as (
      select distinct pu.program_id
      from public.program_user pu
      cross join access_flags af
      where not af.is_admin_or_director
        and pu."user" = v_user_id
        and pu.role::text = 'program_manager'
        and pu.is_deleted = false
    ),
    visible_metrics as (
      select sm.*
      from public.school_metrics sm
      cross join access_flags af
      where sm.is_deleted = false
        and sm.metric_window = concat(greatest(coalesce(p_days, 7), 1)::text, 'd')
        and (p_program_id is null or sm.program_id = p_program_id)
        and (
          af.is_admin_or_director
          or exists (
            select 1 from school_access sa where sa.school_id = sm.school_id
          )
          or exists (
            select 1 from program_access pa where pa.program_id = sm.program_id
          )
        )
        and (
          not (v_filters ? 'state')
          or sm.state in (select jsonb_array_elements_text(v_filters -> 'state'))
        )
        and (
          not (v_filters ? 'district')
          or sm.district in (select jsonb_array_elements_text(v_filters -> 'district'))
        )
        and (
          not (v_filters ? 'block')
          or sm.block in (select jsonb_array_elements_text(v_filters -> 'block'))
        )
        and (
          not (v_filters ? 'cluster')
          or sm.cluster in (select jsonb_array_elements_text(v_filters -> 'cluster'))
        )
        and (
          not (v_filters ? 'model')
          or sm.school_model::text in (select jsonb_array_elements_text(v_filters -> 'model'))
        )
        and (
          not (v_filters ? 'programType')
          or sm.program_type::text in (select jsonb_array_elements_text(v_filters -> 'programType'))
        )
        and (
          not (v_filters ? 'partner')
          or exists (
            select 1
            from unnest(coalesce(sm.partners, array[]::text[])) stored_partner(value)
            cross join lateral regexp_split_to_table(stored_partner.value, '\s*,\s*') split_partner(value)
            where lower(btrim(split_partner.value)) in (
              select lower(btrim(selected_partner.value))
              from jsonb_array_elements_text(v_filters -> 'partner') selected_partner(value)
            )
          )
        )
        and (
          not (v_filters ? 'programManager')
          or coalesce(sm.program_managers, array[]::text[])
             && array(select jsonb_array_elements_text(v_filters -> 'programManager'))
        )
        and (
          not (v_filters ? 'fieldCoordinator')
          or coalesce(sm.field_coordinators, array[]::text[])
             && array(select jsonb_array_elements_text(v_filters -> 'fieldCoordinator'))
        )
        and (
          v_search is null
          or sm.school_name ilike ('%' || v_search || '%')
          or sm.udise ilike ('%' || v_search || '%')
          or sm.district ilike ('%' || v_search || '%')
          or sm.block ilike ('%' || v_search || '%')
          or sm.cluster ilike ('%' || v_search || '%')
          or sm.state ilike ('%' || v_search || '%')
        )
    ),
    selected_school_classes as (
      select
        c.school_id,
        array_agg(c.id::text) as class_ids
      from public."class" c
      join visible_metrics vm on vm.school_id = c.school_id
      where c.is_deleted = false
        and c.grade_id = any(p_grade_ids)
      group by c.school_id
    ),
    selected_class_rows as (
      select
        c.school_id,
        c.id as class_id
      from public."class" c
      join visible_metrics vm on vm.school_id = c.school_id
      where c.is_deleted = false
        and c.grade_id = any(p_grade_ids)
    ),
    selected_student_counts as (
      select
        scr.school_id,
        count(distinct cu.user_id)::integer as onboarded_students
      from selected_class_rows scr
      join public.class_user cu on cu.class_id = scr.class_id
      where cu.is_deleted = false
        and cu.role::text = 'student'
      group by scr.school_id
      having count(distinct cu.user_id) > 0
    ),
    selected_students as (
      select distinct
        scr.school_id,
        scr.class_id,
        cu.user_id
      from selected_class_rows scr
      join public.class_user cu on cu.class_id = scr.class_id
      where cu.is_deleted = false
        and cu.role::text = 'student'
    ),
    selected_teachers as (
      select distinct
        scr.school_id,
        scr.class_id,
        cu.user_id
      from selected_class_rows scr
      join public.class_user cu on cu.class_id = scr.class_id
      where cu.is_deleted = false
        and cu.role::text = 'teacher'
    ),
    selected_teacher_counts as (
      select
        school_id,
        count(distinct user_id)::integer as total_teachers
      from selected_teachers
      group by school_id
    ),
    selected_result_metrics as (
      select
        ss.school_id,
        count(distinct ss.user_id)::integer as activated_students,
        (count(distinct ss.user_id) filter (
          where r.class_id = ss.class_id
            and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
        ))::integer as active_students,
        case
          when count(distinct ss.user_id) filter (
            where r.class_id = ss.class_id
              and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
          ) > 0
            then round(
              (coalesce(sum(coalesce(r.time_spent, 0)) filter (
                where r.class_id = ss.class_id
                  and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
              ), 0)::numeric / 60)
              / count(distinct ss.user_id) filter (
                where r.class_id = ss.class_id
                  and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
              ),
              0
            )
          else null
        end as avg_time_spent
      from selected_students ss
      join public.result r on r.student_id = ss.user_id
      where r.is_deleted = false
      group by ss.school_id
    ),
    selected_assignment_metrics as (
      select
        scr.school_id,
        (count(distinct a.created_by) filter (
          where exists (
            select 1
            from selected_teachers st
            where st.class_id = a.class_id
              and st.user_id = a.created_by
          )
        ))::integer as active_teachers,
        (count(distinct a.id) filter (
          where lower(coalesce(a.type, '')) <> 'livequiz'
        ))::integer as activities_assigned
      from selected_class_rows scr
      join public.assignment a
        on a.class_id = scr.class_id
       and a.is_deleted = false
       and a.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
       and lower(coalesce(a.source, '')) <> 'streamlit'
      group by scr.school_id
    ),
    selected_activity_metrics as (
      select
        ss.school_id,
        (count(distinct r.assignment_id) filter (
          where r.assignment_id is not null
        ))::integer as completed_assignments,
        count(*)::integer as completed_activities
      from selected_students ss
      join public.result r
        on r.student_id = ss.user_id
       and r.class_id = ss.class_id
       and r.is_deleted = false
       and r.created_at >= now() - make_interval(days => greatest(coalesce(p_days, 7), 1))
      group by ss.school_id
    ),
    selected_class_aggregates as (
      select
        ssc.school_id,
        case
          when coalesce(sum(cm.active_students), 0) > 0
            then sum(coalesce(cm.avg_time_spent, 0) * coalesce(cm.active_students, 0))::numeric
                 / sum(cm.active_students)
          else null
        end as weighted_avg_time_spent,
        avg(cm.avg_assignments_completed) as avg_assignments_completed,
        avg(cm.avg_activities_completed) as avg_activities_completed
      from selected_school_classes ssc
      left join lateral (
        select *
        from public.get_class_metrics_for_listing(ssc.school_id, greatest(coalesce(p_days, 7), 1))
        where class_id::text = any(ssc.class_ids)
      ) cm on true
      group by ssc.school_id
    ),
    selected_class_metrics as (
      select
        scr.school_id,
        coalesce(srm.activated_students, 0)::integer as activated_students,
        coalesce(srm.active_students, 0)::integer as active_students,
        coalesce(srm.avg_time_spent, sca.weighted_avg_time_spent) as avg_time_spent,
        coalesce(sam.active_teachers, 0)::integer as active_teachers,
        coalesce(stc.total_teachers, 0)::integer as total_teachers,
        coalesce(sam.activities_assigned, 0)::integer as activities_assigned,
        round(coalesce(sac.completed_assignments, 0)::numeric / nullif(coalesce(srm.active_students, 0), 0), 1) as avg_assignments_completed,
        round(coalesce(sac.completed_activities, 0)::numeric / nullif(coalesce(srm.active_students, 0), 0), 1) as avg_activities_completed
      from (
        select distinct school_id
        from selected_class_rows
      ) scr
      left join selected_result_metrics srm on srm.school_id = scr.school_id
      left join selected_assignment_metrics sam on sam.school_id = scr.school_id
      left join selected_activity_metrics sac on sac.school_id = scr.school_id
      left join selected_teacher_counts stc on stc.school_id = scr.school_id
      left join selected_class_aggregates sca on sca.school_id = scr.school_id
    ),
    selected_metrics as (
      select
        vm.id,
        vm.school_id,
        vm.metric_window,
        vm.school_name,
        vm.state,
        vm.district,
        vm.block,
        vm.cluster,
        vm.udise,
        vm.program_id,
        vm.program_name,
        vm.partners,
        vm.program_managers,
        vm.field_coordinators,
        vm.program_type,
        vm.school_model,
        vm.student_parent_calls,
        vm.student_parent_inperson,
        vm.teacher_hm_calls,
        vm.community_visits,
        vm.community_parents_reached,
        vm.school_visits,
        vm.parents_on_whatsapp,
        vm.parents_in_group,
        ssc.onboarded_students,
        coalesce(scm.activated_students, 0) as activated_students,
        coalesce(scm.active_students, 0) as active_students,
        scm.avg_time_spent,
        coalesce(scm.active_teachers, 0) as active_teachers,
        coalesce(scm.total_teachers, 0) as total_teachers,
        coalesce(scm.activities_assigned, 0) as activities_assigned,
        scm.avg_assignments_completed,
        scm.avg_activities_completed,
        case
          when ssc.onboarded_students <= 0 then null
          when coalesce(scm.active_students, scm.activated_students, 0)::numeric / ssc.onboarded_students >= 0.8
            then 'High Performing'
          when coalesce(scm.active_students, scm.activated_students, 0)::numeric / ssc.onboarded_students >= 0.5
            then 'Medium Performing'
          else 'Low Performing'
        end as selected_school_performance,
        case
          when ssc.onboarded_students > 0
            then (coalesce(scm.activated_students, 0)::numeric / ssc.onboarded_students) * 100
          else null
        end as activated_students_pct,
        case
          when coalesce(scm.activated_students, 0) > 0
            then (coalesce(scm.active_students, 0)::numeric / scm.activated_students) * 100
          else null
        end as active_students_pct,
        case
          when coalesce(scm.total_teachers, 0) > 0
            then (coalesce(scm.active_teachers, 0)::numeric / scm.total_teachers) * 100
          else null
        end as active_teachers_pct
      from visible_metrics vm
      join selected_student_counts ssc on ssc.school_id = vm.school_id
      left join selected_class_metrics scm on scm.school_id = vm.school_id
    ),
    filtered_metrics as (
      select *
      from selected_metrics sm
      where (
          not (v_percentage_filters ? 'activatedStudents')
          or (
            sm.activated_students_pct is not null
            and (
              (v_percentage_filters ->> 'activatedStudents' = 'low' and round(sm.activated_students_pct) <= 30)
              or (v_percentage_filters ->> 'activatedStudents' = 'mid' and round(sm.activated_students_pct) between 31 and 69)
              or (v_percentage_filters ->> 'activatedStudents' = 'high' and round(sm.activated_students_pct) >= 70)
            )
          )
        )
        and (
          not (v_percentage_filters ? 'activeStudents')
          or (
            sm.active_students_pct is not null
            and (
              (v_percentage_filters ->> 'activeStudents' = 'low' and round(sm.active_students_pct) <= 30)
              or (v_percentage_filters ->> 'activeStudents' = 'mid' and round(sm.active_students_pct) between 31 and 69)
              or (v_percentage_filters ->> 'activeStudents' = 'high' and round(sm.active_students_pct) >= 70)
            )
          )
        )
        and (
          not (v_percentage_filters ? 'activeTeachers')
          or (
            sm.active_teachers_pct is not null
            and (
              (v_percentage_filters ->> 'activeTeachers' = 'low' and round(sm.active_teachers_pct) <= 30)
              or (v_percentage_filters ->> 'activeTeachers' = 'mid' and round(sm.active_teachers_pct) between 31 and 69)
              or (v_percentage_filters ->> 'activeTeachers' = 'high' and round(sm.active_teachers_pct) >= 70)
            )
          )
        )
        and (
          v_school_performance_filter is null
          or sm.selected_school_performance = v_school_performance_filter
        )
    ),
    total_metrics as (
      select count(*)::integer as total_count
      from filtered_metrics
    ),
    paged_metrics as (
      select *
      from filtered_metrics
      order by
        case when v_order_by = 'school_name' and v_order_dir <> 'desc' then school_name end asc nulls last,
        case when v_order_by = 'school_name' and v_order_dir = 'desc' then school_name end desc nulls last,
        case when v_order_by = 'school_performance' and v_order_dir <> 'desc' then selected_school_performance end asc nulls last,
        case when v_order_by = 'school_performance' and v_order_dir = 'desc' then selected_school_performance end desc nulls last,
        case when v_order_by = 'onboarded_students' and v_order_dir <> 'desc' then onboarded_students end asc nulls last,
        case when v_order_by = 'onboarded_students' and v_order_dir = 'desc' then onboarded_students end desc nulls last,
        case when v_order_by = 'activated_students' and v_order_dir <> 'desc' then activated_students end asc nulls last,
        case when v_order_by = 'activated_students' and v_order_dir = 'desc' then activated_students end desc nulls last,
        case when v_order_by = 'active_students' and v_order_dir <> 'desc' then active_students end asc nulls last,
        case when v_order_by = 'active_students' and v_order_dir = 'desc' then active_students end desc nulls last,
        case when v_order_by = 'avg_time_spent' and v_order_dir <> 'desc' then avg_time_spent end asc nulls last,
        case when v_order_by = 'avg_time_spent' and v_order_dir = 'desc' then avg_time_spent end desc nulls last,
        case when v_order_by = 'active_teachers' and v_order_dir <> 'desc' then active_teachers end asc nulls last,
        case when v_order_by = 'active_teachers' and v_order_dir = 'desc' then active_teachers end desc nulls last,
        case when v_order_by = 'activities_assigned' and v_order_dir <> 'desc' then activities_assigned end asc nulls last,
        case when v_order_by = 'activities_assigned' and v_order_dir = 'desc' then activities_assigned end desc nulls last,
        case when v_order_by = 'avg_assignments_completed' and v_order_dir <> 'desc' then avg_assignments_completed end asc nulls last,
        case when v_order_by = 'avg_assignments_completed' and v_order_dir = 'desc' then avg_assignments_completed end desc nulls last,
        case when v_order_by = 'avg_activities_completed' and v_order_dir <> 'desc' then avg_activities_completed end asc nulls last,
        case when v_order_by = 'avg_activities_completed' and v_order_dir = 'desc' then avg_activities_completed end desc nulls last,
        case when v_order_by = 'student_parent_calls' and v_order_dir <> 'desc' then student_parent_calls end asc nulls last,
        case when v_order_by = 'student_parent_calls' and v_order_dir = 'desc' then student_parent_calls end desc nulls last,
        case when v_order_by = 'student_parent_inperson' and v_order_dir <> 'desc' then student_parent_inperson end asc nulls last,
        case when v_order_by = 'student_parent_inperson' and v_order_dir = 'desc' then student_parent_inperson end desc nulls last,
        case when v_order_by = 'teacher_hm_calls' and v_order_dir <> 'desc' then teacher_hm_calls end asc nulls last,
        case when v_order_by = 'teacher_hm_calls' and v_order_dir = 'desc' then teacher_hm_calls end desc nulls last,
        case when v_order_by = 'community_visits' and v_order_dir <> 'desc' then community_visits end asc nulls last,
        case when v_order_by = 'community_visits' and v_order_dir = 'desc' then community_visits end desc nulls last,
        case when v_order_by = 'community_parents_reached' and v_order_dir <> 'desc' then community_parents_reached end asc nulls last,
        case when v_order_by = 'community_parents_reached' and v_order_dir = 'desc' then community_parents_reached end desc nulls last,
        case when v_order_by = 'school_visits' and v_order_dir <> 'desc' then school_visits end asc nulls last,
        case when v_order_by = 'school_visits' and v_order_dir = 'desc' then school_visits end desc nulls last,
        case when v_order_by = 'parents_on_whatsapp' and v_order_dir <> 'desc' then parents_on_whatsapp end asc nulls last,
        case when v_order_by = 'parents_on_whatsapp' and v_order_dir = 'desc' then parents_on_whatsapp end desc nulls last,
        case when v_order_by = 'parents_in_group' and v_order_dir <> 'desc' then parents_in_group end asc nulls last,
        case when v_order_by = 'parents_in_group' and v_order_dir = 'desc' then parents_in_group end desc nulls last,
        school_name asc nulls last
      limit v_page_size
      offset v_offset
    )
    select jsonb_build_object(
      'data',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', id,
            'school_id', school_id,
            'metric_window', metric_window,
            'school_name', school_name,
            'school_performance', selected_school_performance,
            'state', state,
            'district', district,
            'block', block,
            'cluster', cluster,
            'udise', udise,
            'program_id', program_id,
            'program_name', program_name,
            'partners', partners,
            'total_teachers', total_teachers,
            'num_students', onboarded_students,
            'num_teachers', total_teachers,
            'onboarded_students', onboarded_students,
            'activated_students', activated_students,
            'active_students', active_students,
            'avg_time_spent', avg_time_spent,
            'active_teachers', active_teachers,
            'active_teacher_percentage', active_teachers_pct,
            'activities_assigned', activities_assigned,
            'avg_assignments_completed', avg_assignments_completed,
            'avg_activities_completed', avg_activities_completed,
            'phone_calls_students_parents', student_parent_calls,
            'inperson_students_parents', student_parent_inperson,
            'phone_calls_teachers_hms', teacher_hm_calls,
            'community_visits', community_visits,
            'school_visits', school_visits,
            'parents_on_whatsapp', parents_on_whatsapp,
            'parents_in_whatsapp_group', parents_in_group,
            'parents_reached', community_parents_reached,
            'program_managers', program_managers,
            'field_coordinators', field_coordinators
          )
        ),
        '[]'::jsonb
      ),
      'total',
      (select total_count from total_metrics)
    )
    from paged_metrics
  );
end;
$$;

create index if not exists idx_class_school_grade_not_deleted
  on public."class" (school_id, grade_id)
  where is_deleted = false;

create index if not exists idx_class_user_student_not_deleted
  on public.class_user (class_id, user_id)
  where role = 'student' and is_deleted = false;
