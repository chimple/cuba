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

  if (result.endpoint == undefined || result.endpoint == '' || result.endpoint == null) {
    result.endpoint = 'https://chimple.lrs.io/xapi/';
  }
  if (result.auth == undefined || result.auth == '' || result.auth == null) {
    result.auth = 'Basic ' + btoa('chimp:chimpoo');
  }

  return {
    endpoint: 'https://chimple.lrs.io/xapi/',
    auth: 'Basic ' + btoa('chimp:chimpoo'),
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