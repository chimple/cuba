import { SplashScreen } from '@capacitor/splash-screen';
import { AccountManager } from 'account-manager';
import { AccountManagerWeb } from 'account-manager/dist/esm/web';

window.customElements.define(
  'capacitor-welcome',
  class extends HTMLElement {
    constructor() {
      super();

      SplashScreen.hide();

      const root = this.attachShadow({ mode: 'open' });

      root.innerHTML = `
    <style>
      :host {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        display: block;
        width: 100%;
        height: 100%;
      }
      h1, h2, h3, h4, h5 {
        text-transform: uppercase;
      }
      .button {
        display: inline-block;
        padding: 10px;
        background-color: #73B5F6;
        color: #fff;
        font-size: 0.9em;
        border: 0;
        border-radius: 3px;
        text-decoration: none;
        cursor: pointer;
      }
      main {
        padding: 15px;
        display: grid;
        justify-content: center;
      }
      main hr { height: 1px; background-color: #eee; border: 0; }
      main h1 {
        font-size: 1.4em;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      main h2 {
        font-size: 1.1em;
      }
      main h3 {
        font-size: 0.9em;
      }
      main p {
        color: #333;
      }
      main pre {
        white-space: pre-line;
      }
      capacitor-welcome-titlebar {
        display: grid;
        justify-content: center;
      }
    </style>
    <div>
      <capacitor-welcome-titlebar>
        <h1>Account Manager Plugin Demo</h1>
      </capacitor-welcome-titlebar>
      <main>
          <h2>Methods</h2>
          <p><button class="button" id="account-picker">Account Authenticator</button></p>
          <p><button class="button" style="display:none" id="get-accounts">Get Accounts</button></p>
          <p><button class="button" style="display:none" id="add-new-accounts">Add New Accounts</button></p>
          <p><button class="button" style="display:none" id="account-authentication">Account Authentication</button></p>
      </main>
    </div>
    `;
    }

    connectedCallback() {
      const self = this;

      self.shadowRoot.querySelector('#get-accounts').addEventListener('click', async function (e) {
        // try {

        let account = {
          "name": "name",
          "type": "type"
        }

        console.log('take-phote entred', AccountManager);
        let result = await AccountManager.getAccount();
        // let result = await AccountManager.showAccountPicker();
        console.log('result', result);
        // alert("Result " + result);

        // } catch (e) {
        //   console.log('User cancelled', e);
        // }
      });

      self.shadowRoot.querySelector('#add-new-accounts').addEventListener('click', async function (e) {
        // try {

        console.log('add-new-accounts');
        let result = await AccountManager.addNewAccount();
        console.log('result', result);
        
        // } catch (e) {
        //   console.log('User cancelled', e);
        // }
      });

      self.shadowRoot.querySelector('#account-picker').addEventListener('click', async function (e) {
        // try {

        console.log('account-picker');
        let result = await AccountManager.getExistingAccountAuthToken();
        console.log('result', result);
        
        // } catch (e) {
        //   console.log('User cancelled', e);
        // }
      });

      self.shadowRoot.querySelector('#account-authentication').addEventListener('click', async function (e) {
        // try {

        console.log('account-authentication');
        let result = await AccountManager.authenticator();
        console.log('result', result);
        
        // } catch (e) {
        //   console.log('User cancelled', e);
        // }
      });
    }
  }
);
