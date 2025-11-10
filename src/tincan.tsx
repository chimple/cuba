import { TinCan } from 'tincants';
import { registerPlugin } from '@capacitor/core';
import { PortPlugin } from './common/constants';
import { Util } from './utility/util'; // << add import
const Port = registerPlugin<PortPlugin>('Port');
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

  // 1) start with stored endpoint (or default)
  const storedEndpoint = Util.getDbEndpoint(); // default fallback inside Util
  let endpoint = storedEndpoint;

  // 2) if deeplink provided endpoint, override and persist it
  if (result.endpoint && result.endpoint !== "") {
    endpoint = result.endpoint;
    Util.setDbEndpoint(endpoint);
  } else {
    // ensure saved if nothing was present (getDbEndpoint already returns default)
    Util.setDbEndpoint(endpoint);
  }

  // Use auth from deeplink directly if present, otherwise fallback to default header
  const authHeader = result.auth && result.auth !== '' ? result.auth : 'Basic ' + btoa('chimp:chimpoo');

  return {
    endpoint,
    auth: authHeader,
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