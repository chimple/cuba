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

function getDeeplinkParams(): IRecordStoreCfg {

  const result = Port.sendLaunchData();

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

const lrs: IRecordStoreCfg = getDeeplinkParams();

// Create the tincan instance
const tincan = new TinCan({});

tincan.addRecordStore(lrs);

// Export the tincan instance
export default tincan;