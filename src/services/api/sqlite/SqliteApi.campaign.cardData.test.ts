import { SqliteApiCampaignManagement } from './SqliteApi.campaign.management';
import { showCampaignCertificate } from '../../../components/campaignCertificate';
import { saveEligibleCampaignIds } from './campaignRewardEligibility';

jest.mock('./SqliteApi.assignment.assessments', () => ({
  SqliteApiAssignmentAssessments: class {},
}));
jest.mock('../../../utility/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../../components/campaignCertificate', () => ({
  showCampaignCertificate: jest.fn(),
}));
jest.mock('../../../redux/store', () => ({ store: { dispatch: jest.fn() } }));

const initSqlJs = require('sql.js/dist/sql-asm.js');
type SqlDatabase = {
  run: (sql: string, values?: unknown[]) => void;
  exec: (
    sql: string,
    values?: unknown[],
  ) => Array<{ columns: string[]; values: unknown[][] }>;
  close: () => void;
};

let db: SqlDatabase;
let api: SqliteApiCampaignManagement;
beforeEach(async () => {
  localStorage.clear();
  jest.clearAllMocks();
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run(`
    CREATE TABLE local_campaigns (id TEXT PRIMARY KEY, name TEXT, rules_json TEXT,
      start_date TEXT, end_date TEXT, status TEXT, objective TEXT, target_type TEXT,
      target_value INTEGER, updated_at TEXT, is_deleted INTEGER);
    CREATE TABLE assignment (id TEXT, lesson_id TEXT, campaign_id TEXT, is_deleted INTEGER,
      source TEXT, starts_at TEXT, class_id TEXT, is_class_wise INTEGER);
    CREATE TABLE class_user (class_id TEXT, user_id TEXT, is_deleted INTEGER);
    CREATE TABLE assignment_user (assignment_id TEXT, user_id TEXT, is_deleted INTEGER);
    CREATE TABLE result (id TEXT, assignment_id TEXT, lesson_id TEXT, student_id TEXT,
      created_at TEXT, status TEXT, is_deleted INTEGER, source TEXT);
    CREATE TABLE user_campaign_rewards (campaign_id TEXT, student_id TEXT,
      rank_achieved INTEGER, status TEXT, has_unseen_certificate INTEGER DEFAULT 0,
      lessons_completed_count INTEGER DEFAULT 0, lessons_target_count INTEGER DEFAULT 0,
      completion_percentage INTEGER DEFAULT 0, certificate_available INTEGER DEFAULT 0,
      evaluated_at TEXT, updated_at TEXT, is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY(campaign_id, student_id));
    INSERT INTO assignment (id, lesson_id, campaign_id, is_deleted)
    VALUES ('a1','l1','campaign',0), ('a2','l2','campaign',0),
      ('a3','l3','campaign',0), ('a4','l4','campaign',0);
  `);
  db.run(
    'INSERT INTO local_campaigns VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      'campaign',
      'Reward Test 7.1',
      JSON.stringify({
        rules: [
          { rank: 1, min: 40 },
          { rank: 2, min: 20 },
          { rank: 3, min: 1 },
        ],
      }),
      '2000-01-01',
      '2099-01-01',
      'active',
      'homework_campaign',
      'percentage_completion',
      999,
      '',
      0,
    ],
  );
  saveEligibleCampaignIds('child', new Set(['campaign']));
  api = new SqliteApiCampaignManagement();
  Object.assign(api, {
    ensureInitialized: jest.fn().mockResolvedValue(undefined),
    _serverApi: {
      upsertCampaignStudentReward: jest.fn().mockResolvedValue(undefined),
    },
    executeQuery: async (sql: string, values: unknown[] = []) => {
      const result = db.exec(sql, values)[0];
      return {
        values: result
          ? result.values.map((row) =>
              Object.fromEntries(
                result.columns.map((name, i) => [name, row[i]]),
              ),
            )
          : [],
      };
    },
  });
});
afterEach(() => db.close());

