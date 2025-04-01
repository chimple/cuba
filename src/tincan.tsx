
import { TinCan } from 'tincants';

interface IRecordStoreCfg {
  endpoint: string;
  auth?: string;
}

const lrs:IRecordStoreCfg  = {
  endpoint: 'https://chimple.lrs.io/xapi/', // LRS endpoint
    auth: 'Basic ' + btoa('chimp:chimpoo'), // Replace with your LRS credentials
};

// Create the tincan instance
const tincan = new TinCan({});

tincan.addRecordStore(lrs);

// Export the tincan instance
export default tincan;