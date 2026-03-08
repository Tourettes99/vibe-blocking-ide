import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    saveProject: (data) => ipcRenderer.invoke('save-project', data),
    loadProject: () => ipcRenderer.invoke('load-project'),
    launchApp: (path) => ipcRenderer.invoke('launch-app', path)
});
