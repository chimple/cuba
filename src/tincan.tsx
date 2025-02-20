import TinCan from 'tincanjs';

// Define the type for the LRS configuration
interface LRSConfig {
  endpoint: string;
  auth: string;
  user: string;
  password: string;
  extended: string;
}

// Configure TinCan with the LRS endpoint and credentials
const tincan = new TinCan.LRS({
  endpoint: 'https://mahvish-test-lrs.lrs.io/xapi/', // LRS endpoint
  auth: 'Basic ' + btoa('jeevlu:wugkem'), // Replace with your LRS credentials
  user: 'jeevlu',
  password: 'wugkem',
  extended: "",
} as LRSConfig);

export default tincan;