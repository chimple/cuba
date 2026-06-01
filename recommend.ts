#!/usr/bin/env node

/*
PAL Recommendation CLI

1. First recommendation
Command:
node recommend.ts first students.csv

Input:
students.csv

Required columns:
student_id

Uses:
result_history.csv

Output:
first_recommendations.csv
graphs/graph_<course_id>_<subject_id>.json

2. Next recommendation simulation
Command:
node recommend.ts next <course_id> --iterations 10 --pattern ones

Student override:
node recommend.ts next <course_id> --student <student_id> --iterations 10 --pattern struggle

Patterns:
ones       all outcomes are correct (1,1,1) → example: 1,1,1,1
zeros      all outcomes are wrong (0,0,0) → example: 0,0,0,0
alternate  outcomes alternate correct and wrong (1,0,1,0) → example: 1,0,1,0,1,0
struggle   outcomes are two wrong, one correct (0,0,1) → example: 0,0,1,0,0,1
improving  outcomes are one wrong, two correct (0,1,1) → example: 0,1,1,0,1,1,0,1,1

Multiple patterns:
node recommend.ts next <course_id> --iterations 10 --pattern ones/zeros/alternate

Output:
simulation.csv     // output file
played_results.csv
graphs/graph_<course_id>_<subject_id>.json

CSV columns:
scenario,iteration,student_id,course_id,played_lesson_id,played_chapter_id,played_skill_id,generated_outcomes,next_lesson_id,next_chapter_id,next_skill_id,skill_ability,outcome_ability,competency_ability,domain_ability,subject_ability,ability_state,graph_file

Generate result_history.csv:
Run the PostgreSQL query below in Supabase SQL Editor .
SELECT DISTINCT ON (r.student_id,r.course_id,r.lesson_id,r.skill_id) r.student_id,u.name AS student_name,sl.subject_id,sub.name AS subject_name,r.course_id,c.name AS course_name,r.lesson_id,l.name AS lesson_name,r.skill_id,sk.name AS skill_name,r.outcome_id,r.competency_id,comp.name AS competency_name,r.domain_id,d.name AS domain_name,r.skill_ability,r.outcome_ability,r.competency_ability,r.domain_ability,r.subject_ability,r.activities_scores,r.created_at FROM result r INNER JOIN subject_lesson sl ON r.lesson_id=sl.lesson_id LEFT JOIN "user" u ON r.student_id=u.id LEFT JOIN subject sub ON sl.subject_id=sub.id LEFT JOIN course c ON r.course_id=c.id LEFT JOIN lesson l ON r.lesson_id=l.id LEFT JOIN skill sk ON r.skill_id=sk.id LEFT JOIN competency comp ON r.competency_id=comp.id LEFT JOIN domain d ON r.domain_id=d.id ORDER BY r.student_id,r.course_id,r.lesson_id,r.skill_id,r.created_at DESC;

*/
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

require.extensions['.css'] = (m) => (m.exports = {});
require.extensions['.png'] = (m, f) => (m.exports = f);
require.extensions['.svg'] = (m, f) => (m.exports = f);

const fs = require('node:fs/promises');

let ServiceConfig;
let APIMode;
let palUtil;
let importTables;
const localPlayedLessonResults = new Map();
const DEFAULT_NEXT_STUDENT_ID = 'f3779dd0-3704-427e-b0de-9dd442c3a48b';
const playedResultsFile = 'played_results.csv';

const PAL_GROWTHBOOK_CONFIG = {
  blendWeights: {
    default: {
      skill: 0.1,
      outcome: 0.1,
      competency: 0.6,
      domain: 0.1,
      subject: 0.1,
    },
    subjects: {
      '54abf22e-7102-4e14-915b-acd8eab47d56': {
        skill: 0.55,
        outcome: 0.25,
        competency: 0.1,
        domain: 0.05,
        subject: 0.05,
      },
      'c5674cc5-48f8-40b8-8123-f5246ea0c5e8': {
        skill: 0.55,
        outcome: 0.25,
        competency: 0.1,
        domain: 0.05,
        subject: 0.05,
      },
    },
  },
  learningRates: {
    default: {
      skill: 0.5,
      outcome: 0.8,
      competency: 0.3,
      domain: 0.5,
      subject: 0.4,
    },
    subjects: {
      '54abf22e-7102-4e14-915b-acd8eab47d56': {
        skill: 0.022,
        outcome: 0.016,
        competency: 0.006,
        domain: 0.004,
        subject: 0.004,
      },
      'c5674cc5-48f8-40b8-8123-f5246ea0c5e8': {
        skill: 0.4882,
        outcome: 0.355,
        competency: 0.1331,
        domain: 0.0888,
        subject: 0.0888,
      },
    },
  },
};

