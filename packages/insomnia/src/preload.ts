import { contextBridge, ipcRenderer, webUtils as _webUtils } from 'electron';

import type { GitServiceAPI } from './main/git-service';
import type { gRPCBridgeAPI } from './main/ipc/grpc';
import type { secretStorageBridgeAPI } from './main/ipc/secret-storage';
import type { CurlBridgeAPI } from './main/network/curl';
import type { WebSocketBridgeAPI } from './main/network/websocket';
import { invariant } from './utils/invariant';

const ports = new Map<'hiddenWindowPort', MessagePort>();

const webSocket: WebSocketBridgeAPI = {
  open: options => ipcRenderer.invoke('webSocket.open', options),
  close: options => ipcRenderer.send('webSocket.close', options),
  closeAll: () => ipcRenderer.send('webSocket.closeAll'),
  readyState: {
    getCurrent: options => ipcRenderer.invoke('webSocket.readyState', options),
  },
  event: {
    findMany: options => ipcRenderer.invoke('webSocket.event.findMany', options),
    send: options => ipcRenderer.invoke('webSocket.event.send', options),
  },
};
const curl: CurlBridgeAPI = {
  open: options => ipcRenderer.invoke('curl.open', options),
  close: options => ipcRenderer.send('curl.close', options),
  closeAll: () => ipcRenderer.send('curl.closeAll'),
  readyState: {
    getCurrent: options => ipcRenderer.invoke('curl.readyState', options),
  },
  event: {
    findMany: options => ipcRenderer.invoke('curl.event.findMany', options),
  },
};

const grpc: gRPCBridgeAPI = {
  start: options => ipcRenderer.send('grpc.start', options),
  sendMessage: options => ipcRenderer.send('grpc.sendMessage', options),
  commit: options => ipcRenderer.send('grpc.commit', options),
  cancel: options => ipcRenderer.send('grpc.cancel', options),
  closeAll: () => ipcRenderer.send('grpc.closeAll'),
  loadMethods: options => ipcRenderer.invoke('grpc.loadMethods', options),
  loadMethodsFromReflection: options => ipcRenderer.invoke('grpc.loadMethodsFromReflection', options),
};

const secretStorage: secretStorageBridgeAPI = {
  setSecret: (key, secret) => ipcRenderer.invoke('secretStorage.setSecret', key, secret),
  getSecret: key => ipcRenderer.invoke('secretStorage.getSecret', key),
  deleteSecret: key => ipcRenderer.invoke('secretStorage.deleteSecret', key),
  encryptString: raw => ipcRenderer.invoke('secretStorage.encryptString', raw),
  decryptString: cipherText => ipcRenderer.invoke('secretStorage.decryptString', cipherText),
};

const git: GitServiceAPI = {
  loadGitRepository: options => ipcRenderer.invoke('git.loadGitRepository', options),
  getGitBranches: options => ipcRenderer.invoke('git.getGitBranches', options),
  gitFetchAction: options => ipcRenderer.invoke('git.gitFetchAction', options),
  gitLogLoader: options => ipcRenderer.invoke('git.gitLogLoader', options),
  gitChangesLoader: options => ipcRenderer.invoke('git.gitChangesLoader', options),
  canPushLoader: options => ipcRenderer.invoke('git.canPushLoader', options),
  cloneGitRepo: options => ipcRenderer.invoke('git.cloneGitRepo', options),
  initGitRepoClone: options => ipcRenderer.invoke('git.initGitRepoClone', options),
  updateGitRepo: options => ipcRenderer.invoke('git.updateGitRepo', options),
  resetGitRepo: options => ipcRenderer.invoke('git.resetGitRepo', options),
  commitToGitRepo: options => ipcRenderer.invoke('git.commitToGitRepo', options),
  commitAndPushToGitRepo: options => ipcRenderer.invoke('git.commitAndPushToGitRepo', options),
  createNewGitBranch: options => ipcRenderer.invoke('git.createNewGitBranch', options),
  checkoutGitBranch: options => ipcRenderer.invoke('git.checkoutGitBranch', options),
  mergeGitBranch: options => ipcRenderer.invoke('git.mergeGitBranch', options),
  deleteGitBranch: options => ipcRenderer.invoke('git.deleteGitBranch', options),
  pushToGitRemote: options => ipcRenderer.invoke('git.pushToGitRemote', options),
  pullFromGitRemote: options => ipcRenderer.invoke('git.pullFromGitRemote', options),
  continueMerge: options => ipcRenderer.invoke('git.continueMerge', options),
  discardChanges: options => ipcRenderer.invoke('git.discardChanges', options),
  gitStatus: options => ipcRenderer.invoke('git.gitStatus', options),
  stageChanges: options => ipcRenderer.invoke('git.stageChanges', options),
  unstageChanges: options => ipcRenderer.invoke('git.unstageChanges', options),
  diffFileLoader: options => ipcRenderer.invoke('git.diffFileLoader', options),

  initSignInToGitHub: () => ipcRenderer.invoke('git.initSignInToGitHub'),
  completeSignInToGitHub: options => ipcRenderer.invoke('git.completeSignInToGitHub', options),
  signOutOfGitHub: () => ipcRenderer.invoke('git.signOutOfGitHub'),
  getGitHubRepositories: options => ipcRenderer.invoke('git.getGitHubRepositories', options),
  getGitHubRepository: options => ipcRenderer.invoke('git.getGitHubRepository', options),

  initSignInToGitLab: () => ipcRenderer.invoke('git.initSignInToGitLab'),
  completeSignInToGitLab: options => ipcRenderer.invoke('git.completeSignInToGitLab', options),
  signOutOfGitLab: () => ipcRenderer.invoke('git.signOutOfGitLab'),
};

