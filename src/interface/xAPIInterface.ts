export interface IGetStatementCfg {
    agent?: {
      mbox: string;
    };
    verb?: {
      id: string;
    };
    activity?: {
      id: string;
    };
    since?: string; // Optional: to filter statements from a specific timestamp
    until?: string; // Optional: to filter statements until a specific timestamp
    limit?: number; // Optional: limit the number of results
}