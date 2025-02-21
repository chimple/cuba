import tincan from "../../tincan";
import  {IGetStatementCfg}  from "../../interface/xAPIInterface";
import { IStatement } from "../../interface/learningUnits";

class XAPIService {
    private createStatement = (): IStatement => {
        return {
            actor: {
            name: 'name',
            mbox: `mailto:${"name".toLowerCase().replace(/\s+/g, "")}@example.com`,
            },
            verb: {
            id: "http://adlnet.gov/expapi/verbs/completed",
            display: { "en-US": "completed" },
            },
            object: {
            id: `http://example.com/activities/${"lesson"}`,
            definition: {
                name: { "en-US": "lesson" },
            },
            },
        };
    };


  sendStatement = async (): Promise<void> => {
    const statement = this.createStatement();
    try {
      await tincan.sendStatement(statement as any);
      console.log('Statement sent successfully:', statement);
    } catch (error) {
      console.error('Error sending statement:', error);
    }
  };

  // Function to get xAPI statements
  getStatements = async (queryStatement: IGetStatementCfg): Promise<void> => {
    try {
      const statement = await tincan.getStatements(queryStatement as any); // Assuming the getStatements method is typed
      console.log('Retrieved Statements:', statement);
    } catch (error) {
      console.error('Error fetching statements:', error);
    }
  };
}

const xAPIService = new XAPIService();
export default xAPIService;
