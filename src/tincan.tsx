import { TinCan } from 'tincants';
import {Plugins} from '@capacitor/core';
const { Port } = Plugins;

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

async function getDeeplinkParams(): Promise<IRecordStoreCfg> {
  const result = await Port.sendLaunchData();
  let actor : Actor = {name:'',mbox:''};
  try {
    actor = result.actor ? JSON.parse(result.actor) : {name: '', mbox: ''};
  } catch (error) {
    actor = {name: '', mbox: ''};
  }
  return {
    endpoint: result.endpoint ?? 'https://chimple.lrs.io/xapi/',
    auth: result.auth ?? 'Basic ' + btoa('chimp:chimpoo'),
    actor: actor,
    registration: result.registration ?? '',
  };
}

let tincan;

export async function reinitializeTincan() {
  try {
    const lrs = await getDeeplinkParams();
    tincan = new TinCan({});
    tincan.addRecordStore(lrs);
    return tincan;
  } catch (error){
    console.error('Failed to reinitialize tincan',error);
    return null;
  }
}

(async () => {
 tincan = await reinitializeTincan();
})();

export default tincan;