const setupNodeRuntime = () => {
  global.window ??= {
    innerWidth: 1024,
    innerHeight: 768,
    location: { href: '', search: '', hash: '', pathname: '/' },
    addEventListener() {},
    removeEventListener() {},
  };
  global.location ??= global.window.location;
  global.document ??= {
    cookie: '',
    documentElement: { style: {} },
    body: { appendChild() {}, removeChild() {} },
    head: { appendChild() {} },
    addEventListener() {},
    removeEventListener() {},
    createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
  };
  global.navigator ??= { userAgent: 'node' };
  global.localStorage ??= {
    getItem: () => null,
    setItem() {},
    removeItem() {},
    clear() {},
  };
  global.sessionStorage ??= global.localStorage;
  global.window.localStorage ??= global.localStorage;
  global.window.sessionStorage ??= global.sessionStorage;
  global.MutationObserver ??= class {
    observe() {}
    disconnect() {}
  };
};

const silenceAppLogs = () => {
  console.log =
    console.info =
    console.warn =
    console.error =
    console.debug =
      () => {};
};

const init = async () => {
  if (palUtil) return;
  silenceAppLogs();
  setupNodeRuntime();
  require('esbuild-register/dist/node').register({
    target: 'node18',
    extensions: ['.ts', '.tsx'],
  });
  ({ ServiceConfig, APIMode } = require('./src/services/ServiceConfig.ts'));
  ({ palUtil } = require('./src/utility/palUtil.ts'));
  const { PAL_LEARNING_RATES_CONFIG } = require('./src/common/constants.ts');
  const {
    setCachedGrowthBookFeatureValue,
    getCachedGrowthBookFeatureValue,
  } = require('./src/growthbook/Growthbook.tsx');
  ServiceConfig.getInstance(APIMode.SUPABASE);
  setCachedGrowthBookFeatureValue(
    PAL_LEARNING_RATES_CONFIG,
    PAL_GROWTHBOOK_CONFIG,
  );
  const seededPalConfig = getCachedGrowthBookFeatureValue(
    PAL_LEARNING_RATES_CONFIG,
    null,
  );
  log(
    `seeded ${PAL_LEARNING_RATES_CONFIG} from hardcoded CLI config: ${JSON.stringify(
      seededPalConfig,
    )}`,
  );
  await useImportJsonForCurriculum();
};

const log = (message) => process.stderr.write(`[recommend] ${message}\n`);

const isActive = (row) =>
  row && row.is_deleted !== true && row.is_deleted !== 1;

const loadImportTables = async () => {
  if (importTables) return importTables;

  const json = JSON.parse(
    await fs.readFile('public/databases/import.json', 'utf8'),
  );
  importTables = new Map(
    json.tables.map((table) => {
      const columns = table.schema.map((item) => item.column);
      return [
        table.name,
        (table.values ?? []).map((values) =>
          Object.fromEntries(
            columns.map((column, index) => [column, values[index]]),
          ),
        ),
      ];
    }),
  );

  return importTables;
};

const table = (name) => importTables.get(name) ?? [];

const byId = (name, id) => table(name).find((row) => row.id === id);

const useImportJsonForCurriculum = async () => {
  await loadImportTables();
  const service = ServiceConfig.getI().apiHandler.s;

  service.getCourse = async (id) =>
    table('course').find((c) => c.id === id && isActive(c));
  service.getDomainsBySubjectAndFramework = async (subjectId, frameworkId) =>
    table('domain').filter(
      (d) =>
        d.subject_id === subjectId &&
        d.framework_id === frameworkId &&
        isActive(d),
    );
  service.getCompetenciesByDomainIds = async (domainIds) =>
    table('competency').filter(
      (c) => domainIds.includes(c.domain_id) && isActive(c),
    );
  service.getOutcomesByCompetencyIds = async (competencyIds) =>
    table('outcome').filter(
      (o) => competencyIds.includes(o.competency_id) && isActive(o),
    );
  service.getSkillsByOutcomeIds = async (outcomeIds) =>
    table('skill').filter(
      (s) => outcomeIds.includes(s.outcome_id) && isActive(s),
    );
  service.getSkillRelationsByTargetIds = async (targetSkillIds) =>
    table('skill_relation').filter(
      (r) => targetSkillIds.includes(r.target_skill_id) && isActive(r),
    );
  service.getSkillLessonsBySkillIds = async (skillIds) =>
    table('skill_lesson')
      .filter((sl) => skillIds.includes(sl.skill_id) && isActive(sl))
      .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
  service.getLessonsBylessonIds = async (lessonIds) => {
    const lessons = table('lesson').filter(
      (lesson) => lessonIds.includes(lesson.id) && isActive(lesson),
    );
    return lessons.length ? lessons : undefined;
  };
  service.getChaptersForCourse = async (courseId) =>
    table('chapter')
      .filter((chapter) => chapter.course_id === courseId && isActive(chapter))
      .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
  service.getLessonsForChapter = async (chapterId) => {
    const chapterLessons = table('chapter_lesson')
      .filter((cl) => cl.chapter_id === chapterId && isActive(cl))
      .sort((a, b) => (a.sort_index ?? 0) - (b.sort_index ?? 0));
    const lessonIds = chapterLessons.map((cl) => cl.lesson_id);
    return table('lesson').filter(
      (lesson) => lessonIds.includes(lesson.id) && isActive(lesson),
    );
  };
  service.getResultsBySkillIds = async () => [];
  service.getStudentResultInMap = async (studentId) =>
    localPlayedLessonResults.get(studentId) ?? {};
};

