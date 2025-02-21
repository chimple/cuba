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

export interface IStatement {
    actor: {
      name: string;
      mbox: string;
    };
    verb: {
      id: string;
      display: {
        "en-US": string;
      };
    };
    object: {
      id: string;
      definition: {
        name: {
          "en-US": string;
        };
      };
    };
  }
  