import { TinCan } from 'tincants';

interface Actor {
  name: string | string[];
  mbox: string | string[];
}

interface IRecordStoreCfg {
  endpoint: string;
  auth?: string;
  actor?: Actor;
  registration?: string;
}

function getDeeplinkParams(params: Partial<IRecordStoreCfg>): IRecordStoreCfg {
  return {
    endpoint: params.endpoint ?? 'https://chimple.lrs.io/xapi/',
    auth: params.auth ?? 'Basic ' + btoa('chimp:chimpoo'),
    actor: params.actor ?? { name: '', mbox: '' },
    registration: params.registration ?? '',
  };
}

const deeplinkParams: Partial<IRecordStoreCfg> = {};

const lrs: IRecordStoreCfg = getDeeplinkParams(deeplinkParams);

// Create the tincan instance
const tincan = new TinCan({});

tincan.addRecordStore(lrs);

// Export the tincan instance
export default tincan;