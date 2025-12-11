import {
  AbilityState,
  DependencyGraph,
  RecommendationContext,
  createEmptyAbilityState,
  recommendNextSkill,
  updateAbilities,
} from "@chimple/palau-recommendation";
import { TableTypes } from "../common/constants";
import { ServiceConfig } from "../services/ServiceConfig";

type AbilityKeys =
  | "skill"
  | "outcome"
  | "competency"
  | "domain"
  | "subject";

type ResultAbilityMap = {
  [K in AbilityKeys]: Map<string, { ability: number; timestamp: number }>;
};

export class palUtil {
  private static abilityGraphCache: Map<
    string,
    { abilityState: AbilityState; graph: DependencyGraph | undefined }
  > = new Map();

  public static async getAbilityStateAndGraph(
    studentId: string,
    courseId: string
  ): Promise<{ abilityState: AbilityState; graph: DependencyGraph | undefined }> {
    const cacheKey = `${studentId}:${courseId}`;
    const cached = this.abilityGraphCache.get(cacheKey);
    if (cached) return cached;

    const built = await this.buildAbilityStateAndGraphForCourse(
      studentId,
      courseId
    );
    this.abilityGraphCache.set(cacheKey, built);
    return built;
  }

  public static async buildAbilityStateAndGraphForCourse(
    studentId: string,
    courseId: string
  ): Promise<{
    abilityState: AbilityState;
    graph: DependencyGraph | undefined;
  }> {
    const api = ServiceConfig.getI().apiHandler;
    const emptyState = createEmptyAbilityState();
    const course = await api.getCourse(courseId);

    if (!course?.subject_id || !course?.framework_id) {
      return { abilityState: emptyState, graph: undefined };
    }

    const domains = await api.getDomainsBySubjectAndFramework(
      course.subject_id,
      course.framework_id
    );
    if (!domains.length) return { abilityState: emptyState, graph: undefined };

    const competencies = await api.getCompetenciesByDomainIds(
      domains.map((domain) => domain.id)
    );
    if (!competencies.length) {
      return { abilityState: emptyState, graph: undefined };
    }

    const outcomes = await api.getOutcomesByCompetencyIds(
      competencies.map((competency) => competency.id)
    );
    if (!outcomes.length) {
      return { abilityState: emptyState, graph: undefined };
    }

    const skills = await api.getSkillsByOutcomeIds(
      outcomes.map((outcome) => outcome.id)
    );
    if (!skills.length) {
      return { abilityState: emptyState, graph: undefined };
    }

    const skillRelations = await api.getSkillRelationsByTargetIds(
      skills.map((skill) => skill.id)
    );

    const graph = this.composeGraph(
      course.subject_id,
      domains,
      competencies,
      outcomes,
      skills,
      skillRelations
    );

    const results = await api.getResultsBySkillIds(
      studentId,
      skills.map((skill) => skill.id)
    );

    return {
      abilityState: this.composeAbilityState(course.subject_id, results),
      graph,
    };
  }

  private static composeAbilityState(
    fallbackSubjectId: string,
    results: TableTypes<"result">[]
  ): AbilityState {
    const state = createEmptyAbilityState();
    if (!results || results.length === 0) return state;

    const abilityMaps: ResultAbilityMap = {
      skill: new Map(),
      outcome: new Map(),
      competency: new Map(),
      domain: new Map(),
      subject: new Map(),
    };

    for (const result of results) {
      const timestamp = this.getTimestamp(result);
      this.upsertAbility(
        abilityMaps.skill,
        result.skill_id,
        result.skill_ability,
        timestamp
      );
      this.upsertAbility(
        abilityMaps.outcome,
        result.outcome_id,
        result.outcome_ability,
        timestamp
      );
      this.upsertAbility(
        abilityMaps.competency,
        result.competency_id,
        result.competency_ability,
        timestamp
      );
      this.upsertAbility(
        abilityMaps.domain,
        result.domain_id,
        result.domain_ability,
        timestamp
      );
      this.upsertAbility(
        abilityMaps.subject,
        result.subject_id ?? fallbackSubjectId,
        result.subject_ability,
        timestamp
      );
    }

    state.skill = this.mapToRecord(abilityMaps.skill);
    state.outcome = this.mapToRecord(abilityMaps.outcome);
    state.competency = this.mapToRecord(abilityMaps.competency);
    state.domain = this.mapToRecord(abilityMaps.domain);
    state.subject = this.mapToRecord(abilityMaps.subject);

    return state;
  }

