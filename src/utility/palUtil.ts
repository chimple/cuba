import {
  AbilityState,
  createEmptyAbilityState,
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
  public static async buildAbilityStateForCourse(
    studentId: string,
    courseId: string
  ): Promise<AbilityState> {
    const api = ServiceConfig.getI().apiHandler;
    const emptyState = createEmptyAbilityState();
    const course = await api.getCourse(courseId);

    if (!course?.subject_id || !course?.framework_id) {
      return emptyState;
    }

    const domains = await api.getDomainsBySubjectAndFramework(
      course.subject_id,
      course.framework_id
    );
    if (!domains.length) return emptyState;

    const competencies = await api.getCompetenciesByDomainIds(
      domains.map((domain) => domain.id)
    );
    if (!competencies.length) return emptyState;

    const outcomes = await api.getOutcomesByCompetencyIds(
      competencies.map((competency) => competency.id)
    );
    if (!outcomes.length) return emptyState;

    const skills = await api.getSkillsByOutcomeIds(
      outcomes.map((outcome) => outcome.id)
    );
    if (!skills.length) return emptyState;

    const results = await api.getResultsBySkillIds(
      studentId,
      skills.map((skill) => skill.id)
    );

    return this.composeAbilityState(course.subject_id, results);
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
}
