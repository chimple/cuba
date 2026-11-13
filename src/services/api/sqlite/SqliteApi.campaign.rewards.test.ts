import { SqliteApiCampaignRewards } from './SqliteApi.campaign.rewards';

jest.mock('./SqliteApi.assignment.assessments', () => ({
  SqliteApiAssignmentAssessments: class {},
}));
jest.mock('../../../utility/logger', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));
jest.mock('../../../components/campaignCertificate', () => ({
  showCampaignCertificate: jest.fn(),
}));

const initSqlJs = require('sql.js/dist/sql-asm.js');
type SqlDatabase = {
  run: (sql: string, values?: unknown[]) => void;
  exec: (
    sql: string,
    values?: unknown[],
  ) => Array<{ columns: string[]; values: unknown[][] }>;
  close: () => void;
};

describe('offline campaign reward evaluation', () => {
  let db: SqlDatabase;
  let api: SqliteApiCampaignRewards;
  let queueUpload: jest.Mock;
  const key = (studentId: string) =>
    `campaignLastFetch:studentScoped:${studentId}:eligible`;
  beforeEach(async () => {
    localStorage.clear();
    const SQL = await initSqlJs();
    db = new SQL.Database();
    db.run(`
      CREATE TABLE local_campaigns (id TEXT PRIMARY KEY, name TEXT, rules_json TEXT,
        objective TEXT, target_value INTEGER, start_date TEXT, end_date TEXT,
        status TEXT, updated_at TEXT, is_deleted INTEGER);
      CREATE TABLE assignment (id TEXT, lesson_id TEXT, campaign_id TEXT,
        source TEXT, starts_at TEXT, is_class_wise INTEGER, class_id TEXT, is_deleted INTEGER);
      CREATE TABLE result (id TEXT, assignment_id TEXT, lesson_id TEXT, student_id TEXT,
        source TEXT, created_at TEXT, status TEXT, is_deleted INTEGER);
      CREATE TABLE assignment_user (assignment_id TEXT, user_id TEXT, is_deleted INTEGER);
      CREATE TABLE class_user (class_id TEXT, user_id TEXT, is_deleted INTEGER);
      CREATE TABLE user_campaign_rewards (campaign_id TEXT, student_id TEXT,
        lessons_completed_count INTEGER, lessons_target_count INTEGER, completion_percentage INTEGER,
        rank_achieved INTEGER, status TEXT, certificate_available INTEGER,
        evaluated_at TEXT, updated_at TEXT, is_deleted INTEGER, PRIMARY KEY(campaign_id, student_id));
    `);
    api = new SqliteApiCampaignRewards();
    queueUpload = jest.fn().mockResolvedValue(undefined);
    Object.assign(api, {
      ensureInitialized: jest.fn().mockResolvedValue(undefined),
      queueCampaignRewardUpload: queueUpload,
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
    localStorage.setItem(key('student-a'), '["campaign-a"]');
    db.run(`INSERT INTO local_campaigns VALUES
      ('campaign-a', 'Homepage', '{"rules":[{"rank":1,"min":2},{"rank":2,"min":1}]}',
      'homepage_learning_pathway_campaign', 99, '2026-01-01', '2026-01-31', 'active', '', 0),
      ('campaign-b', 'Other child', '{"rules":[]}', 'homework_campaign', NULL,
      '2026-01-01', '2026-01-31', 'active', '', 0);
      INSERT INTO assignment VALUES
      ('a1', 'l1', NULL, 'learning_pathway_home_no_pal', '2026-01-10', 0, NULL, 0),
      ('a2', 'l2', NULL, 'learning_pathway_home_no_pal', '2026-01-11', 0, NULL, 0);
      INSERT INTO assignment_user VALUES ('a1', 'student-a', 0), ('a2', 'student-a', 0);
      INSERT INTO result VALUES
      ('r1', 'a1', 'l1', 'student-a', 'learning_pathway_home_no_pal', '2026-01-15', 'completed', 0),
      ('r2', 'a2', 'l2', 'student-a', 'learning_pathway_home_no_pal', '2026-02-01', 'completed', 0);
    `);
  });
  afterEach(() => db.close());

  it('excludes results outside the campaign period and ranks by completed lessons', async () => {
    await api.hydrateCampaignRewards('student-a');
    const rewards = await api.getCachedCampaignRewards('student-a');
    expect(rewards).toEqual([
      expect.objectContaining({
        campaign_id: 'campaign-a',
        lessons_completed_count: 1,
        lessons_target_count: 2,
        completion_percentage: 50,
        rank_achieved: 2,
      }),
    ]);
    expect(queueUpload).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 'campaign-a',
        studentId: 'student-a',
        rankAchieved: 2,
      }),
    );
  });

  it('does not evaluate another student’s campaigns or display their rewards', async () => {
    await api.hydrateCampaignRewards('student-b');
    expect(await api.getCachedCampaignRewards('student-b')).toEqual([]);
    expect(queueUpload).not.toHaveBeenCalled();
  });

  it('preserves existing cached rewards offline before the first eligibility refresh', async () => {
    await api.hydrateCampaignRewards('student-a');
    localStorage.removeItem(key('student-a'));
    expect(await api.getCachedCampaignRewards('student-a')).toHaveLength(1);
  });

  it.each([
    ['before the start', '2025-12-31', 1],
    ['after the end', '2026-02-01', 1],
    ['at the start', '2026-01-01', 2],
    ['at the end', '2026-01-31', 2],
    ['during the campaign', '2026-01-20', 2],
  ])(
    'counts homework results by campaign dates: %s',
    async (_label, date, expected) => {
      db.run(`UPDATE local_campaigns SET objective = 'homework_campaign' WHERE id = 'campaign-a';
      UPDATE assignment SET campaign_id = 'campaign-a';`);
      db.run('UPDATE local_campaigns SET rules_json = ? WHERE id = ?', [
        JSON.stringify({
          rules: [
            { rank: 1, min: 100 },
            { rank: 2, min: 50 },
          ],
        }),
        'campaign-a',
      ]);
      db.run('UPDATE result SET created_at = ? WHERE id = ?', [date, 'r2']);
      await api.hydrateCampaignRewards('student-a');
      const rewards = await api.getCachedCampaignRewards('student-a');
      expect(rewards[0]).toMatchObject({
        lessons_completed_count: expected,
        lessons_target_count: 2,
        completion_percentage: expected === 2 ? 100 : 50,
        rank_achieved: expected === 2 ? 1 : 2,
      });
    },
  );

  it('removes eligibility only for the student whose RPC reports deletion', async () => {
    localStorage.setItem(key('student-b'), '["campaign-a"]');
    api.getActiveCampaigns = jest
      .fn()
      .mockResolvedValue([
        { campaign_id: 'campaign-a', change_type: 'delete' },
      ]);
    await api.syncCampaignRewards('student-a');
    expect(await api.getCachedCampaignRewards('student-a')).toEqual([]);
    await api.hydrateCampaignRewards('student-b');
    expect(await api.getCachedCampaignRewards('student-b')).toHaveLength(1);
  });
});
