const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    saveProject: (data) => ipcRenderer.invoke('save-project', data),
    loadProject: () => ipcRenderer.invoke('load-project'),
    launchApp: (path) => ipcRenderer.invoke('launch-app', path),
    hasCredentials: () => ipcRenderer.invoke('has-credentials'),
    saveCredentials: (data) => ipcRenderer.invoke('save-credentials', data),
    loadCredentials: (pin) => ipcRenderer.invoke('load-credentials', pin),
    updatePin: (data) => ipcRenderer.invoke('update-pin', data),
    mcpList: () => ipcRenderer.invoke('mcp-list'),
    mcpBuild: (data) => ipcRenderer.invoke('mcp-build', data),
    mcpAddCustom: (data) => ipcRenderer.invoke('mcp-add-custom', data),
    mcpRemove: (id) => ipcRenderer.invoke('mcp-remove', id),
    mcpBrowseFolder: () => ipcRenderer.invoke('mcp-browse-folder'),
    onMcpInstallLog: (cb) => {
        ipcRenderer.on('mcp-install-log', (_e, data) => cb(data));
        return () => ipcRenderer.removeAllListeners('mcp-install-log');
    },
    skillsList: () => ipcRenderer.invoke('skills-list'),
    skillAddGithub: (url) => ipcRenderer.invoke('skill-add-github', url),
    skillAddLocal: (path) => ipcRenderer.invoke('skill-add-local', path),
    skillBuild: (data) => ipcRenderer.invoke('skill-build', data),
    skillRemove: (id) => ipcRenderer.invoke('skill-remove', id),
    skillRead: (id) => ipcRenderer.invoke('skill-read', id),
    skillBrowseFolder: () => ipcRenderer.invoke('skill-browse-folder'),
    onSkillLog: (cb) => {
        ipcRenderer.on('skill-log', (_e, msg) => cb(msg));
        return () => ipcRenderer.removeAllListeners('skill-log');
    },
    listVersions: (projectPath) => ipcRenderer.invoke('list-versions', projectPath),
    restoreVersion: (data) => ipcRenderer.invoke('restore-version', data),
    readProjectFiles: (projectPath) => ipcRenderer.invoke('read-project-files', projectPath),
    readAllSkills: () => ipcRenderer.invoke('read-all-skills'),
    readMcpDetails: () => ipcRenderer.invoke('read-mcp-details'),
    detectProjectKeys: (projectPath) => ipcRenderer.invoke('detect-project-keys', { projectPath }),
    saveProjectKeys: (projectPath, keys) => ipcRenderer.invoke('save-project-keys', { projectPath, keys }),
    loadProjectKeys: (projectPath) => ipcRenderer.invoke('load-project-keys', { projectPath }),
    injectProjectKeys: (projectPath, keys) => ipcRenderer.invoke('inject-project-keys', { projectPath, keys }),
});
