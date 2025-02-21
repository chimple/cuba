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
  