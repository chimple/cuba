
import { TinCan, Activity, Agent } from 'tincants';

interface IRecordStoreCfg {
  endpoint: string;
  auth?: string;
  user?: string;
  password?: string;
  extended?: Record<string, unknown>; // This should be an object, not a string
}

const actor = {
    /* actor properties */
};

const activity = {
    /* activity properties */
};

const lrs:IRecordStoreCfg  = {
  endpoint: 'https://mahvish-test-lrs.lrs.io/xapi/', // LRS endpoint
    auth: 'Basic ' + btoa('jeevlu:wugkem'), // Replace with your LRS credentials
};

// Create the tincan instance
const tincan = new TinCan({
    actor: new Agent(actor),
    activity: new Activity(activity),
});

tincan.addRecordStore(lrs);

// Export the tincan instance
export default tincan;