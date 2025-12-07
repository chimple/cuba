import {
  AbilityState,
  DependencyGraph,
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
