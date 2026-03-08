import { useState, useEffect, useCallback } from 'react';
import {
  BoxSelect,
  Settings,
  Plus,
  Play,
  Trash2,
  X,
  Sparkles,
  HardDrive,
  FolderOpen,
  Lock,
  KeyRound,
  ShieldCheck,
  Plug,
  Hammer,
  FolderPlus,
  Package,
  Loader2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Github,
  Eye,
  FileText,
  Lightbulb,
  Palette,
  Zap,
  Database,
  Shield,
  Rocket,
  History,
  RefreshCw,
  Monitor,
  Key,
  Save,
  FolderTree,
  Terminal,
  Upload,
  FileCode
} from 'lucide-react';

interface VibeBlock {
  id: string;
  prompt: string;
  editPrompt: string;
}

interface ProjectStructureItem {
  id: string;
  type: 'folder' | 'file';
  path: string;
}

interface FedFile {
  id: string;
  path: string;
  content: string;
  sourceName?: string;
}

const STRUCTURE_PRESETS: { label: string; items: Pick<ProjectStructureItem, 'type' | 'path'>[] }[] = [
  {
    label: 'React / Vite',
    items: [
      { type: 'folder', path: 'src' },
      { type: 'folder', path: 'src/components' },
      { type: 'folder', path: 'src/pages' },
      { type: 'folder', path: 'src/hooks' },
      { type: 'folder', path: 'public' },
      { type: 'file', path: 'package.json' },
      { type: 'file', path: 'vite.config.js' },
      { type: 'file', path: '.gitignore' },
      { type: 'file', path: 'README.md' }
    ]
  },
  {
    label: 'Node API',
    items: [
      { type: 'folder', path: 'src' },
      { type: 'folder', path: 'src/routes' },
      { type: 'folder', path: 'src/models' },
      { type: 'folder', path: 'src/utils' },
      { type: 'file', path: 'package.json' },
      { type: 'file', path: '.gitignore' },
      { type: 'file', path: 'README.md' }
    ]
  },
  {
    label: 'Static Site',
    items: [
      { type: 'folder', path: 'css' },
      { type: 'folder', path: 'js' },
      { type: 'folder', path: 'images' },
      { type: 'file', path: 'index.html' },
      { type: 'file', path: '.gitignore' }
    ]
  }
];

interface Skill {
  id: string;
  name: string;
  description: string;
  path: string;
  source?: string;
  type: 'github' | 'local' | 'built';
  createdAt: string;
}

interface McpServer {
  id: string;
  name: string;
  type: 'built' | 'custom';
  path: string;
  command: string;
  source?: string;
  status: 'installed' | 'installing' | 'error';
  createdAt: string;
}

const DESIGN_PHASES = [
  {
    id: 'phase-concept',
    label: 'Concept & Vision',
    description: 'What is the app? Target audience and core problem it solves',
    placeholder: 'e.g. A fitness tracking app for beginners who want simple, guided workout routines. It should feel motivating and personal...',
    color: '#06b6d4',
    icon: Lightbulb,
  },
  {
    id: 'phase-ui',
    label: 'UI & Layout',
    description: 'Visual design, layout, navigation, color palette, and typography',
    placeholder: 'e.g. Dark theme with glassmorphism cards. Bottom tab navigation with 4 tabs. Rounded corners, Inter font...',
    color: '#a855f7',
    icon: Palette,
  },
  {
    id: 'phase-features',
    label: 'Core Features',
    description: 'Main functionality, user interactions, and key workflows',
    placeholder: 'e.g. Create custom workouts, track calories, set daily goals, view weekly progress charts, share achievements...',
    color: '#3b82f6',
    icon: Zap,
  },
  {
    id: 'phase-data',
    label: 'Data & Backend',
    description: 'Data model, APIs, storage strategy, and server architecture',
    placeholder: 'e.g. SQLite for local storage, REST API for device sync, cache recent data offline...',
    color: '#22c55e',
    icon: Database,
  },
  {
    id: 'phase-auth',
    label: 'Auth & Users',
    description: 'Authentication, user roles, permissions, and security measures',
    placeholder: 'e.g. Email/password + Google OAuth. Free and premium tiers. Admin dashboard for content management...',
    color: '#f59e0b',
    icon: Shield,
  },
  {
    id: 'phase-deploy',
    label: 'Platform & Config',
    description: 'Target platform, performance requirements, and deployment strategy',
    placeholder: 'e.g. Offline-first PWA. Target modern browsers. Lazy-load images. Deploy to Vercel with CI/CD...',
    color: '#f43f5e',
    icon: Rocket,
  },
];