  private static composeGraph(
    subjectId: string,
    domains: TableTypes<"domain">[],
    competencies: TableTypes<"competency">[],
    outcomes: TableTypes<"outcome">[],
    skills: TableTypes<"skill">[],
    relations: TableTypes<"skill_relation">[]
  ): DependencyGraph {
    const domainMap = new Map(
      domains.map((domain) => [
        domain.id,
        {
          id: domain.id,
          label: domain.name,
          subjectId: domain.subject_id ?? subjectId,
        },
      ])
    );

    const competencyMap = new Map(
      competencies.map((competency) => {
        const domain = domainMap.get(competency.domain_id);
        return [
          competency.id,
          {
            id: competency.id,
            label: competency.name,
            subjectId: domain?.subjectId ?? subjectId,
            domainId: domain?.id ?? "",
          },
        ];
      })
    );

    const outcomeMap = new Map(
      outcomes.map((outcome) => {
        const competency = competencyMap.get(outcome.competency_id);
        return [
          outcome.id,
          {
            id: outcome.id,
            label: outcome.name,
            competencyId: competency?.id ?? "",
            domainId: competency?.domainId ?? "",
            subjectId,
          },
        ];
      })
    );

    const prerequisitesBySkill: Record<string, string[]> = {};
    relations.forEach((rel) => {
      if (!rel.target_skill_id || rel.is_deleted) return;
      if (!prerequisitesBySkill[rel.target_skill_id]) {
        prerequisitesBySkill[rel.target_skill_id] = [];
      }
      if (rel.source_skill_id) {
        prerequisitesBySkill[rel.target_skill_id].push(rel.source_skill_id);
      }
    });

    const skillList = skills.map((skill) => {
      const outcome = outcomeMap.get(skill.outcome_id);
      const competency = outcome ? competencyMap.get(outcome.competencyId) : undefined;
      const domain = competency ? domainMap.get(competency.domainId) : undefined;
      return {
        id: skill.id,
        label: skill.name,
        outcomeId: outcome?.id ?? "",
        competencyId: competency?.id ?? "",
        domainId: domain?.id ?? "",
        subjectId: domain?.subjectId ?? subjectId,
        difficulty: skill.difficulty ?? 0,
        prerequisites: prerequisitesBySkill[skill.id] ?? [],
      };
    });

    return {
      skills: skillList,
      outcomes: Array.from(outcomeMap.values()),
      competencies: Array.from(competencyMap.values()),
      domains: Array.from(domainMap.values()),
      subjects: [{ id: subjectId, label: subjectId }],
      startSkillId: skillList[0]?.id ?? "",
    };
  }

  public static async getRecommendedLessonForCourse(
    studentId: string,
    courseId: string
  ): Promise<{
    lesson: TableTypes<"lesson"> | undefined;
    skillId?: string;
    chapterId?: string;
    recommendation?: RecommendationContext;
  }> {
    const api = ServiceConfig.getI().apiHandler;
    const { abilityState, graph } = await this.getAbilityStateAndGraph(
      studentId,
      courseId
    );
    if (!graph) return { lesson: undefined, chapterId: undefined };

    const subjectId = graph.subjects[0]?.id ?? "";
    const recommendation = recommendNextSkill({
      graph,
      abilities: abilityState,
      subjectId,
    });

    const skillId = recommendation?.candidateId;
    if (!skillId) {
      return { lesson: undefined, chapterId: undefined, recommendation };
    }

    const skillLessons = await api.getSkillLessonsBySkillIds([skillId]);
    const sortedSkillLessons = [...skillLessons].sort((a, b) => {
      const aIndex = a.sort_index ?? Number.MAX_SAFE_INTEGER;
      const bIndex = b.sort_index ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });

    const lessonIds = sortedSkillLessons
      .map((sl) => sl.lesson_id)
      .filter((id): id is string => !!id);

    if (!lessonIds.length) {
      return { lesson: undefined, skillId, chapterId: undefined, recommendation };
    }

    const lessonResultsMap = await api.getStudentResultInMap(studentId);
    const lessonsData =
      (await api.getLessonsBylessonIds(lessonIds))?.reduce(
        (acc, lesson) => {
          if (lesson?.id) acc[lesson.id] = lesson;
          return acc;
        },
        {} as Record<string, TableTypes<"lesson">>
      ) ?? {};

    let nextLessonId: string | undefined;
    for (const sl of sortedSkillLessons) {
      if (sl.lesson_id && !lessonResultsMap[sl.lesson_id]) {
        nextLessonId = sl.lesson_id;
        break;
      }
    }

    if (!nextLessonId) {
      let earliestId: string | undefined;
      let earliestTime = Number.POSITIVE_INFINITY;
      for (const sl of sortedSkillLessons) {
        const result = sl.lesson_id
          ? lessonResultsMap[sl.lesson_id]
          : undefined;
        if (!result) continue;
        const t = this.getTimestamp(result);
        if (t < earliestTime) {
          earliestTime = t;
          earliestId = sl.lesson_id;
        }
      }
      nextLessonId = earliestId ?? lessonIds[0];
    }

    const chapterId = nextLessonId
      ? await this.getChapterIdForLessonInCourse(courseId, nextLessonId)
      : undefined;

    return {
      lesson: nextLessonId ? lessonsData[nextLessonId] : undefined,
      skillId,
      chapterId,
      recommendation,
    };
  }