it('refreshes a legacy cached reward without changing its card fields', async () => {
  db.run(`INSERT INTO user_campaign_rewards (campaign_id,student_id,status,evaluated_at)
    VALUES ('campaign','child','in_progress','2000-01-01')`);
  await api.hydrateCampaignRewards('child');
  const rewards = await api.getCachedCampaignRewards('child');
  expect(rewards).toEqual([
    expect.objectContaining({
      lessons_completed_count: 0,
      lessons_target_count: 4,
      completion_percentage: 0,
      status: 'in_progress',
      rank_achieved: null,
      certificate_available: 0,
    }),
  ]);
  expect(await api.getCachedCampaignRewards('other-child')).toEqual([]);
});

it.each([
  ['percentage_completion', 1],
  ['number_of_lessons', 3],
])(
  'persists progress while preserving rank calculation for %s',
  async (targetType, expectedRank) => {
    db.run('UPDATE local_campaigns SET target_type = ?', [targetType]);
    db.run(`INSERT INTO result VALUES
    ('r1','a1','l1','child','2026-01-01','completed',0,NULL),
    ('r2','a2','l2','child','2026-01-02','completed',0,NULL)`);
    await api.hydrateCampaignRewards('child');
    const [reward] = await api.getCachedCampaignRewards('child');
    expect(reward).toMatchObject({
      lessons_completed_count: 2,
      lessons_target_count: 4,
      completion_percentage: 50,
      rank_achieved: expectedRank,
      status: 'won',
      certificate_available: 1,
    });
  },
);

const setupHomepage = (count: number) => {
  db.run(
    "UPDATE local_campaigns SET objective = 'homepage_learning_pathway_campaign', target_value = 10",
  );
  for (let i = 0; i < count; i++) {
    db.run('INSERT INTO result VALUES (?, NULL, ?, ?, ?, ?, 0, ?)', [
      `home-${i}`,
      `home-lesson-${i}`,
      'child',
      '2026-01-01',
      'completed',
      i % 2 ? 'learning_pathway_home_pal' : 'learning_pathway_home_no_pal',
    ]);
  }
};

it.each([
  [0, 0, null],
  [12, 20, 3],
  [14, 20, 3],
  [55, 100, 1],
])(
  'uses available homepage result history for %i lessons',
  async (count, percentage, rank) => {
    setupHomepage(count);
    await api.hydrateCampaignRewards('child');
    const [reward] = await api.getCachedCampaignRewards('child');
    expect(reward).toMatchObject({
      lessons_completed_count: count,
      lessons_target_count: 50,
      completion_percentage: percentage,
      rank_achieved: rank,
    });
    expect(showCampaignCertificate).not.toHaveBeenCalled();
  },
);

it('excludes replays, other students, non-homepage sources, invalid results and out-of-window results', async () => {
  setupHomepage(1);
  db.run(`INSERT INTO result VALUES
    ('replay',NULL,'home-lesson-0','child','2026-01-02','completed',0,'learning_pathway_home_pal'),
    ('other',NULL,'other','other-child','2026-01-01','completed',0,'learning_pathway_home_pal'),
    ('homework',NULL,'hw','child','2026-01-01','completed',0,'homework'),
    ('before',NULL,'early','child','1999-12-31','completed',0,'learning_pathway_home_pal'),
    ('after',NULL,'late','child','2100-01-01','completed',0,'learning_pathway_home_pal'),
    ('exit',NULL,'exit','child','2026-01-01','system_exit',0,'learning_pathway_home_pal'),
    ('deleted',NULL,'deleted','child','2026-01-01','completed',1,'learning_pathway_home_pal');`);
  await api.hydrateCampaignRewards('child');
  expect(
    (await api.getCachedCampaignRewards('child'))[0].lessons_completed_count,
  ).toBe(1);
});

it('does not display a certificate during lesson completion', async () => {
  setupHomepage(12);
  await api.hydrateCampaignRewards('child');
  expect(showCampaignCertificate).not.toHaveBeenCalled();
  await api.evaluateCampaignRewardsAfterLesson('child');
  expect(showCampaignCertificate).not.toHaveBeenCalled();
});

it('displays an eligible certificate during ended-campaign hydration', async () => {
  db.run("UPDATE local_campaigns SET end_date = '2026-11-19'");
  db.run(`INSERT INTO result VALUES
    ('r1','a1','l1','child','2026-11-19','completed',0,NULL),
    ('r2','a2','l2','child','2026-11-19','completed',0,NULL)`);

  await api.hydrateCampaignRewards('child');

  expect(showCampaignCertificate).toHaveBeenCalledTimes(1);
});