function App() {
  const [appType, setAppType] = useState('Android App');
  const [blocks, setBlocks] = useState<VibeBlock[]>(
    DESIGN_PHASES.map(phase => ({ id: phase.id, prompt: '', editPrompt: '' }))
  );
  const [projectStructureItems, setProjectStructureItems] = useState<ProjectStructureItem[]>([]);
  const [projectStructureDescription, setProjectStructureDescription] = useState('');
  const [projectStructureScaffold, setProjectStructureScaffold] = useState('');
  const [projectStructureInput, setProjectStructureInput] = useState('');
  const [projectStructureFedFiles, setProjectStructureFedFiles] = useState<FedFile[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [projectName, setProjectName] = useState('MyAwesomeApp');
  const [projectPath, setProjectPath] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);

  const [geminiModel, setGeminiModel] = useState('gemini-1.5-pro');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [availableModels, setAvailableModels] = useState<{ name: string, displayName: string }[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // PIN / encrypted credentials state
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  // Settings PIN fields
  const [settingsPin, setSettingsPin] = useState('');
  const [settingsPinConfirm, setSettingsPinConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [credentialStatus, setCredentialStatus] = useState('');

  // On startup, check if encrypted credentials exist
  useEffect(() => {
    async function checkCredentials() {
      const api = (window as any).electronAPI;
      if (!api?.hasCredentials) return;
      const exists = await api.hasCredentials();
      setHasStoredCredentials(exists);
      if (exists) {
        setShowPinPrompt(true);
      }
    }
    checkCredentials();
  }, []);

  const handleUnlock = useCallback(async () => {
    if (!pinInput) { setPinError('Please enter your PIN.'); return; }
    const api = (window as any).electronAPI;
    if (!api?.loadCredentials) return;
    const res = await api.loadCredentials(pinInput);
    if (res.success) {
      setGeminiApiKey(res.data.apiKey);
      setGeminiModel(res.data.model);
      setCurrentPin(pinInput);
      setShowPinPrompt(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Wrong PIN. Please try again.');
    }
  }, [pinInput]);

  const handleSaveCredentials = useCallback(async () => {
    if (!settingsPin || settingsPin.length < 4) {
      setCredentialStatus('PIN must be at least 4 characters.');
      return;
    }
    if (settingsPin !== settingsPinConfirm) {
      setCredentialStatus('PINs do not match.');
      return;
    }
    const api = (window as any).electronAPI;
    if (!api?.saveCredentials) return;
    const res = await api.saveCredentials({ apiKey: geminiApiKey, model: geminiModel, pin: settingsPin });
    if (res.success) {
      setCurrentPin(settingsPin);
      setHasStoredCredentials(true);
      setCredentialStatus('Credentials saved securely!');
      setSettingsPin('');
      setSettingsPinConfirm('');
      setTimeout(() => setCredentialStatus(''), 3000);
    } else {
      setCredentialStatus('Failed to save: ' + res.error);
    }
  }, [settingsPin, settingsPinConfirm, geminiApiKey, geminiModel]);

  const handleChangePin = useCallback(async () => {
    if (!settingsPin || settingsPin.length < 4) {
      setCredentialStatus('New PIN must be at least 4 characters.');
      return;
    }
    if (settingsPin !== settingsPinConfirm) {
      setCredentialStatus('PINs do not match.');
      return;
    }
    const api = (window as any).electronAPI;
    if (!api?.updatePin) return;
    const res = await api.updatePin({ oldPin: currentPin, newPin: settingsPin });
    if (res.success) {
      setCurrentPin(settingsPin);
      setCredentialStatus('PIN updated successfully!');
      setSettingsPin('');
      setSettingsPinConfirm('');
      setTimeout(() => setCredentialStatus(''), 3000);
    } else {
      setCredentialStatus('Failed: ' + res.error);
    }
  }, [settingsPin, settingsPinConfirm, currentPin]);

  // --- MCP Server state ---
  const [mcpServers, setMcpServers] = useState<McpServer[]>([]);
  const [mcpBuildPrompt, setMcpBuildPrompt] = useState('');
  const [mcpBuilding, setMcpBuilding] = useState(false);
  const [mcpBuildLog, setMcpBuildLog] = useState('');
  const [mcpCustomSource, setMcpCustomSource] = useState('');
  const [mcpAdding, setMcpAdding] = useState(false);
  const [mcpShowAdd, setMcpShowAdd] = useState(false);
  const [mcpInstallLogs, setMcpInstallLogs] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'blocks' | 'mcp' | 'skills' | 'preview'>('blocks');

  // --- Refinement / Preview / Versions ---
  const [lastGeneratedFiles, setLastGeneratedFiles] = useState<{filename: string, content: string}[]>([]);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [versions, setVersions] = useState<{id: string, timestamp: string, files?: string[]}[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [buildStatus, setBuildStatus] = useState('');
  const [buildContext, setBuildContext] = useState<{skills: number, mcp: number}>({ skills: 0, mcp: 0 });

  // --- Project API Keys ---
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [detectedKeys, setDetectedKeys] = useState<string[]>([]);
  const [projectKeys, setProjectKeys] = useState<Record<string, string>>({});
  const [keysSaving, setKeysSaving] = useState(false);
  const [keysStatus, setKeysStatus] = useState('');

  // --- Skills state ---
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillBuildPrompt, setSkillBuildPrompt] = useState('');
  const [skillBuilding, setSkillBuilding] = useState(false);
  const [skillLog, setSkillLog] = useState('');
  const [skillGithubUrl, setSkillGithubUrl] = useState('');
  const [skillAdding, setSkillAdding] = useState(false);
  const [skillShowAdd, setSkillShowAdd] = useState(false);
  const [skillPreview, setSkillPreview] = useState<{ name: string; content: string } | null>(null);

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.mcpList) return;
    api.mcpList().then((res: any) => {
      if (res.success) setMcpServers(res.servers);
    });

    if (api.onMcpInstallLog) {
      const unsub = api.onMcpInstallLog((data: { id: string; msg: string }) => {
        setMcpInstallLogs(prev => ({ ...prev, [data.id]: data.msg }));
      });
      return unsub;
    }
  }, []);

  const refreshMcpList = useCallback(async () => {
    const api = (window as any).electronAPI;
    if (!api?.mcpList) return;
    const res = await api.mcpList();
    if (res.success) setMcpServers(res.servers);
  }, []);

  const handleBuildMcp = useCallback(async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API Key in Settings first.');
      return;
    }
    if (!mcpBuildPrompt.trim()) return;

    setMcpBuilding(true);
    setMcpBuildLog('Generating MCP server with AI...');

    try {
      const prompt = `You are an expert Node.js developer specializing in MCP (Model Context Protocol) servers.

Generate a complete, working MCP server based on this description:
"${mcpBuildPrompt}"

Requirements:
1. Use the official "@modelcontextprotocol/sdk" package (version ^1.0.0).
2. The server must use stdio transport.
3. Create a proper package.json with all dependencies listed.
4. Create an index.js as the entry point.
5. Export tools that implement the requested functionality.
6. The code must be production-ready, with error handling.
7. Use standard ES module or CommonJS (CommonJS preferred for broadest compat).

Output all files wrapped in XML-like tags using this format exactly:
<file name="filename.ext">
...code...
</file>

Always include at minimum: package.json and index.js.
Give the server a short descriptive name in package.json.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4 }
          })
        }
      );

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) throw new Error('No content generated.');

      const fileRegex = /<file\s+name="([^"]+)">([\s\S]*?)<\/file>/g;
      const files: { filename: string; content: string }[] = [];
      let match;
      while ((match = fileRegex.exec(generatedText)) !== null) {
        files.push({ filename: match[1], content: match[2].trim() });
      }
      if (files.length === 0) throw new Error('Could not parse generated files.');

      let serverName = mcpBuildPrompt.slice(0, 40).trim();
      const pkgFile = files.find(f => f.filename === 'package.json');
      if (pkgFile) {
        try {
          const pkg = JSON.parse(pkgFile.content);
          if (pkg.name) serverName = pkg.name;
        } catch { /* use prompt-based name */ }
      }

      setMcpBuildLog('Saving files & installing dependencies...');
      const api = (window as any).electronAPI;
      const res = await api.mcpBuild({ name: serverName, files });

      if (res.success) {
        setMcpBuildLog('MCP server built and installed!');
        setMcpBuildPrompt('');
        await refreshMcpList();
        setTimeout(() => setMcpBuildLog(''), 4000);
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      setMcpBuildLog('Error: ' + err.message);
    } finally {
      setMcpBuilding(false);
    }
  }, [geminiApiKey, geminiModel, mcpBuildPrompt, refreshMcpList]);

  const handleAddCustomMcp = useCallback(async (source: string) => {
    if (!source.trim()) return;
    setMcpAdding(true);
    try {
      const api = (window as any).electronAPI;
      const res = await api.mcpAddCustom({ source: source.trim() });
      if (res.success) {
        setMcpCustomSource('');
        setMcpShowAdd(false);
        await refreshMcpList();
      } else {
        alert('Failed to add MCP server: ' + res.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setMcpAdding(false);
    }
  }, [refreshMcpList]);

  const handleBrowseMcp = useCallback(async () => {
    const api = (window as any).electronAPI;
    if (!api?.mcpBrowseFolder) return;
    const res = await api.mcpBrowseFolder();
    if (!res.canceled && res.path) {
      setMcpCustomSource(res.path);
      await handleAddCustomMcp(res.path);
    }
  }, [handleAddCustomMcp]);

  const handleRemoveMcp = useCallback(async (id: string) => {
    const api = (window as any).electronAPI;
    if (!api?.mcpRemove) return;
    const res = await api.mcpRemove(id);
    if (res.success) await refreshMcpList();
  }, [refreshMcpList]);

  // --- Skills handlers ---

  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api?.skillsList) return;
    api.skillsList().then((res: any) => {
      if (res.success) setSkills(res.skills);
    });
    if (api.onSkillLog) {
      const unsub = api.onSkillLog((msg: string) => {
        setSkillLog(msg);
        setTimeout(() => setSkillLog(''), 5000);
      });
      return unsub;
    }
  }, []);

  const refreshSkills = useCallback(async () => {
    const api = (window as any).electronAPI;
    if (!api?.skillsList) return;
    const res = await api.skillsList();
    if (res.success) setSkills(res.skills);
  }, []);

  const handleAddSkillGithub = useCallback(async () => {
    if (!skillGithubUrl.trim()) return;
    setSkillAdding(true);
    setSkillLog('Cloning repository...');
    try {
      const api = (window as any).electronAPI;
      const res = await api.skillAddGithub(skillGithubUrl.trim());
      if (res.success) {
        setSkillGithubUrl('');
        setSkillShowAdd(false);
        setSkillLog(`Added ${res.added.length} skill(s)!`);
        await refreshSkills();
      } else {
        setSkillLog('Error: ' + res.error);
      }
    } catch (err: any) {
      setSkillLog('Error: ' + err.message);
    } finally {
      setSkillAdding(false);
    }
  }, [skillGithubUrl, refreshSkills]);

  const handleBrowseSkill = useCallback(async () => {
    const api = (window as any).electronAPI;
    if (!api?.skillBrowseFolder) return;
    const pick = await api.skillBrowseFolder();
    if (pick.canceled) return;
    setSkillAdding(true);
    setSkillLog('Scanning for skills...');
    try {
      const res = await api.skillAddLocal(pick.path);
      if (res.success) {
        setSkillLog(`Added ${res.added.length} skill(s)!`);
        await refreshSkills();
      } else {
        setSkillLog('Error: ' + res.error);
      }
    } catch (err: any) {
      setSkillLog('Error: ' + err.message);
    } finally {
      setSkillAdding(false);
    }
  }, [refreshSkills]);

  const handleBuildSkill = useCallback(async () => {
    if (!geminiApiKey) {
      alert('Please set your Gemini API Key in Settings first.');
      return;
    }
    if (!skillBuildPrompt.trim()) return;

    setSkillBuilding(true);
    setSkillLog('Generating skill with AI...');
    try {
      const prompt = `You are an expert at creating Agent Skills in the Anthropic Skills format.

Generate a complete SKILL.md file based on this description:
"${skillBuildPrompt}"

The SKILL.md must follow this exact format:
- Start with YAML frontmatter between --- delimiters
- Include "name:" (lowercase, hyphens for spaces) and "description:" fields
- Below the frontmatter, write clear markdown instructions, examples, and guidelines that an AI agent would follow

Output ONLY the raw SKILL.md content. No code fences, no explanation. Start directly with ---.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.4 }
          })
        }
      );
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data = await response.json();
      let generated = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generated) throw new Error('No content generated.');

      generated = generated.replace(/^```[a-z]*\n?/gm, '').replace(/```$/gm, '').trim();

      const nameMatch = generated.match(/^name:\s*(.+)$/m);
      const descMatch = generated.match(/^description:\s*(.+)$/m);
      const skillName = nameMatch?.[1]?.trim() || skillBuildPrompt.slice(0, 40);
      const skillDesc = descMatch?.[1]?.trim() || '';

      const api = (window as any).electronAPI;
      const res = await api.skillBuild({ name: skillName, description: skillDesc, content: generated });
      if (res.success) {
        setSkillBuildPrompt('');
        setSkillLog('Skill created successfully!');
        await refreshSkills();
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      setSkillLog('Error: ' + err.message);
    } finally {
      setSkillBuilding(false);
    }
  }, [geminiApiKey, geminiModel, skillBuildPrompt, refreshSkills]);

  const handleRemoveSkill = useCallback(async (id: string) => {
    const api = (window as any).electronAPI;
    if (!api?.skillRemove) return;
    const res = await api.skillRemove(id);
    if (res.success) await refreshSkills();
  }, [refreshSkills]);

  const handlePreviewSkill = useCallback(async (id: string, name: string) => {
    const api = (window as any).electronAPI;
    if (!api?.skillRead) return;
    const res = await api.skillRead(id);
    if (res.success) {
      setSkillPreview({ name, content: res.content });
    }
  }, []);

  useEffect(() => {
    async function fetchModels() {
      if (!geminiApiKey) return;
      setIsLoadingModels(true);
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
        if (response.ok) {
          const data = await response.json();
          const models = data.models.filter((m: any) =>
            m.supportedGenerationMethods.includes('generateContent')
          );
          setAvailableModels(models);
        } else {
          console.error("Failed to fetch models");
        }
      } catch (err) {
        console.error("Error fetching models:", err);
      } finally {
        setIsLoadingModels(false);
      }
    }

    if (isSettingsOpen && geminiApiKey) {
      fetchModels();
    }
  }, [isSettingsOpen, geminiApiKey]);

  // Titlebar controls
  const handleMinimize = () => (window as any).electronAPI?.minimize();
  const handleMaximize = () => (window as any).electronAPI?.maximize();
  const handleClose = () => (window as any).electronAPI?.close();

  const addBlock = () => {
    setBlocks([...blocks, { id: 'custom-' + Date.now().toString(), prompt: '', editPrompt: '' }]);
  };

  const removeBlock = (id: string) => {
    if (DESIGN_PHASES.some(p => p.id === id)) return;
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const updateBlock = (id: string, field: keyof VibeBlock, value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const buildPreviewHtml = useCallback((files: {filename: string, content: string}[]): string | null => {
    const indexFile = files.find(f => f.filename.toLowerCase() === 'index.html');
    if (!indexFile) return null;
    let html = indexFile.content;

    const cssFiles = files.filter(f => f.filename.endsWith('.css'));
    const jsFiles = files.filter(f => f.filename.endsWith('.js'));
    const jsxFiles = files.filter(f => f.filename.endsWith('.jsx'));

    const allScripts = [...jsFiles, ...jsxFiles];
    const hasReact = allScripts.some(f => /react|jsx|createElement|useState|useEffect/i.test(f.content)) ||
      html.includes('type="text/babel"') || html.includes('react') || html.includes('jsx');

    html = html.replace(/<link[^>]+href=["'][^"']+\.css["'][^>]*\/?>/gi, '');
    html = html.replace(/<script[^>]+src=["'][^"']+["'][^>]*>\s*<\/script>/gi, '');

    const headAdditions: string[] = [];
    if (hasReact) {
      headAdditions.push(
        '<script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>',
        '<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>',
        '<script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>'
      );
    }

    if (cssFiles.length > 0) {
      const cssBlock = cssFiles.map(f => `<style>\n${f.content}\n</style>`).join('\n');
      headAdditions.push(cssBlock);
    }

    if (headAdditions.length > 0) {
      const block = headAdditions.join('\n');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${block}\n</head>`);
      } else {
        html = block + '\n' + html;
      }
    }

    if (allScripts.length > 0) {
      const scriptType = hasReact ? 'text/babel' : 'text/javascript';
      const scriptsBlock = allScripts.map(f => {
        const safe = f.content.replace(/<\//g, '<\\/');
        return `<script type="${scriptType}">\n${safe}\n</script>`;
      }).join('\n');
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptsBlock}\n</body>`);
      } else {
        html = html + '\n' + scriptsBlock;
      }
    }

    return html;
  }, []);

  const loadVersions = useCallback(async (projPath?: string) => {
    const p = projPath || projectPath;
    if (!p) return;
    const api = (window as any).electronAPI;
    if (!api?.listVersions) return;
    const res = await api.listVersions(p);
    if (res.success) setVersions(res.versions);
  }, [projectPath]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!projectPath) return;
    const api = (window as any).electronAPI;
    if (!api?.restoreVersion) return;
    const res = await api.restoreVersion({ projectPath, versionId });
    if (res.success) {
      setShowVersions(false);
      if (api.readProjectFiles) {
        const filesRes = await api.readProjectFiles(projectPath);
        if (filesRes.success) {
          const fileArray = Object.entries(filesRes.files).map(([filename, content]) => ({ filename, content: content as string }));
          setLastGeneratedFiles(fileArray);
          const preview = buildPreviewHtml(fileArray);
          setPreviewHtml(preview);
          if (preview) setActiveTab('preview');
        }
      }
      alert('Version restored successfully!');
    } else {
      alert('Restore failed: ' + res.error);
    }
  }, [projectPath, buildPreviewHtml]);

  const detectKeysFromFiles = useCallback((files: {filename: string, content: string}[]): string[] => {
    const keyNames = new Set<string>();
    const regex = /__VIBE_KEY_([A-Z0-9_]+)__/g;
    for (const f of files) {
      let m;
      while ((m = regex.exec(f.content)) !== null) {
        keyNames.add(m[1]);
      }
    }
    return [...keyNames];
  }, []);

  const loadProjectKeys = useCallback(async (projPath: string) => {
    const api = (window as any).electronAPI;
    if (!api?.loadProjectKeys) return {};
    const res = await api.loadProjectKeys(projPath);
    if (res.success && res.keys) return res.keys;
    return {};
  }, []);

  const handleSaveProjectKeys = useCallback(async () => {
    if (!projectPath) return;
    const api = (window as any).electronAPI;
    if (!api?.saveProjectKeys || !api?.injectProjectKeys) return;
    setKeysSaving(true);
    setKeysStatus('');
    try {
      const saveRes = await api.saveProjectKeys(projectPath, projectKeys);
      if (!saveRes.success) throw new Error(saveRes.error);

      const filledKeys: Record<string, string> = {};
      for (const [k, v] of Object.entries(projectKeys)) {
        if (v) filledKeys[k] = v;
      }

      if (Object.keys(filledKeys).length > 0) {
        const injectRes = await api.injectProjectKeys(projectPath, filledKeys);
        if (!injectRes.success) throw new Error(injectRes.error);
        setKeysStatus(`Saved & injected ${injectRes.injected} key${injectRes.injected !== 1 ? 's' : ''} into project files`);

        if (lastGeneratedFiles.length > 0) {
          const updatedFiles = lastGeneratedFiles.map(f => {
            let content = f.content;
            for (const [keyName, keyValue] of Object.entries(filledKeys)) {
              content = content.split(`__VIBE_KEY_${keyName}__`).join(keyValue);
            }
            return { ...f, content };
          });
          setLastGeneratedFiles(updatedFiles);
          setPreviewHtml(buildPreviewHtml(updatedFiles));
        }
      } else {
        setKeysStatus('Keys saved (none filled yet — placeholders remain)');
      }
    } catch (err: any) {
      setKeysStatus('Error: ' + err.message);
    } finally {
      setKeysSaving(false);
    }
  }, [projectPath, projectKeys, lastGeneratedFiles, buildPreviewHtml]);

  const openKeysModal = useCallback(async (keys: string[], projPath?: string) => {
    const savedKeys = await loadProjectKeys(projPath || projectPath);
    const merged: Record<string, string> = {};
    for (const k of keys) {
      merged[k] = savedKeys[k] || '';
    }
    setDetectedKeys(keys);
    setProjectKeys(merged);
    setKeysStatus('');
    setShowKeysModal(true);
  }, [projectPath, loadProjectKeys]);

  const handleBuild = async () => {
    if (!geminiApiKey) {
      alert("Please enter your Gemini API Key in Settings first.");
      setIsSettingsOpen(true);
      return;
    }

    setIsBuilding(true);
    setBuildStatus('Preparing...');
    let generatedFiles: {filename: string, content: string}[] = [];
    const isRefine = !!(refinePrompt.trim() && lastGeneratedFiles.length > 0);
    let skillsApplied = 0;
    let mcpApplied = 0;

    try {
      const api = (window as any).electronAPI;
      let prompt = `You are an expert ${appType} developer.\n\n`;

      if (isRefine) {
        setBuildStatus('Preparing refinement...');
        prompt += `You previously generated the following application. Here are all the current files:\n\n`;
        for (const f of lastGeneratedFiles) {
          prompt += `<file name="${f.filename}">\n${f.content}\n</file>\n\n`;
        }
        prompt += `The user wants the following changes applied:\n${refinePrompt}\n\n`;
        prompt += `Regenerate ALL files with these changes incorporated. Include every file, even unchanged ones.\n\n`;
      } else {
        setBuildStatus('Collecting design phases...');
        prompt += `Generate the complete, fully functional code for this application based on the following structured design specification:\n\n`;
        DESIGN_PHASES.forEach(phase => {
          const block = blocks.find(b => b.id === phase.id);
          if (block?.prompt?.trim()) {
            prompt += `## ${phase.label}\n${block.prompt}\n\n`;
          }
        });
        const customBlks = blocks.filter(b => b.id.startsWith('custom-'));
        if (customBlks.some(b => b.prompt?.trim())) {
          prompt += `## Additional Requirements\n`;
          customBlks.forEach((b, i) => {
            if (b.prompt?.trim()) prompt += `${i + 1}. ${b.prompt}\n`;
          });
          prompt += '\n';
        }
      }

      if (projectStructureItems.length > 0 || projectStructureDescription.trim() || projectStructureScaffold.trim() || projectStructureFedFiles.length > 0) {
        prompt += `\n## Project Structure (REQUIRED CONTEXT)\n`;
        if (projectStructureItems.length > 0) {
          prompt += `The user requires this folder/file structure. Generate code that fits into these paths:\n`;
          for (const item of projectStructureItems) {
            prompt += `  - ${item.type === 'folder' ? '📁' : '📄'} ${item.path}\n`;
          }
          prompt += `\n`;
        }
        if (projectStructureDescription.trim()) {
          prompt += `User's description: ${projectStructureDescription.trim()}\n\n`;
        }
        if (projectStructureScaffold.trim()) {
          prompt += `Scaffold command (will run first): ${projectStructureScaffold.trim()}\n`;
          prompt += `If this creates a full project (e.g. create-vite), generate files that extend or customize it. If it only creates folders, generate all code.\n\n`;
        }
        if (projectStructureFedFiles.length > 0) {
          prompt += `\n### Existing File Content (USE AS CONTEXT)\n`;
          prompt += `The user has provided the following files as reference. Use their content when generating code — extend, modify, or integrate them into the project. Place code in the structure above.\n\n`;
          for (const fed of projectStructureFedFiles) {
            const excerpt = fed.content.length > 8000 ? fed.content.slice(0, 8000) + '\n...(truncated)...' : fed.content;
            prompt += `<file name="${fed.path}">\n${excerpt}\n</file>\n\n`;
          }
        }
      }

      let skillsList: { name: string; description: string; content: string }[] = [];
      let mcpServers: { name: string; path: string; command: string; description: string; tools: string }[] = [];

      if (api?.readAllSkills) {
        setBuildStatus('Loading skills...');
        const skillsRes = await api.readAllSkills();
        if (skillsRes.success && skillsRes.skills.length > 0) {
          skillsApplied = skillsRes.skills.length;
          skillsList = skillsRes.skills;
          prompt += `\n## Coding Guidelines\nYou have access to get_skill(skill_name) to fetch full skill content on demand. Available skills: ${skillsList.map(s => s.name).join(', ')}. Call get_skill when you need detailed guidelines.\n`;
        }
      }

      if (api?.readMcpDetails) {
        setBuildStatus('Scanning MCP servers...');
        const mcpRes = await api.readMcpDetails();
        if (mcpRes.success && mcpRes.servers.length > 0) {
          mcpApplied = mcpRes.servers.length;
          mcpServers = mcpRes.servers.filter((s: { path?: string }) => s.path);
          prompt += `\n## MCP Tools\nYou have call_mcp_tool(server_name, tool_name, arguments) to invoke real MCP tools. Available servers: ${mcpServers.map((s: { name: string }) => s.name).join(', ')}. Use it when the app needs external data (search, fetch, etc.).\n`;
        }
      }

      setBuildContext({ skills: skillsApplied, mcp: mcpApplied });
      setBuildStatus(isRefine ? 'Sending refinement to Gemini...' : 'Generating with Gemini...');

      prompt += `Please output all code files wrapped in XML-like tags, using the following format exactly:\n<file name="filename.ext">\n...code...\n</file>\nInclude all necessary files (e.g., HTML, CSS, JS, JSX, etc.) to make it a fully working app. Do not use markdown blocks around the XML tags.\n\nCRITICAL INSTRUCTIONS:\n1. For Web Apps, you may use vanilla JS, React+JSX, or bundled JS. React+JSX is supported in the IDE preview.\n2. The application MUST be highly functional and dynamic. Include robust logic for user interactions, state, and core features.\n3. The UI must be aesthetic, modern, and responsive. Emphasize a premium design feel.\n4. NEVER use HTML or JSX syntax inside .js files; use .jsx for JSX. Vanilla JS must use createElement or innerHTML.\n5. API KEYS: Use placeholders __VIBE_KEY_<NAME>__ for any external API (e.g. __VIBE_KEY_OPENAI_API_KEY__). Never hardcode keys.\n`;

      const functionDeclarations: object[] = [];
      if (skillsList.length > 0) {
        functionDeclarations.push({
          name: 'get_skill',
          description: 'Fetch the full content of an installed coding skill by name. Use when you need detailed guidelines.',
          parameters: {
            type: 'object',
            properties: { skill_name: { type: 'string', description: 'Name of the skill (e.g. spec-driven-development)' } },
            required: ['skill_name']
          }
        });
      }
      if (mcpServers.length > 0) {
        functionDeclarations.push({
          name: 'call_mcp_tool',
          description: 'Invoke a tool from an installed MCP server. Use when the app needs external data or actions.',
          parameters: {
            type: 'object',
            properties: {
              server_name: { type: 'string', description: 'MCP server name' },
              tool_name: { type: 'string', description: 'Tool name' },
              arguments: { type: 'object', description: 'Tool arguments as JSON object' }
            },
            required: ['server_name', 'tool_name']
          }
        });
      }

      const apiBody: { contents: object[]; generationConfig: object; tools?: object[] } = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      };
      if (functionDeclarations.length > 0) {
        apiBody.tools = [{ functionDeclarations }];
      }

      let generatedText = '';
      let contents = apiBody.contents as { role: string; parts: object[] }[];
      const maxToolRounds = 10;
      let round = 0;

      while (round < maxToolRounds) {
        const body: Record<string, unknown> = { ...apiBody, contents };
        if (functionDeclarations.length > 0) body.tools = [{ functionDeclarations }];

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find((p: { text?: string }) => p.text);
        const fcPart = parts.find((p: { functionCall?: object }) => p.functionCall);

        if (textPart?.text) {
          generatedText = textPart.text;
          break;
        }

        if (fcPart?.functionCall) {
          const { name, args } = fcPart.functionCall as { name: string; args?: Record<string, unknown> };
          setBuildStatus(`Tool: ${name}...`);
          let toolResult: string;

          if (name === 'get_skill') {
            const skillName = (args?.skill_name as string) || '';
            const sk = skillsList.find(s => s.name.toLowerCase() === skillName.toLowerCase());
            toolResult = sk ? sk.content : `Skill '${skillName}' not found. Available: ${skillsList.map(s => s.name).join(', ')}`;
          } else if (name === 'call_mcp_tool' && api?.invokeMcpTool) {
            const srvName = (args?.server_name as string) || '';
            const toolName = (args?.tool_name as string) || '';
            const srv = mcpServers.find((s: { name: string }) => s.name.toLowerCase().includes(srvName.toLowerCase()));
            if (!srv?.path) {
              toolResult = `MCP server '${srvName}' not found.`;
            } else {
              const invRes = await api.invokeMcpTool({
                serverPath: srv.path,
                serverCommand: srv.command,
                toolName,
                args: (args?.arguments as Record<string, unknown>) || {}
              });
              toolResult = invRes.success ? String(invRes.result) : `Error: ${invRes.error}`;
            }
          } else {
            toolResult = 'Unknown tool or no handler.';
          }

          contents = [
            ...contents,
            { role: 'model', parts: [fcPart] },
            { role: 'user', parts: [{ functionResponse: { name, response: { result: toolResult } } }] }
          ];
          round++;
          continue;
        }

        throw new Error('No content or function call in API response.');
      }

      setBuildStatus('Parsing response...');
      const fileRegex = /<file\s+name="([^"]+)">([\s\S]*?)<\/file>/g;
      let match;
      while ((match = fileRegex.exec(generatedText)) !== null) {
        generatedFiles.push({ filename: match[1], content: match[2].trim() });
      }

      if (generatedFiles.length === 0) {
        console.warn("Raw API Response:", generatedText);
        throw new Error("No files could be parsed from the API response.");
      }

      setBuildStatus(`Saving ${generatedFiles.length} files...`);
      if (api) {
        const res = await api.saveProject({
          projectName,
          appType,
          vibeBlocks: blocks,
          generatedFiles,
          projectStructure: {
            items: projectStructureItems,
            description: projectStructureDescription,
            scaffold: projectStructureScaffold,
            fedFiles: projectStructureFedFiles
          },
          scaffoldCommand: projectStructureScaffold.trim() || undefined
        });
        if (res.success) {
          setProjectPath(res.path);
          setLastGeneratedFiles(generatedFiles);
          setRefinePrompt('');
          const preview = buildPreviewHtml(generatedFiles);
          setPreviewHtml(preview);
          if (preview) setActiveTab('preview');
          await loadVersions(res.path);

          const foundKeys = detectKeysFromFiles(generatedFiles);
          if (foundKeys.length > 0) {
            setBuildStatus(`Done — ${generatedFiles.length} files, ${foundKeys.length} API key${foundKeys.length > 1 ? 's' : ''} detected`);
            setTimeout(() => setBuildStatus(''), 8000);
            openKeysModal(foundKeys, res.path);
          } else {
            setBuildStatus(`Done — ${generatedFiles.length} files generated`);
            setTimeout(() => setBuildStatus(''), 5000);
          }
          alert(`${isRefine ? 'Refined' : 'Built'} successfully — ${generatedFiles.length} files!\nSaved to: ${res.path}${foundKeys.length > 0 ? `\n\n${foundKeys.length} API key placeholder${foundKeys.length > 1 ? 's' : ''} detected — fill them in the Keys panel.` : ''}`);
        } else {
          alert('Failed to save project: ' + res.error);
        }
      } else {
        setLastGeneratedFiles(generatedFiles);
        setRefinePrompt('');
        const preview = buildPreviewHtml(generatedFiles);
        setPreviewHtml(preview);
        if (preview) setActiveTab('preview');
        setBuildStatus(`Done — ${generatedFiles.length} files generated`);
        setTimeout(() => setBuildStatus(''), 5000);
        alert('Build simulated (Browser Mode). Created files: ' + generatedFiles.map(f => f.filename).join(', '));
      }
    } catch (err: any) {
      console.error(err);
      setBuildStatus('');
      alert('Error building app: ' + err.message);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleLaunch = async () => {
    if (!projectPath) {
      alert('Please build the app first, or load an existing project.');
      return;
    }

    const api = (window as any).electronAPI;
    if (api) {
      if (detectedKeys.length > 0 && api.injectProjectKeys) {
        const filledKeys: Record<string, string> = {};
        for (const [k, v] of Object.entries(projectKeys)) {
          if (v) filledKeys[k] = v;
        }
        if (Object.keys(filledKeys).length > 0) {
          await api.injectProjectKeys(projectPath, filledKeys);
        }
      }

      const res = await api.launchApp(projectPath);
      if (!res.success) {
        alert('Could not launch app: ' + res.error);
      }
    } else {
      alert('Launch simulated (Browser Mode).');
    }
  };

  const handleLoadProject = async () => {
    if ((window as any).electronAPI) {
      try {
        const res = await (window as any).electronAPI.loadProject();
        if (res.canceled) return;

        if (res.success && res.data) {
          setProjectName(res.data.projectName || 'MyAwesomeApp');
          setAppType(res.data.appType || 'Android App');
          setProjectPath(res.data.path || '');
          if (res.data.vibeBlocks && Array.isArray(res.data.vibeBlocks) && res.data.vibeBlocks.length > 0) {
            const loaded = res.data.vibeBlocks;
            const coreBlocks = DESIGN_PHASES.map(phase => {
              const existing = loaded.find((b: VibeBlock) => b.id === phase.id);
              return existing || { id: phase.id, prompt: '', editPrompt: '' };
            });
            const extras = loaded.filter((b: VibeBlock) => !DESIGN_PHASES.some(p => p.id === b.id));
            setBlocks([...coreBlocks, ...extras]);
          } else {
            setBlocks(DESIGN_PHASES.map(phase => ({ id: phase.id, prompt: '', editPrompt: '' })));
          }
          if (res.data.projectStructure) {
            const ps = res.data.projectStructure as { items?: ProjectStructureItem[]; description?: string; scaffold?: string; fedFiles?: FedFile[] };
            if (ps.items && Array.isArray(ps.items)) {
              setProjectStructureItems(ps.items.map((i) => ({ ...i, id: i.id || `ps-${Date.now()}-${Math.random().toString(36).slice(2)}` })));
            }
            setProjectStructureDescription(ps.description || '');
            setProjectStructureScaffold(ps.scaffold || '');
            if (ps.fedFiles && Array.isArray(ps.fedFiles)) {
              setProjectStructureFedFiles(ps.fedFiles.map((f) => ({ ...f, id: f.id || `fed-${Date.now()}-${Math.random().toString(36).slice(2)}` })));
            } else {
              setProjectStructureFedFiles([]);
            }
          } else {
            setProjectStructureItems([]);
            setProjectStructureDescription('');
            setProjectStructureScaffold('');
            setProjectStructureFedFiles([]);
          }
          if (res.data.path) {
            loadVersions(res.data.path);
            const api = (window as any).electronAPI;
            if (api?.readProjectFiles) {
              const filesRes = await api.readProjectFiles(res.data.path);
              if (filesRes.success) {
                const fileArray = Object.entries(filesRes.files).map(([filename, content]) => ({ filename, content: content as string }));
                setLastGeneratedFiles(fileArray);
                setPreviewHtml(buildPreviewHtml(fileArray));

                const foundKeys = detectKeysFromFiles(fileArray);
                if (foundKeys.length > 0) {
                  setDetectedKeys(foundKeys);
                  const savedKeys = await loadProjectKeys(res.data.path);
                  const hasUnfilled = foundKeys.some(k => !savedKeys[k]);
                  if (hasUnfilled) {
                    openKeysModal(foundKeys, res.data.path);
                  }
                }
              }
            }
          }
        } else {
          alert('Failed to load project: ' + res.error);
        }
      } catch (err) {
        console.error("Error loading project:", err);
      }
    } else {
      alert('Load simulated (Browser Mode).');
    }
  };

  return (
    <>
      {/* PIN Unlock Overlay */}
      {showPinPrompt && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ maxWidth: '380px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '20px' }}>
              <Lock size={40} style={{ color: 'var(--color-blue-light)', marginBottom: '12px' }} />
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Unlock Credentials</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-cream-dark)', margin: '8px 0 0' }}>
                Enter your PIN to decrypt your saved API key.
              </p>
            </div>

            <div className="input-group" style={{ marginBottom: '16px' }}>
              <input
                type="password"
                className="styled-input"
                placeholder="Enter PIN"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                autoFocus
              />
              {pinError && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '6px' }}>{pinError}</div>}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setShowPinPrompt(false); setPinInput(''); }}>
                Skip
              </button>
              <button className="btn btn-primary" onClick={handleUnlock}>
                <KeyRound size={16} /> Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Titlebar */}
      <div className="titlebar">
        <span>Vibe Blocking IDE</span>
        <div className="titlebar-actions">
          <button className="titlebar-btn" onClick={handleMinimize}>—</button>
          <button className="titlebar-btn" onClick={handleMaximize}>◻</button>
          <button className="titlebar-btn close" onClick={handleClose}>✕</button>
        </div>
      </div>

      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="brand">
            <BoxSelect className="brand-icon" size={28} />
            <span>Vibe Builder</span>
          </div>

          <div className="input-group" style={{ marginTop: '24px' }}>
            <label className="input-label">Project Name</label>
            <input
              type="text"
              className="styled-input"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. MyAwesomeApp"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Target Platform / App Type</label>
            <input
              type="text"
              className="styled-input"
              value={appType}
              onChange={(e) => setAppType(e.target.value)}
              placeholder="e.g. Android App, Web App"
            />
          </div>

          <div className="sidebar-bottom">
            <button className="btn btn-secondary" onClick={handleLoadProject} style={{ marginBottom: '12px' }}>
              <FolderOpen size={18} /> Load Project
            </button>
            <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} /> Settings
            </button>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="workspace">
          {/* Tab Bar */}
          <div className="workspace-tabs">
            <button
              className={`workspace-tab ${activeTab === 'blocks' ? 'active' : ''}`}
              onClick={() => setActiveTab('blocks')}
            >
              <Sparkles size={16} />
              Vibe Blocks
              <span className="tab-count">{blocks.length}</span>
            </button>
            <button
              className={`workspace-tab ${activeTab === 'mcp' ? 'active' : ''}`}
              onClick={() => setActiveTab('mcp')}
            >
              <Plug size={16} />
              MCP Servers
              <span className="tab-count">{mcpServers.length}</span>
            </button>
            <button
              className={`workspace-tab ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              <BookOpen size={16} />
              Skills
              <span className="tab-count">{skills.length}</span>
            </button>
            <button
              className={`workspace-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
              disabled={!previewHtml}
              style={{ opacity: previewHtml ? 1 : 0.4 }}
            >
              <Monitor size={16} />
              Preview
            </button>
          </div>

          {/* Blocks Tab */}
          {activeTab === 'blocks' && (
            <div className="blocks-container">
              <div className="design-grid">
                {DESIGN_PHASES.map((phase) => {
                  const block = blocks.find(b => b.id === phase.id);
                  const PhaseIcon = phase.icon;
                  return (
                    <div
                      key={phase.id}
                      className="design-phase-card"
                      style={{ '--phase-color': phase.color } as React.CSSProperties}
                    >
                      <div className="phase-header">
                        <div className="phase-icon-wrap" style={{ background: `${phase.color}18`, color: phase.color }}>
                          <PhaseIcon size={18} />
                        </div>
                        <span className="phase-label" style={{ color: phase.color }}>{phase.label}</span>
                      </div>
                      <p className="phase-description">{phase.description}</p>
                      <textarea
                        className="phase-prompt"
                        placeholder={phase.placeholder}
                        value={block?.prompt || ''}
                        onChange={(e) => updateBlock(phase.id, 'prompt', e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Project Structure & Folders */}
              <div className="vibe-block design-phase-card" style={{ '--phase-color': '#0ea5e9' } as React.CSSProperties}>
                <div className="phase-header">
                  <div className="phase-icon-wrap" style={{ background: 'rgba(14, 165, 233, 0.18)', color: '#0ea5e9' }}>
                    <FolderTree size={18} />
                  </div>
                  <span className="phase-label" style={{ color: '#0ea5e9' }}>Project Structure &amp; Folders</span>
                </div>
                <p className="phase-description">
                  Define folders and files so your project has proper layout. Gemini uses this as context to place code in the right places. Optionally: run a scaffold command first, or feed existing files so the AI extends them.
                </p>

                <div className="structure-presets">
                  <span className="structure-presets-label">Quick add:</span>
                  {STRUCTURE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => {
                        const existing = new Set(projectStructureItems.map((i) => i.path));
                        const toAdd = preset.items.filter((i) => !existing.has(i.path));
                        setProjectStructureItems((prev) => [
                          ...prev,
                          ...toAdd.map((i) => ({ id: `ps-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...i }))
                        ]);
                      }}
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                <div className="structure-add-row">
                  <input
                    type="text"
                    className="styled-input"
                    placeholder="e.g. src/components/Button or package.json"
                    value={projectStructureInput}
                    onChange={(e) => setProjectStructureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const p = projectStructureInput.trim();
                        if (!p) return;
                        const hasExt = /\.[a-zA-Z0-9]+$/.test(p);
                        setProjectStructureItems((prev) => [
                          ...prev,
                          { id: `ps-${Date.now()}`, type: hasExt ? 'file' : 'folder', path: p }
                        ]);
                        setProjectStructureInput('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flexShrink: 0 }}
                    onClick={() => {
                      const p = projectStructureInput.trim();
                      if (!p) return;
                      const hasExt = /\.[a-zA-Z0-9]+$/.test(p);
                      setProjectStructureItems((prev) => [
                        ...prev,
                        { id: `ps-${Date.now()}`, type: hasExt ? 'file' : 'folder', path: p }
                      ]);
                      setProjectStructureInput('');
                    }}
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>

                {projectStructureItems.length > 0 && (
                  <div className="structure-tree">
                    {projectStructureItems.map((item) => (
                      <div key={item.id} className="structure-tree-item">
                        <span className="structure-tree-icon">{item.type === 'folder' ? '📁' : '📄'}</span>
                        <span className="structure-tree-path">{item.path}</span>
                        <button
                          type="button"
                          className="mcp-remove-btn"
                          onClick={() => setProjectStructureItems((prev) => prev.filter((i) => i.id !== item.id))}
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="input-group" style={{ marginTop: '16px' }}>
                  <label className="input-label">Describe in your words (optional)</label>
                  <textarea
                    className="phase-prompt"
                    style={{ minHeight: '70px' }}
                    placeholder="e.g. Proper React app with src/pages, src/components, GitHub-ready .gitignore and README, package.json with build scripts"
                    value={projectStructureDescription}
                    onChange={(e) => setProjectStructureDescription(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">
                    <Terminal size={14} /> Scaffold command to run first (optional)
                  </label>
                  <input
                    type="text"
                    className="styled-input"
                    placeholder="e.g. npx create-vite@latest . -- --template react  or  mkdir -p src/components src/utils"
                    value={projectStructureScaffold}
                    onChange={(e) => setProjectStructureScaffold(e.target.value)}
                  />
                  <div className="structure-scaffold-hint">
                    Only whitelisted commands run: npm create, npx create, mkdir. Runs in project folder before generation.
                  </div>
                </div>

                <div className="input-group structure-fed-section">
                  <label className="input-label">
                    <FileCode size={14} /> Feed existing files (optional)
                  </label>
                  <p className="structure-fed-hint">
                    Upload files to provide existing code as context. Gemini will use these when generating — extend, modify, or integrate them. Path = where the file lives in your project (e.g. <code>src/App.tsx</code>).
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={async () => {
                      const api = (window as any).electronAPI;
                      if (!api?.browseFilesForStructure) {
                        alert('File picker is not available. Make sure you are running the desktop app.');
                        return;
                      }
                      const res = await api.browseFilesForStructure();
                      if (res?.success && res.files?.length) {
                        setProjectStructureFedFiles((prev) => [
                          ...prev,
                          ...res.files.map((f: { content: string; suggestedPath: string }) => ({
                            id: `fed-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            path: f.suggestedPath,
                            content: f.content,
                            sourceName: f.suggestedPath
                          }))
                        ]);
                      } else if (res && !res.canceled && res.error) {
                        alert(`Could not add files: ${res.error}`);
                      }
                    }}
                  >
                    <Upload size={14} /> Upload files
                  </button>
                  {projectStructureFedFiles.length > 0 && (
                    <div className="structure-fed-list">
                      {projectStructureFedFiles.map((fed) => (
                        <div key={fed.id} className="structure-fed-item">
                          <input
                            type="text"
                            className="styled-input structure-fed-path"
                            value={fed.path}
                            onChange={(e) =>
                              setProjectStructureFedFiles((prev) =>
                                prev.map((f) => (f.id === fed.id ? { ...f, path: e.target.value } : f))
                              )
                            }
                            placeholder="e.g. src/App.tsx"
                          />
                          <span className="structure-fed-size">{fed.content.length.toLocaleString()} chars</span>
                          <button
                            type="button"
                            className="mcp-remove-btn"
                            onClick={() => setProjectStructureFedFiles((prev) => prev.filter((f) => f.id !== fed.id))}
                            title="Remove"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="optional-divider">
                <span>Additional Requirements (Optional)</span>
              </div>

              {blocks.filter(b => !DESIGN_PHASES.some(p => p.id === b.id)).map((block, index) => (
                <div key={block.id} className="vibe-block optional-block">
                  <div className="block-header">
                    <div className="block-title" style={{ color: 'var(--color-cream-dark)' }}>
                      <Plus size={18} />
                      Custom Requirement {index + 1}
                    </div>
                    <div className="block-actions">
                      <button onClick={() => removeBlock(block.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="prompt-area"
                    placeholder="Describe any additional requirement, feature, or detail not covered by the design phases above..."
                    value={block.prompt}
                    onChange={(e) => updateBlock(block.id, 'prompt', e.target.value)}
                  />
                </div>
              ))}

              <button className="btn btn-add-block" onClick={addBlock}>
                <Plus size={20} /> Add Custom Requirement
              </button>
            </div>
          )}

          {/* MCP Servers Tab */}
          {activeTab === 'mcp' && (
            <div className="mcp-container">
              {/* AI Build row */}
              <div className="mcp-build-row">
                <div className="mcp-build-header">
                  <Hammer size={16} />
                  <span>Build MCP Server with AI</span>
                </div>
                <p className="mcp-build-desc">
                  Describe what you need and Gemini will generate a full MCP server, install its dependencies, and add it to your list automatically.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <textarea
                    className="prompt-area mcp-prompt"
                    placeholder="e.g. 'An MCP server that searches GitHub repos and returns results with a search_repos tool'"
                    value={mcpBuildPrompt}
                    onChange={(e) => setMcpBuildPrompt(e.target.value)}
                  />
                  <button
                    className="btn btn-primary mcp-build-btn"
                    onClick={handleBuildMcp}
                    disabled={mcpBuilding || !mcpBuildPrompt.trim()}
                  >
                    {mcpBuilding ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                    {mcpBuilding ? 'Building...' : 'Build'}
                  </button>
                </div>
                {mcpBuildLog && (
                  <div className={`mcp-log ${mcpBuildLog.startsWith('Error') ? 'error' : mcpBuildLog.includes('installed') || mcpBuildLog.includes('built') ? 'success' : ''}`}>
                    {mcpBuildLog}
                  </div>
                )}
              </div>

              {/* Add custom MCP */}
              <div className="mcp-divider">
                <span>or add an existing server</span>
              </div>

              <div className="mcp-custom-row">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button className="btn btn-secondary mcp-action-btn" onClick={() => setMcpShowAdd(!mcpShowAdd)}>
                    <Package size={16} /> {mcpShowAdd ? 'Cancel' : 'Add via npm / path'}
                  </button>
                  <button className="btn btn-secondary mcp-action-btn" onClick={handleBrowseMcp} disabled={mcpAdding}>
                    <FolderPlus size={16} /> Browse Local Folder
                  </button>
                </div>

                {mcpShowAdd && (
                  <div className="mcp-add-panel">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-cream-dark)', marginBottom: '8px' }}>
                      Enter an npm package (prefix with <code>npm:</code>) or a local folder path.
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="styled-input"
                        placeholder="npm:@modelcontextprotocol/server-github  or  C:\my-mcp-server"
                        value={mcpCustomSource}
                        onChange={(e) => setMcpCustomSource(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustomMcp(mcpCustomSource)}
                        autoFocus
                      />
                      <button
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                        onClick={() => handleAddCustomMcp(mcpCustomSource)}
                        disabled={mcpAdding || !mcpCustomSource.trim()}
                      >
                        {mcpAdding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                        Install
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Server list */}
              {mcpServers.length > 0 && (
                <>
                  <div className="mcp-list-header">
                    <span>Installed Servers</span>
                  </div>
                  <div className="mcp-server-list">
                    {mcpServers.map(server => (
                      <div key={server.id} className="mcp-server-card">
                        <div className="mcp-server-info">
                          <div className="mcp-server-name">
                            {server.status === 'installed' ? (
                              <CheckCircle2 size={14} style={{ color: '#69db7c' }} />
                            ) : server.status === 'error' ? (
                              <AlertCircle size={14} style={{ color: '#ff6b6b' }} />
                            ) : (
                              <Loader2 size={14} className="spin" />
                            )}
                            {server.name}
                            <span className={`mcp-badge ${server.type}`}>
                              {server.type === 'built' ? 'AI Built' : 'Custom'}
                            </span>
                          </div>
                          <div className="mcp-server-meta">
                            {server.command} &middot; {new Date(server.createdAt).toLocaleDateString()}
                          </div>
                          {mcpInstallLogs[server.id] && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-blue-light)', marginTop: '2px' }}>
                              {mcpInstallLogs[server.id]}
                            </div>
                          )}
                        </div>
                        <button className="mcp-remove-btn" onClick={() => handleRemoveMcp(server.id)} title="Remove">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {mcpServers.length === 0 && (
                <div className="mcp-empty">
                  <Plug size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div>No MCP servers installed yet.</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Build one with AI above, or add a custom server.</div>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="mcp-container">
              {/* AI Build Skill */}
              <div className="mcp-build-row">
                <div className="mcp-build-header">
                  <Sparkles size={16} />
                  <span>Create Skill with AI</span>
                </div>
                <p className="mcp-build-desc">
                  Describe the skill you need and Gemini will generate a complete SKILL.md following the
                  <a href="https://github.com/anthropics/skills" target="_blank" rel="noreferrer" style={{ color: 'var(--color-blue-light)', marginLeft: '4px' }}>
                    Anthropic Skills format
                  </a>.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <textarea
                    className="prompt-area mcp-prompt"
                    placeholder="e.g. 'A skill that guides the AI to write unit tests following our team's conventions with Jest and React Testing Library'"
                    value={skillBuildPrompt}
                    onChange={(e) => setSkillBuildPrompt(e.target.value)}
                  />
                  <button
                    className="btn btn-primary mcp-build-btn"
                    onClick={handleBuildSkill}
                    disabled={skillBuilding || !skillBuildPrompt.trim()}
                  >
                    {skillBuilding ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
                    {skillBuilding ? 'Creating...' : 'Create'}
                  </button>
                </div>
                {skillLog && (
                  <div className={`mcp-log ${skillLog.startsWith('Error') ? 'error' : skillLog.includes('success') || skillLog.includes('Added') ? 'success' : ''}`}>
                    {skillLog}
                  </div>
                )}
              </div>

              {/* Import Skills */}
              <div className="mcp-divider">
                <span>or import existing skills</span>
              </div>

              <div className="mcp-custom-row">
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary mcp-action-btn" onClick={() => setSkillShowAdd(!skillShowAdd)}>
                    <Github size={16} /> {skillShowAdd ? 'Cancel' : 'Import from GitHub'}
                  </button>
                  <button className="btn btn-secondary mcp-action-btn" onClick={handleBrowseSkill} disabled={skillAdding}>
                    <FolderPlus size={16} /> Browse Local Folder
                  </button>
                  <button
                    className="btn btn-secondary mcp-action-btn"
                    onClick={() => { setSkillGithubUrl('anthropics/skills'); setSkillShowAdd(true); }}
                  >
                    <BookOpen size={16} /> Anthropic Skills Repo
                  </button>
                </div>

                {skillShowAdd && (
                  <div className="mcp-add-panel">
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-cream-dark)', marginBottom: '8px' }}>
                      Enter a GitHub repo URL or <code>owner/repo</code>. All SKILL.md files found will be imported.
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="styled-input"
                        placeholder="anthropics/skills  or  https://github.com/user/repo"
                        value={skillGithubUrl}
                        onChange={(e) => setSkillGithubUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSkillGithub()}
                        autoFocus
                      />
                      <button
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}
                        onClick={handleAddSkillGithub}
                        disabled={skillAdding || !skillGithubUrl.trim()}
                      >
                        {skillAdding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                        Clone
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Skills list */}
              {skills.length > 0 && (
                <>
                  <div className="mcp-list-header">
                    <span>Installed Skills</span>
                  </div>
                  <div className="mcp-server-list">
                    {skills.map(skill => (
                      <div key={skill.id} className="skill-card">
                        <div className="mcp-server-info">
                          <div className="mcp-server-name">
                            <FileText size={14} style={{ color: 'var(--color-blue-light)' }} />
                            {skill.name}
                            <span className={`mcp-badge ${skill.type === 'built' ? 'built' : skill.type === 'github' ? 'github' : 'custom'}`}>
                              {skill.type === 'built' ? 'AI Created' : skill.type === 'github' ? 'GitHub' : 'Local'}
                            </span>
                          </div>
                          {skill.description && (
                            <div className="mcp-server-meta">{skill.description}</div>
                          )}
                          <div className="mcp-server-meta" style={{ opacity: 0.6 }}>
                            {new Date(skill.createdAt).toLocaleDateString()}
                            {skill.source && <> &middot; {skill.source}</>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="mcp-remove-btn" onClick={() => handlePreviewSkill(skill.id, skill.name)} title="Preview">
                            <Eye size={14} />
                          </button>
                          <button className="mcp-remove-btn" onClick={() => handleRemoveSkill(skill.id)} title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {skills.length === 0 && (
                <div className="mcp-empty">
                  <BookOpen size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div>No skills installed yet.</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Create one with AI, import from GitHub, or browse a local folder.</div>
                </div>
              )}
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="preview-container">
              {previewHtml ? (
                <>
                  <div className="preview-toolbar">
                    <div className="preview-toolbar-info">
                      <Monitor size={16} />
                      <span>Live Preview</span>
                      <span className="preview-file-count">{lastGeneratedFiles.length} files</span>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                      onClick={() => {
                        const preview = buildPreviewHtml(lastGeneratedFiles);
                        setPreviewHtml(preview);
                      }}
                    >
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                  <iframe
                    srcDoc={previewHtml}
                    className="preview-iframe"
                    sandbox="allow-scripts allow-forms allow-modals allow-popups"
                    title="App Preview"
                  />
                </>
              ) : (
                <div className="mcp-empty">
                  <Monitor size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <div>No preview available.</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Build a web app to see a live preview here.</div>
                </div>
              )}
            </div>
          )}

          {/* Skill Preview Modal */}
          {skillPreview && (
            <div className="modal-overlay" onClick={() => setSkillPreview(null)} style={{ zIndex: 999 }}>
              <div className="modal skill-preview-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2><FileText size={20} /> {skillPreview.name}</h2>
                  <button className="modal-close" onClick={() => setSkillPreview(null)}>
                    <X size={20} />
                  </button>
                </div>
                <pre className="skill-preview-content">{skillPreview.content}</pre>
              </div>
            </div>
          )}

          <div className="action-area">
            {lastGeneratedFiles.length > 0 && (
              <div className="refine-row">
                <textarea
                  className="refine-input"
                  placeholder="Describe changes to refine your last build... (leave empty for a fresh build)"
                  value={refinePrompt}
                  onChange={(e) => setRefinePrompt(e.target.value)}
                  rows={2}
                />
              </div>
            )}
            {buildStatus && (
              <div className="build-status-row">
                <Loader2 size={14} className={isBuilding ? 'spin' : ''} />
                <span>{buildStatus}</span>
                {(buildContext.skills > 0 || buildContext.mcp > 0) && (
                  <span className="build-context-badges">
                    {buildContext.skills > 0 && (
                      <span className="context-badge skills-badge">
                        <BookOpen size={11} /> {buildContext.skills} Skill{buildContext.skills > 1 ? 's' : ''}
                      </span>
                    )}
                    {buildContext.mcp > 0 && (
                      <span className="context-badge mcp-badge-inline">
                        <Plug size={11} /> {buildContext.mcp} MCP
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
            <div className="action-bar">
              <div className="action-info">
                6 Phases{blocks.length > 6 ? ` + ${blocks.length - 6} Custom` : ''}
                {projectStructureItems.length > 0 && <> &middot; <FolderTree size={12} /> Structure</>}
                {projectStructureFedFiles.length > 0 && <> &middot; <FileCode size={12} /> {projectStructureFedFiles.length} fed</>}
                {mcpServers.length > 0 && <> &middot; <Plug size={12} /> {mcpServers.length} MCP</>}
                {skills.length > 0 && <> &middot; <BookOpen size={12} /> {skills.length} Skill{skills.length > 1 ? 's' : ''}</>}
                {detectedKeys.length > 0 && (
                  <button className="keys-badge" onClick={() => openKeysModal(detectedKeys)}>
                    <Key size={12} /> {detectedKeys.length} Key{detectedKeys.length > 1 ? 's' : ''}
                  </button>
                )}
                {versions.length > 0 && (
                  <button className="version-badge" onClick={() => setShowVersions(!showVersions)}>
                    <History size={12} /> v{versions.length}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={handleLaunch}>
                  <Play size={18} /> Launch
                </button>
                <button className="btn btn-primary" onClick={handleBuild} disabled={isBuilding}>
                  {isBuilding ? (
                    <><Loader2 size={18} className="spin" /> Building...</>
                  ) : refinePrompt.trim() ? (
                    <><RefreshCw size={18} /> Refine Build</>
                  ) : (
                    <><Sparkles size={18} /> Build Vibe App</>
                  )}
                </button>
              </div>
            </div>
            {showVersions && versions.length > 0 && (
              <div className="version-panel">
                <div className="version-panel-header">
                  <span>Build History</span>
                  <button className="modal-close" onClick={() => setShowVersions(false)} style={{ padding: '2px' }}>
                    <X size={14} />
                  </button>
                </div>
                {versions.map((v, i) => (
                  <div key={v.id} className="version-item">
                    <div className="version-item-info">
                      <span className="version-item-label">Build #{versions.length - i}</span>
                      <span className="version-item-meta">{new Date(v.timestamp).toLocaleString()} &middot; {v.files?.length || 0} files</span>
                    </div>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      onClick={() => handleRestoreVersion(v.id)}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Project API Keys Modal */}
      {showKeysModal && (
        <div className="modal-overlay" onClick={() => setShowKeysModal(false)}>
          <div className="modal keys-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Key size={20} /> Project API Keys</h2>
              <button className="modal-close" onClick={() => setShowKeysModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-cream-dark)', marginBottom: '16px' }}>
              Your generated app uses external APIs. Fill in the keys below — they'll be encrypted per-project and injected into the code, replacing the placeholders.
            </div>

            <div className="keys-list">
              {detectedKeys.map(keyName => (
                <div key={keyName} className="key-entry">
                  <label className="key-label">
                    <Key size={14} />
                    <span>{keyName.replace(/_/g, ' ')}</span>
                    <code className="key-placeholder">__VIBE_KEY_{keyName}__</code>
                  </label>
                  <input
                    type="password"
                    className="styled-input key-input"
                    placeholder={`Paste your ${keyName.toLowerCase().replace(/_/g, ' ')} here`}
                    value={projectKeys[keyName] || ''}
                    onChange={(e) => setProjectKeys(prev => ({ ...prev, [keyName]: e.target.value }))}
                  />
                </div>
              ))}
            </div>

            {keysStatus && (
              <div style={{
                marginTop: '12px',
                fontSize: '0.8rem',
                padding: '8px 12px',
                borderRadius: '8px',
                background: keysStatus.startsWith('Error') ? 'rgba(255, 107, 107, 0.1)' : 'rgba(105, 219, 124, 0.1)',
                color: keysStatus.startsWith('Error') ? '#ff6b6b' : '#69db7c',
                border: `1px solid ${keysStatus.startsWith('Error') ? 'rgba(255, 107, 107, 0.2)' : 'rgba(105, 219, 124, 0.2)'}`
              }}>
                {keysStatus}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setShowKeysModal(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handleSaveProjectKeys} disabled={keysSaving}>
                {keysSaving ? (
                  <><Loader2 size={16} className="spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save &amp; Inject Keys</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Settings size={20} /> Settings</h2>
              <button className="modal-close" onClick={() => setIsSettingsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">Gemini API Key</label>
              <input
                type="password"
                className="styled-input"
                placeholder="AI Studio API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">
                Gemini Model {isLoadingModels && <span style={{ fontSize: '0.8rem', color: 'var(--color-blue-light)' }}>(Loading...)</span>}
              </label>
              <select
                className="styled-input"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                style={{ cursor: 'pointer', backgroundColor: 'var(--color-mocha-light)' }}
              >
                {availableModels.length > 0 ? (
                  availableModels.map(m => (
                    <option key={m.name} value={m.name.replace('models/', '')}>{m.displayName || m.name}</option>
                  ))
                ) : (
                  <>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.0-pro-exp">Gemini 2.0 Pro Exp</option>
                  </>
                )}
              </select>
            </div>

            {/* PIN-protected credential storage */}
            <div style={{
              border: '1px solid rgba(253, 251, 247, 0.12)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px',
              background: 'rgba(47, 36, 31, 0.3)'
            }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <ShieldCheck size={16} /> Secure Credential Storage
              </label>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-cream-dark)', marginBottom: '12px' }}>
                Your API key is saved to an encrypted .env file inside a PIN-protected zip archive.
              </div>

              <div className="input-group" style={{ marginBottom: '10px' }}>
                <input
                  type="password"
                  className="styled-input"
                  placeholder={hasStoredCredentials ? 'New PIN (min 4 chars)' : 'Set a PIN (min 4 chars)'}
                  value={settingsPin}
                  onChange={(e) => setSettingsPin(e.target.value)}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '12px' }}>
                <input
                  type="password"
                  className="styled-input"
                  placeholder="Confirm PIN"
                  value={settingsPinConfirm}
                  onChange={(e) => setSettingsPinConfirm(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={handleSaveCredentials}>
                  <Lock size={14} /> {hasStoredCredentials ? 'Re-save Credentials' : 'Save & Encrypt'}
                </button>
                {hasStoredCredentials && currentPin && (
                  <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '8px 16px' }} onClick={handleChangePin}>
                    <KeyRound size={14} /> Change PIN Only
                  </button>
                )}
              </div>

              {credentialStatus && (
                <div style={{
                  marginTop: '10px',
                  fontSize: '0.8rem',
                  color: credentialStatus.includes('success') || credentialStatus.includes('saved') || credentialStatus.includes('updated')
                    ? '#69db7c' : '#ff6b6b'
                }}>
                  {credentialStatus}
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={16} /> Storage Drives
              </label>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-cream-dark)', marginBottom: '8px' }}>
                Default: Documents/VibeApps
              </div>
              <input type="text" className="styled-input" placeholder="Add custom NVME drive path (e.g. D:\Projects)" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