  public static async getPalLessonPathForCourse(courseId: string, studentId: string): Promise<
    { lesson_id: string; skill_id?: string; chapter_id?: string }[] | undefined
  > {
    const recommended = await this.getRecommendedLessonForCourse(
      studentId,
      courseId
    );
    if (!recommended?.lesson?.id) return undefined;

    const entry = {
      lesson_id: recommended.lesson.id,
      skill_id: recommended.skillId,
      chapter_id: recommended.chapterId,
    };

    return Array.from({ length: 5 }, () => ({ ...entry }));
  }

  private static async getChapterIdForLessonInCourse(
    courseId: string,
    lessonId: string
  ): Promise<string | undefined> {
    const api = ServiceConfig.getI().apiHandler;
    const chapters = await api.getChaptersForCourse(courseId);

    for (const chapter of chapters) {
      if (!chapter.id) continue;
      const lessons = await api.getLessonsForChapter(chapter.id);
      if (lessons.some((lesson) => lesson.id === lessonId)) {
        return chapter.id;
      }
    }

    return undefined;
  }

  private static upsertAbility(
    abilityMap: Map<string, { ability: number; timestamp: number }>,
    id: string | null,
    ability: number | null,
    timestamp: number
  ) {
    if (!id || ability === null || ability === undefined) return;
    const existing = abilityMap.get(id);
    if (!existing || timestamp > existing.timestamp) {
      abilityMap.set(id, { ability, timestamp });
    }
  }

  private static getTimestamp(result: TableTypes<"result">): number {
    const candidate = result.updated_at ?? result.created_at ?? "";
    const parsed = Date.parse(candidate);
    if (Number.isFinite(parsed)) return parsed;
    return 0;
  }

  private static mapToRecord(
    map: Map<string, { ability: number }>
  ): Record<string, number> {
    const record: Record<string, number> = {};
    map.forEach((value, key) => {
      record[key] = value.ability;
    });
    return record;
  }

  public static async updateAndGetAbilities(params: {
    studentId: string;
    courseId: string;
    skillId: string;
    outcomes: boolean[];
  }): Promise<{
    skill_id?: string;
    skill_ability?: number;
    outcome_id?: string;
    outcome_ability?: number;
    competency_id?: string;
    competency_ability?: number;
    domain_id?: string;
    domain_ability?: number;
    subject_id?: string;
    subject_ability?: number;
  }> {
    const { studentId, courseId, skillId, outcomes } = params;
    const cacheKey = `${studentId}:${courseId}`;
    const { abilityState, graph } = await this.getAbilityStateAndGraph(
      studentId,
      courseId
    );

    if (!graph) {
      return {};
    }

    const subjectId = graph.subjects[0]?.id ?? "";
    const updated = updateAbilities({
      graph,
      abilities: abilityState,
      subjectId,
      skillId,
      outcomes,
    });

    const newAbilityState = updated?.abilities ?? abilityState;
    this.abilityGraphCache.set(cacheKey, {
      abilityState: newAbilityState,
      graph,
    });

    const skillNode = graph.skills.find((s) => s.id === skillId);
    const outcomeId = skillNode?.outcomeId;
    const competencyId = skillNode?.competencyId;
    const domainId = skillNode?.domainId;

    return {
      skill_id: skillId,
      skill_ability: newAbilityState.skill?.[skillId],
      outcome_id: outcomeId,
      outcome_ability: outcomeId
        ? newAbilityState.outcome?.[outcomeId]
        : undefined,
      competency_id: competencyId,
      competency_ability: competencyId
        ? newAbilityState.competency?.[competencyId]
        : undefined,
      domain_id: domainId,
      domain_ability: domainId
        ? newAbilityState.domain?.[domainId]
        : undefined,
      subject_id: subjectId,
      subject_ability: subjectId
        ? newAbilityState.subject?.[subjectId]
        : undefined,
    };
  }
}