const parseCsvLine = (line) => {
  const values = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value);
  return values.map((item) => item.trim());
};

const readCsvRecords = async (file) => {
  const content = await fs.readFile(file, 'utf8');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    );
  });
};

const fileExists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};

const readStudents = async (file) =>
  (await readCsvRecords(file)).map((row) => ({
    student_id: row.student_id,
    course_id: row.course_id,
  }));

const uniqueBy = (items, getKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const setAbilityFromResult = (abilityState, result) => {
  const setAbility = (layer, id, value) => {
    const ability = toNumber(value);
    if (!id || ability === undefined) return;
    abilityState[layer] = { ...(abilityState[layer] ?? {}), [id]: ability };
  };

  setAbility('skill', result.skill_id, result.skill_ability);
  setAbility('outcome', result.outcome_id, result.outcome_ability);
  setAbility('competency', result.competency_id, result.competency_ability);
  setAbility('domain', result.domain_id, result.domain_ability);
  setAbility('subject', result.subject_id, result.subject_ability);
};

const requireValue = (row, fields) => {
  const missing = fields.filter((field) => !row[field]);
  if (missing.length)
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
};

const generateOutcomes = (pattern, count) => {
  switch (pattern) {
    case 'ones':
      return Array.from({ length: count }, () => true);
    case 'zeros':
      return Array.from({ length: count }, () => false);
    case 'alternate':
      return Array.from({ length: count }, (_, index) => index % 2 === 0);
    case 'struggle':
      return Array.from({ length: count }, (_, index) => index % 3 === 2);
    case 'improving':
      return Array.from({ length: count }, (_, index) => index % 3 !== 0);
    default:
      throw new Error(
        `Unknown pattern "${pattern}". Use only ones, zeros, alternate, struggle, or improving.`,
      );
  }
};

const canonicalPattern = (pattern) => {
  switch (pattern) {
    case 'ones':
      return 'ones';
    case 'zeros':
      return 'zeros';
    case 'alternate':
      return 'alternate';
    case 'struggle':
      return 'struggle';
    case 'improving':
      return 'improving';
    default:
      return pattern;
  }
};

const scenarioPatterns = (pattern) => {
  return uniqueBy(
    pattern
      .split(/[\/,|]+/)
      .map((item) => canonicalPattern(item.trim()))
      .filter(Boolean),
    (item) => item,
  );
};

const generatedOutcomeCount = () => 4 + Math.floor(Math.random() * 12);

const formatOutcomes = (outcomes) =>
  outcomes.map((outcome) => (outcome ? 1 : 0)).join(',');

const csvCell = (value) => {
  const cell = value === undefined || value === null ? '' : String(value);
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
};

const csvRow = (values) => values.map(csvCell).join(',');

const cleanNumber = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : '';

const writeCsvFile = async (file, header, rows) => {
  await fs.writeFile(file, [header, ...rows].join('\n') + '\n', 'utf8');
  log(`wrote ${file}`);
};

const sameSet = (left, right) =>
  left.size === right.size && [...left].every((item) => right.has(item));

const writeSimulationCsv = async (file, header, rows, courseIds) => {
  const newCourses = new Set(courseIds.filter(Boolean));
  let shouldAppend = false;

  if (await fileExists(file)) {
    const firstLine = (await fs.readFile(file, 'utf8')).split(/\r?\n/)[0];
    const existingRows = await readCsvRecords(file);
    const existingCourses = new Set(
      existingRows.map((row) => row.course_id).filter(Boolean),
    );
    shouldAppend =
      firstLine === header &&
      existingRows.length > 0 &&
      sameSet(existingCourses, newCourses);
  }

  if (shouldAppend) {
    await fs.appendFile(
      file,
      rows.join('\n') + (rows.length ? '\n' : ''),
      'utf8',
    );
    log(`appended ${file}`);
  } else {
    await writeCsvFile(file, header, rows);
  }
};

const resultTimestamp = (result) => Date.parse(result.created_at ?? '') || 0;

const dedupeLatestResults = (results) => {
  const latestByKey = new Map();

  for (const result of results) {
    const key = [result.student_id, result.course_id, result.skill_id].join(
      ':',
    );
    const existing = latestByKey.get(key);

    if (!existing || resultTimestamp(result) > resultTimestamp(existing)) {
      latestByKey.set(key, result);
    }
  }

  return Array.from(latestByKey.values()).sort((a, b) => {
    const studentCompare = String(a.student_id ?? '').localeCompare(
      String(b.student_id ?? ''),
    );
    if (studentCompare) return studentCompare;
    return resultTimestamp(a) - resultTimestamp(b);
  });
};

const localResultHistoryFile = 'result_history.csv';

const readLocalResultHistory = async () => {
  if (!(await fileExists(localResultHistoryFile))) return [];

  const rows = await readCsvRecords(localResultHistoryFile);
  const resultRows = rows
    .filter((row) => row.student_id && row.lesson_id && row.skill_id)
    .map((row) => ({
      ...row,
      skill_ability: toNumber(row.skill_ability),
      outcome_ability: toNumber(row.outcome_ability),
      competency_ability: toNumber(row.competency_ability),
      domain_ability: toNumber(row.domain_ability),
      subject_ability: toNumber(row.subject_ability),
      is_deleted: false,
    }));

  return filterSubjectLessonResults(dedupeLatestResults(resultRows));
};

const normalizePlayedHistoryRow = (row) => ({
  ...row,
  scenario: row.scenario,
  student_id: row.student_id,
  student_name: row.student_name,
  subject_id: row.subject_id,
  subject_name: row.subject_name,
  course_id: row.course_id,
  course_name: row.course_name,
  lesson_id: row.played_lesson_id ?? row.lesson_id,
  lesson_name: row.played_lesson_name ?? row.lesson_name,
  chapter_id: row.played_chapter_id ?? row.chapter_id,
  skill_id: row.played_skill_id ?? row.skill_id,
  skill_name: row.played_skill_name ?? row.skill_name,
  outcome_id: row.outcome_id,
  competency_id: row.competency_id,
  competency_name: row.competency_name,
  domain_id: row.domain_id,
  domain_name: row.domain_name,
  skill_ability: toNumber(row.skill_ability),
  outcome_ability: toNumber(row.outcome_ability),
  competency_ability: toNumber(row.competency_ability),
  domain_ability: toNumber(row.domain_ability),
  subject_ability: toNumber(row.subject_ability),
  activities_scores: row.activities_scores,
  generated_outcomes: row.generated_outcomes,
  next_lesson_id: row.next_lesson_id,
  next_chapter_id: row.next_chapter_id,
  next_skill_id: row.next_skill_id,
  graph_file: row.graph_file,
  created_at: row.created_at,
  is_deleted: false,
});

const readNextInputRows = async (file) =>
  ((await fileExists(file)) ? await readCsvRecords(file) : [])
    .map(normalizePlayedHistoryRow)
    .filter((row) => row.student_id && row.course_id);

const readNextInputRowsForCourse = async (courseId, studentId) => {
  const storedRows = (await readNextInputRows(playedResultsFile)).filter(
    (row) => row.student_id === studentId && row.course_id === courseId,
  );

  return storedRows.length
    ? storedRows
    : [{ student_id: studentId, course_id: courseId }];
};

const getLocalHistoryByStudent = async (studentIds) => {
  const allHistory = await readLocalResultHistory();
  const idSet = new Set(studentIds);
  const historyByStudent = new Map();

  for (const result of allHistory) {
    if (!idSet.has(result.student_id)) continue;
    if (!historyByStudent.has(result.student_id)) {
      historyByStudent.set(result.student_id, []);
    }
    historyByStudent.get(result.student_id).push(result);
  }

  if (allHistory.length) {
    log(
      `loaded ${allHistory.length} rows from local ${localResultHistoryFile}`,
    );
  }

  return historyByStudent;
};

const firstRecommendationHeader = [
  'iteration',
  'student_id',
  'student_name',
  'subject_id',
  'subject_name',
  'course_id',
  'course_name',
  'played_lesson_id',
  'played_lesson_name',
  'played_skill_id',
  'played_skill_name',
  'generated_outcomes',
  'next_lesson_id',
  'next_skill_id',
  'outcome_id',
  'competency_id',
  'competency_name',
  'domain_id',
  'domain_name',
  'skill_ability',
  'outcome_ability',
  'competency_ability',
  'domain_ability',
  'subject_ability',
  'activities_scores',
  'created_at',
  'ability_state',
  'graph_file',
];

const simulationHeader = [
  'scenario',
  'iteration',
  'student_id',
  'student_name',
  'subject_id',
  'subject_name',
  'course_id',
  'course_name',
  'played_lesson_id',
  'played_lesson_name',
  'played_chapter_id',
  'played_skill_id',
  'played_skill_name',
  'generated_outcomes',
  'next_lesson_id',
  'next_chapter_id',
  'next_skill_id',
  'outcome_id',
  'competency_id',
  'competency_name',
  'domain_id',
  'domain_name',
  'skill_ability',
  'outcome_ability',
  'competency_ability',
  'domain_ability',
  'subject_ability',
  'activities_scores',
  'created_at',
  'ability_state',
  'graph_file',
];

const latestResult = (results) =>
  [...results].sort((a, b) => resultTimestamp(b) - resultTimestamp(a))[0];

const studentFromHistory = (studentId, results = []) => ({
  id: studentId,
  name: results.find((result) => result.student_name)?.student_name ?? '',
});

const buildFirstRecommendationRow = ({
  iteration,
  latestPlayed,
  student,
  recommendation,
  abilityState,
  graph,
  graphFile = '',
  generatedOutcomes = '',
}) => {
  const subjectLesson = table('subject_lesson').find(
    (row) => row.lesson_id === latestPlayed?.lesson_id && isActive(row),
  );
  const subjectId =
    subjectLesson?.subject_id ??
    latestPlayed?.subject_id ??
    graph?.subjects?.[0]?.id ??
    '';
  const subject = byId('subject', subjectId);
  const course = byId('course', latestPlayed?.course_id);
  const lesson = byId('lesson', latestPlayed?.lesson_id);
  const skill = byId('skill', latestPlayed?.skill_id);
  const competency = byId('competency', latestPlayed?.competency_id);
  const domain = byId('domain', latestPlayed?.domain_id);

  return csvRow([
    iteration,
    latestPlayed?.student_id ?? '',
    student?.name ?? latestPlayed?.student_name ?? '',
    subjectId,
    subject?.name ?? latestPlayed?.subject_name ?? '',
    latestPlayed?.course_id ?? '',
    course?.name ?? latestPlayed?.course_name ?? '',
    latestPlayed?.lesson_id ?? '',
    lesson?.name ?? latestPlayed?.lesson_name ?? '',
    latestPlayed?.skill_id ?? '',
    skill?.name ?? latestPlayed?.skill_name ?? '',
    generatedOutcomes,
    recommendation.lesson?.id ?? '',
    recommendation.skillId ?? recommendation.recommendation?.candidateId ?? '',
    latestPlayed?.outcome_id ?? '',
    latestPlayed?.competency_id ?? '',
    competency?.name ?? latestPlayed?.competency_name ?? '',
    latestPlayed?.domain_id ?? '',
    domain?.name ?? latestPlayed?.domain_name ?? '',
    cleanNumber(latestPlayed?.skill_ability),
    cleanNumber(latestPlayed?.outcome_ability),
    cleanNumber(latestPlayed?.competency_ability),
    cleanNumber(latestPlayed?.domain_ability),
    cleanNumber(latestPlayed?.subject_ability),
    latestPlayed?.activities_scores ?? '',
    latestPlayed?.created_at ?? '',
    JSON.stringify(abilityState ?? {}),
    graphFile,
  ]);
};

const groupByCourse = (results) => {
  const groups = new Map();

  for (const result of results) {
    if (!result.course_id) continue;
    if (!groups.has(result.course_id)) groups.set(result.course_id, []);
    groups.get(result.course_id).push(result);
  }

  return groups;
};

const groupByStudentCourse = (results) => {
  const groups = new Map();

  for (const result of results) {
    if (!result.student_id || !result.course_id) continue;
    const key = [
      result.student_id,
      result.course_id,
      result.scenario ?? '',
    ].join(':');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  }

  return groups;
};

const subjectLessonIds = () =>
  new Set(
    table('subject_lesson')
      .filter(isActive)
      .map((row) => row.lesson_id)
      .filter(Boolean),
  );

const filterSubjectLessonResults = (results) => {
  const lessonIds = subjectLessonIds();
  return results.filter((result) => lessonIds.has(result.lesson_id));
};

const seedLatestResultHistory = async (studentId, courseId, results) => {
  const { abilityState, graph } = await palUtil.getAbilityStateAndGraph(
    studentId,
    courseId,
  );

  for (const result of results) {
    setAbilityFromResult(abilityState, result);
  }

  return { abilityState, graph };
};

const buildPlayedAbilityResult = ({
  base,
  lessonId,
  chapterId,
  skillId,
  outcomes,
  abilities,
}) => ({
  ...base,
  lesson_id: lessonId,
  lesson_name: byId('lesson', lessonId)?.name ?? base.lesson_name ?? '',
  chapter_id: chapterId ?? '',
  skill_id: skillId,
  skill_name: byId('skill', skillId)?.name ?? base.skill_name ?? '',
  outcome_id: abilities.outcome_id ?? base.outcome_id ?? '',
  competency_id: abilities.competency_id ?? base.competency_id ?? '',
  competency_name:
    byId('competency', abilities.competency_id)?.name ??
    base.competency_name ??
    '',
  domain_id: abilities.domain_id ?? base.domain_id ?? '',
  domain_name:
    byId('domain', abilities.domain_id)?.name ?? base.domain_name ?? '',
  subject_id: abilities.subject_id ?? base.subject_id ?? '',
  subject_name:
    byId('subject', abilities.subject_id)?.name ?? base.subject_name ?? '',
  skill_ability: abilities.skill_ability,
  outcome_ability: abilities.outcome_ability,
  competency_ability: abilities.competency_ability,
  domain_ability: abilities.domain_ability,
  subject_ability: abilities.subject_ability,
  activities_scores: formatOutcomes(outcomes),
  generated_outcomes: formatOutcomes(outcomes),
  created_at: new Date().toISOString(),
});

const parseJsonCell = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const existingNextPlayedRow = (result, iteration) =>
  buildNextRecommendationRow({
    scenario: result.scenario ?? '',
    iteration,
    playedResult: {
      ...result,
      generated_outcomes:
        result.generated_outcomes ?? result.activities_scores ?? '',
    },
    student: studentFromHistory(result.student_id, [result]),
    recommendation: {
      lesson: result.next_lesson_id ? { id: result.next_lesson_id } : undefined,
      skillId: result.next_skill_id,
      chapterId: result.next_chapter_id,
    },
    abilityState: parseJsonCell(result.ability_state, {}),
    graphFile: result.graph_file ?? '',
  });

const recommendationSkillId = (recommendation) =>
  recommendation.skillId ?? recommendation.recommendation?.candidateId ?? '';

const scenarioStudentId = (studentId, courseId, scenario) =>
  `${studentId}:${courseId}:${scenario}`;

const graphFileFor = async (courseId, graph) => {
  await fs.mkdir('graphs', { recursive: true });
  const subjectId = graph?.subjects?.[0]?.id ?? 'unknown-subject';
  const file = `graphs/graph_${courseId}_${subjectId}.json`;
  if (!(await fileExists(file))) {
    await fs.writeFile(file, JSON.stringify(graph ?? {}, null, 2), 'utf8');
    log(`wrote ${file}`);
  }
  return file;
};

const rememberPlayedLesson = (studentId, lessonId, result) => {
  if (!lessonId) return;
  const existing = localPlayedLessonResults.get(studentId) ?? {};
  existing[lessonId] = result;
  localPlayedLessonResults.set(studentId, existing);
};

const buildNextRecommendationRow = ({
  scenario,
  iteration,
  playedResult,
  student,
  recommendation,
  abilityState,
  graphFile,
}) => {
  const subjectLesson = table('subject_lesson').find(
    (row) => row.lesson_id === playedResult?.lesson_id && isActive(row),
  );
  const subjectId = subjectLesson?.subject_id ?? playedResult?.subject_id ?? '';
  const subject = byId('subject', subjectId);
  const course = byId('course', playedResult?.course_id);
  const lesson = byId('lesson', playedResult?.lesson_id);
  const skill = byId('skill', playedResult?.skill_id);
  const competency = byId('competency', playedResult?.competency_id);
  const domain = byId('domain', playedResult?.domain_id);

  return csvRow([
    scenario,
    iteration,
    playedResult?.student_id ?? '',
    student?.name ?? playedResult?.student_name ?? '',
    subjectId,
    subject?.name ?? playedResult?.subject_name ?? '',
    playedResult?.course_id ?? '',
    course?.name ?? playedResult?.course_name ?? '',
    playedResult?.lesson_id ?? '',
    lesson?.name ?? playedResult?.lesson_name ?? '',
    playedResult?.chapter_id ?? '',
    playedResult?.skill_id ?? '',
    skill?.name ?? playedResult?.skill_name ?? '',
    playedResult?.generated_outcomes ?? '',
    recommendation.lesson?.id ?? '',
    recommendation.chapterId ?? '',
    recommendationSkillId(recommendation),
    playedResult?.outcome_id ?? '',
    playedResult?.competency_id ?? '',
    competency?.name ?? playedResult?.competency_name ?? '',
    playedResult?.domain_id ?? '',
    domain?.name ?? playedResult?.domain_name ?? '',
    cleanNumber(playedResult?.skill_ability),
    cleanNumber(playedResult?.outcome_ability),
    cleanNumber(playedResult?.competency_ability),
    cleanNumber(playedResult?.domain_ability),
    cleanNumber(playedResult?.subject_ability),
    playedResult?.activities_scores ?? '',
    playedResult?.created_at ?? '',
    JSON.stringify(abilityState ?? {}),
    graphFile,
  ]);
};

const cleanup = async () => {
  const supabase = ServiceConfig?.getI()?.apiHandler?.s?.supabase;
  await supabase?.removeAllChannels?.();
  supabase?.realtime?.disconnect?.();
  supabase?.auth?.stopAutoRefresh?.();
  supabase?.auth?.broadcastChannel?.close?.();
};

async function runFirstRecommendation(
  file,
  outputFile = 'first_recommendations.csv',
) {
  await init();
  const rows = [];
  const students = uniqueBy(await readStudents(file), (row) => row.student_id);
  const studentsWithoutCourse = students.filter((row) => !row.course_id);
  const studentsWithCourse = students.filter((row) => row.course_id);

  const addRecommendationRows = async (studentId, student, groupedResults) => {
    let iteration = rows.length + 1;

    for (const [courseId, courseResults] of groupedResults.entries()) {
      const { abilityState, graph } = await seedLatestResultHistory(
        studentId,
        courseId,
        courseResults,
      );
      const graphFile = await graphFileFor(courseId, graph);

      const recommendation = await palUtil.getRecommendedLessonForCourse(
        studentId,
        courseId,
      );

      rows.push(
        buildFirstRecommendationRow({
          iteration,
          latestPlayed: latestResult(courseResults),
          student,
          recommendation,
          abilityState,
          graph,
          graphFile,
        }),
      );
      iteration += 1;
    }
  };

  if (studentsWithoutCourse.length) {
    const studentIds = studentsWithoutCourse.map((row) => row.student_id);
    const localHistoryByStudent = await getLocalHistoryByStudent(studentIds);
    const historyByStudent = new Map();

    for (const result of Array.from(localHistoryByStudent.values()).flat()) {
      if (!historyByStudent.has(result.student_id)) {
        historyByStudent.set(result.student_id, []);
      }
      historyByStudent.get(result.student_id).push(result);
    }

    for (const row of studentsWithoutCourse) {
      requireValue(row, ['student_id']);
      const studentHistory = filterSubjectLessonResults(
        historyByStudent.get(row.student_id) ?? [],
      );
      const groupedResults = groupByCourse(studentHistory);

      log(
        `latest result history rows used for ${row.student_id}: ${studentHistory.length}`,
      );

      if (!groupedResults.size) continue;

      await addRecommendationRows(
        row.student_id,
        studentFromHistory(row.student_id, studentHistory),
        groupedResults,
      );
    }
  }

  for (const row of studentsWithCourse) {
    requireValue(row, ['student_id']);
    const localHistoryByStudent = await getLocalHistoryByStudent([
      row.student_id,
    ]);
    let filteredHistory = (
      localHistoryByStudent.get(row.student_id) ?? []
    ).filter((result) => result.course_id === row.course_id);

    const groupedResults = groupByCourse(filteredHistory);

    log(
      `latest result history rows used for ${row.student_id}: ${filteredHistory.length}`,
    );

    if (!groupedResults.size) continue;

    await addRecommendationRows(
      row.student_id,
      studentFromHistory(row.student_id, filteredHistory),
      groupedResults,
    );
  }

  await writeCsvFile(outputFile, firstRecommendationHeader.join(','), rows);
}

async function runNextRecommendation(courseId, options = parseNextOptions([])) {
  await runNextIterations(courseId, {
    iterations: options.iterations,
    pattern: options.pattern,
    outputFile: options.outputFile,
    studentId: options.studentId,
  });
}

async function runNextIterations(courseId, options) {
  if (!courseId) throw new Error('Missing course_id for next recommendation');
  await init();
  const iterations = options.iterations;
  const patterns = scenarioPatterns(options.pattern);
  const sourceRows = await readNextInputRowsForCourse(
    courseId,
    options.studentId,
  );
  const inputRows = [];

  for (const baseRow of uniqueBy(
    sourceRows,
    (row) => `${row.student_id}:${row.course_id}`,
  )) {
    for (const scenario of patterns) {
      const scenarioHistory = sourceRows.filter(
        (row) =>
          row.student_id === baseRow.student_id &&
          row.course_id === baseRow.course_id &&
          canonicalPattern(row.scenario ?? '') === scenario &&
          row.lesson_id &&
          row.skill_id,
      );

      if (scenarioHistory.length) {
        inputRows.push(...scenarioHistory.map((row) => ({ ...row, scenario })));
      } else {
        inputRows.push({ ...baseRow, scenario });
      }
    }
  }

  const history = inputRows.filter((row) => row.lesson_id && row.skill_id);
  const playedRows = history.map((result, index) =>
    existingNextPlayedRow(result, index + 1),
  );
  const simulationRows = [];
  let nextPlayedIteration = playedRows.length + 1;

  for (const courseResults of groupByStudentCourse(inputRows).values()) {
    const playedHistory = filterSubjectLessonResults(
      courseResults.filter((row) => row.lesson_id && row.skill_id),
    );
    const seededResults = dedupeLatestResults(playedHistory);
    const seedByLesson = Object.fromEntries(
      playedHistory
        .filter((row) => row.lesson_id)
        .map((row) => [row.lesson_id, row]),
    );
    const latest = latestResult(seededResults) ?? courseResults[0];
    const scenario = latest.scenario ?? options.pattern;
    const palStudentId = scenarioStudentId(
      latest.student_id,
      latest.course_id,
      scenario,
    );
    const student = studentFromHistory(latest.student_id, courseResults);
    let nextLessonId = latest.next_lesson_id;
    let nextChapterId = latest.next_chapter_id;
    let nextSkillId = latest.next_skill_id;

    localPlayedLessonResults.set(palStudentId, seedByLesson);

    const initialState = await seedLatestResultHistory(
      palStudentId,
      latest.course_id,
      seededResults,
    );
    const graphFile = await graphFileFor(latest.course_id, initialState.graph);

    if (!nextLessonId || !nextSkillId) {
      const initialRecommendation = await palUtil.getRecommendedLessonForCourse(
        palStudentId,
        latest.course_id,
      );
      nextLessonId = initialRecommendation.lesson?.id ?? '';
      nextChapterId = initialRecommendation.chapterId ?? '';
      nextSkillId = recommendationSkillId(initialRecommendation);
    }

    for (let iteration = 1; iteration <= iterations; iteration += 1) {
      if (!nextLessonId || !nextSkillId) {
        log(
          `skipping student_id=${latest.student_id} course_id=${latest.course_id}; no playable recommendation`,
        );
        break;
      }

      const outcomeCount = generatedOutcomeCount();
      const outcomes = generateOutcomes(scenario, outcomeCount);
      log(
        `scenario=${scenario} iteration=${iteration} student_id=${latest.student_id} course_id=${latest.course_id} outcome_count=${outcomeCount} outcomes=${formatOutcomes(outcomes)}`,
      );

      const abilities = await palUtil.updateAndGetAbilities({
        studentId: palStudentId,
        courseId: latest.course_id,
        skillId: nextSkillId,
        outcomes,
      });
      const { abilityState, graph } = await palUtil.getAbilityStateAndGraph(
        palStudentId,
        latest.course_id,
      );

      const playedResult = buildPlayedAbilityResult({
        base: latest,
        lessonId: nextLessonId,
        chapterId: nextChapterId,
        skillId: nextSkillId,
        outcomes,
        abilities,
      });
      playedResult.scenario = scenario;

      rememberPlayedLesson(palStudentId, nextLessonId, playedResult);
      const recommendation = await palUtil.getRecommendedLessonForCourse(
        palStudentId,
        latest.course_id,
      );
      await graphFileFor(latest.course_id, graph);

      const row = buildNextRecommendationRow({
        scenario,
        iteration: nextPlayedIteration,
        playedResult,
        student,
        recommendation,
        abilityState,
        graphFile,
      });
      nextPlayedIteration += 1;
      playedRows.push(row);
      simulationRows.push(
        buildNextRecommendationRow({
          scenario,
          iteration,
          playedResult,
          student,
          recommendation,
          abilityState,
          graphFile,
        }),
      );

      nextLessonId = recommendation.lesson?.id ?? '';
      nextChapterId = recommendation.chapterId ?? '';
      nextSkillId = recommendationSkillId(recommendation);
    }
  }

  await writeCsvFile(playedResultsFile, simulationHeader.join(','), playedRows);
  await writeSimulationCsv(
    options.outputFile,
    simulationHeader.join(','),
    simulationRows,
    inputRows.map((row) => row.course_id),
  );
}

const parseNextOptions = (args) => {
  const options = {
    iterations: 1,
    outputFile: 'simulation.csv',
    pattern: 'ones/zeros/alternate/struggle/improving',
    studentId: DEFAULT_NEXT_STUDENT_ID,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--iterations' || arg === '-i') {
      options.iterations = Number(args[++index]);
    } else if (arg === '--pattern' || arg === '-p') {
      options.pattern = args[++index];
    } else if (arg === '--output' || arg === '-o') {
      options.outputFile = args[++index];
    } else if (arg === '--student' || arg === '--student-id') {
      options.studentId = args[++index];
    } else if (!arg.startsWith('-')) {
      options.outputFile = arg;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.iterations) || options.iterations < 1) {
    throw new Error('--iterations must be a positive integer');
  }
  if (!options.studentId) throw new Error('--student must be a valid id');
  return options;
};

const main = async () => {
  const [, , mode, file, ...args] = process.argv;

  switch (mode) {
    case 'first':
      await runFirstRecommendation(file, args[0]);
      break;
    case 'next': {
      const options = parseNextOptions(args);
      await runNextRecommendation(file, options);
      break;
    }
    default:
      throw new Error(
        'Usage: node recommend.ts first students.csv [output.csv] | node recommend.ts next course_id [--iterations N] [--pattern ones|zeros|alternate|struggle|improving] [--student student_id] [--output output.csv]',
      );
  }

  await cleanup();
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message ?? error}\n`);
    process.exitCode = 1;
  });
}

module.exports = { runFirstRecommendation, runNextRecommendation };