const main: Window['main'] = {
  startExecution: options => ipcRenderer.send('startExecution', options),
  addExecutionStep: options => ipcRenderer.send('addExecutionStep', options),
  completeExecutionStep: options => ipcRenderer.send('completeExecutionStep', options),
  updateLatestStepName: options => ipcRenderer.send('updateLatestStepName', options),
  getExecution: options => ipcRenderer.invoke('getExecution', options),
  loginStateChange: () => ipcRenderer.send('loginStateChange'),
  restart: () => ipcRenderer.send('restart'),
  openInBrowser: options => ipcRenderer.send('openInBrowser', options),
  openDeepLink: options => ipcRenderer.send('openDeepLink', options),
  halfSecondAfterAppStart: () => ipcRenderer.send('halfSecondAfterAppStart'),
  manualUpdateCheck: () => ipcRenderer.send('manualUpdateCheck'),
  backup: () => ipcRenderer.invoke('backup'),
  restoreBackup: options => ipcRenderer.invoke('restoreBackup', options),
  authorizeUserInWindow: options => ipcRenderer.invoke('authorizeUserInWindow', options),
  setMenuBarVisibility: options => ipcRenderer.send('setMenuBarVisibility', options),
  installPlugin: options => ipcRenderer.invoke('installPlugin', options),
  curlRequest: options => ipcRenderer.invoke('curlRequest', options),
  cancelCurlRequest: options => ipcRenderer.send('cancelCurlRequest', options),
  writeFile: options => ipcRenderer.invoke('writeFile', options),
  readFile: options => ipcRenderer.invoke('readFile', options),
  on: (channel, listener) => {
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  webSocket,
  git,
  grpc,
  curl,
  secretStorage,
  trackSegmentEvent: options => ipcRenderer.send('trackSegmentEvent', options),
  trackPageView: options => ipcRenderer.send('trackPageView', options),
  showNunjucksContextMenu: options => ipcRenderer.send('show-nunjucks-context-menu', options),
  showContextMenu: options => ipcRenderer.send('showContextMenu', options),
  database: {
    caCertificate: {
      create: options => ipcRenderer.invoke('database.caCertificate.create', options),
    },
  },
  hiddenBrowserWindow: {
    runScript: options => new Promise(async (resolve, reject) => {
      const isPortAlive = ports.get('hiddenWindowPort') !== undefined;
      await ipcRenderer.invoke('open-channel-to-hidden-browser-window', isPortAlive);

      const port = ports.get('hiddenWindowPort');
      invariant(port, 'hiddenWindowPort is undefined');

      port.onmessage = event => {
        console.log('[preload] received result:', event.data);
        if (event.data.error) {
          reject(new Error(event.data.error));
        }
        resolve(event.data);
      };

      port.postMessage({ ...options, type: 'runPreRequestScript' });
    }),
  },
  landingPageRendered: (landingPage, tags) => ipcRenderer.send('landingPageRendered', {
    landingPage,
    tags,
  }),
  extractJsonFileFromPostmanDataDumpArchive: archivePath => ipcRenderer.invoke('extractJsonFileFromPostmanDataDumpArchive', archivePath),
};

ipcRenderer.on('hidden-browser-window-response-listener', event => {
  const [port] = event.ports;
  ports.set('hiddenWindowPort', port);
  ipcRenderer.invoke('main-window-script-port-ready');
});

const dialog: Window['dialog'] = {
  showOpenDialog: options => ipcRenderer.invoke('showOpenDialog', options),
  showSaveDialog: options => ipcRenderer.invoke('showSaveDialog', options),
};
const app: Window['app'] = {
  getPath: options => ipcRenderer.sendSync('getPath', options),
  getAppPath: () => ipcRenderer.sendSync('getAppPath'),
};
const shell: Window['shell'] = {
  showItemInFolder: options => ipcRenderer.send('showItemInFolder', options),
};
const clipboard: Window['clipboard'] = {
  readText: () => ipcRenderer.sendSync('readText'),
  writeText: options => ipcRenderer.send('writeText', options),
  clear: () => ipcRenderer.send('clear'),
};
const webUtils: Window['webUtils'] = {
  getPathForFile: (file: File) => _webUtils.getPathForFile(file),
};
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('main', main);
  contextBridge.exposeInMainWorld('dialog', dialog);
  contextBridge.exposeInMainWorld('app', app);
  contextBridge.exposeInMainWorld('shell', shell);
  contextBridge.exposeInMainWorld('clipboard', clipboard);
  contextBridge.exposeInMainWorld('webUtils', webUtils);
} else {
  window.main = main;
  window.dialog = dialog;
  window.app = app;
  window.shell = shell;
  window.clipboard = clipboard;
  window.webUtils = webUtils;
}
