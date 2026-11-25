#!/usr/bin/env node
/**
 * Sync documentation markdown and image assets from the upstream `herdr2` repo
 * into this Starlight website (`src/content/docs/` & `public/images/docs/`).
 *
 * Usage:
 *   pnpm sync-docs
 *   HERDR2_REPO_DIR=/path/to/herdr2 pnpm sync-docs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(
  process.env.HERDR2_REPO_DIR || path.join(siteRoot, '..', 'herdr2'),
);

if (!fs.existsSync(repoRoot)) {
  console.error(`[sync-docs] Source repo not found at: ${repoRoot}`);
  console.error('Set HERDR2_REPO_DIR=/path/to/herdr2 and try again.');
  process.exit(1);
}

const docsOutRoot = path.join(siteRoot, 'src', 'content', 'docs');
const imagesOutDir = path.join(siteRoot, 'public', 'images', 'docs');

fs.mkdirSync(imagesOutDir, { recursive: true });

// 1. Copy all documentation images (screenshots + architecture SVGs)
const imageSources = [
  path.join(repoRoot, 'docs', 'user-guide', 'images'),
  path.join(repoRoot, 'docs', 'images'),
];

let copiedImages = 0;
for (const dir of imageSources) {
  if (!fs.existsSync(dir)) continue;
  for (const entry of fs.readdirSync(dir)) {
    const src = path.join(dir, entry);
    if (!fs.statSync(src).isFile()) continue;
    fs.copyFileSync(src, path.join(imagesOutDir, entry));
    copiedImages += 1;
  }
}

// 1b. Mirror skills/herdr2-install/SKILL.md to public/skills/herdr2-install/SKILL.md
const installSkillSrc = path.join(repoRoot, 'skills', 'herdr2-install', 'SKILL.md');
const installSkillPublicDest = path.join(siteRoot, 'public', 'skills', 'herdr2-install', 'SKILL.md');
if (fs.existsSync(installSkillSrc)) {
  fs.mkdirSync(path.dirname(installSkillPublicDest), { recursive: true });
  fs.copyFileSync(installSkillSrc, installSkillPublicDest);
}

// 2. Helper: convert GitHub blockquote alerts (> [!TIP]) into Starlight :::tip asides
function convertGithubAlerts(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  const kindMap = {
    TIP: 'tip',
    NOTE: 'note',
    IMPORTANT: 'note',
    WARNING: 'caution',
    CAUTION: 'danger',
  };

  let i = 0;
  while (i < lines.length) {
    const match = lines[i].match(/^>\s*\[!(TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]\s*$/i);
    if (match) {
      const kind = kindMap[match[1].toUpperCase()] || 'note';
      const body = [];
      i += 1;
      while (i < lines.length && /^>/.test(lines[i])) {
        body.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`:::${kind}`);
      out.push(...body);
      out.push(':::');
      continue;
    }
    out.push(lines[i]);
    i += 1;
  }
  return out.join('\n');
}

// 3. Helper: strip leading H1 & transform relative links/images
function transformMarkdown(raw, { title, description, linkPrefix = '' }) {
  let content = raw.replace(/^\uFEFF/, '');

  // Strip the very first H1 line so Starlight doesn't render duplicate titles
  content = content.replace(/^#\s+.+\r?\n+/, '');

  // Convert GitHub-style alerts to Starlight asides
  content = convertGithubAlerts(content);

  // Rewrite image paths to /images/docs/<filename>
  content = content.replace(
    /(!\[[^\]]*\]\()(?:\.\/|\.\.\/)*(?:docs\/(?:user-guide\/)?)?images\/([^)]+)(\))/g,
    '$1/images/docs/$2$3',
  );

  // Rewrite cross-doc relative links to Starlight routes
  const linkReplacements = [
    [/\]\(\.\/01-getting-started\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/01-getting-started/$1)`],
    [/\]\(\.\/02-workspaces-and-terminals\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/02-workspaces-and-terminals/$1)`],
    [/\]\(\.\/03-headless-acp-agents\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/03-headless-acp-agents/$1)`],
    [/\]\(\.\/04-handoff-checkpoints-and-ai\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/04-handoff-checkpoints-and-ai/$1)`],
    [/\]\(\.\/05-drove-orchestration\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/05-drove-orchestration/$1)`],
    [/\]\(\.\/06-remote-customization-and-qa\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/06-remote-customization-and-qa/$1)`],
    [/\]\(\.\/README\.md(#[^)]*)?\)/g, `](${linkPrefix}/guide/$1)`],
    [/\]\(\.\.\/herdr2-architecture-and-principles\.md(#[^)]*)?\)/g, `](${linkPrefix}/architecture/principles/$1)`],
    [/\]\(\.\.\/drove-architecture\.md(#[^)]*)?\)/g, `](${linkPrefix}/architecture/drove/$1)`],
    [/\]\(\.\.\/herdr2-usage-guide\.md(#[^)]*)?\)/g, `](${linkPrefix}/architecture/usage-and-coexistence/$1)`],
    [/\]\(\.\.\/context-handoff-and-lineage-plan\.md(#[^)]*)?\)/g, `](${linkPrefix}/architecture/handoff-and-lineage/$1)`],
    [/\]\(\.?\/?commands\.md(#[^)]*)?\)/g, `](${linkPrefix}/reference/commands/$1)`],
    [/\]\(\.?\/?machines\.md(#[^)]*)?\)/g, `](${linkPrefix}/reference/machines/$1)`],
    [/\]\(\.?\/?templates\.md(#[^)]*)?\)/g, `](${linkPrefix}/reference/templates/$1)`],
    [/\]\(\.?\/?security\.md(#[^)]*)?\)/g, `](${linkPrefix}/reference/security/$1)`],
    [/\]\(\.\.\/README\.md\)/g, '](https://github.com/herdr2/herdr2)'],
    [/\]\(\.\.\/schema\/README\.md\)/g, '](https://github.com/herdr2/herdr2/tree/main/herdr-core/schema)'],
    [/\]\(\.\.\/\.\.\/README\.md\)/g, '](https://github.com/herdr2/herdr2)'],
    [/\]\(\.\.\/\.\.\/qa\/CATALOG\.md\)/g, '](https://github.com/herdr2/herdr2/blob/main/qa/CATALOG.md)'],
    [/\]\(\.\.\/\.\.\/skills\/herdr2-install\/SKILL\.md\)/g, '](/guide/install/)'],
  ];

  for (const [pattern, replacement] of linkReplacements) {
    content = content.replace(pattern, replacement);
  }

  const escapeYaml = (v) => JSON.stringify(v);
  const frontmatter = [
    '---',
    `title: ${escapeYaml(title)}`,
    `description: ${escapeYaml(description)}`,
    '---',
    '',
  ].join('\n');

  return `${frontmatter}${content.trim()}\n`;
}

// 4. Document manifest
const docEntries = [
  // Chinese User Guide (root locale)
  {
    src: 'docs/user-guide/README.md',
    dest: 'guide/index.md',
    title: 'Herdr2 用户使用手册',
    description: 'Herdr2 双平面工作台与多智能体编排运行时完整图文使用手册与学习路线。',
  },
  {
    src: 'docs/user-guide/01-getting-started.md',
    dest: 'guide/01-getting-started.md',
    title: '01. 安装、快速上手与界面导览',
    description: '完成多平台安装与环境校验、理解双平面架构与必配 Core AI 欢迎向导，5 分钟跑通原生 CLI + 润色输入与 ACP 开发闭环。',
  },
  {
    src: 'docs/user-guide/02-workspaces-and-terminals.md',
    dest: 'guide/02-workspaces-and-terminals.md',
    title: '02. 工作区、终端与代码面板',
    description: '掌握 Space/Tab/Split 布局、Ghostty 真终端持久化托管，以及文件、变更与闪念清单面板。',
  },
  {
    src: 'docs/user-guide/03-headless-acp-agents.md',
    dest: 'guide/03-headless-acp-agents.md',
    title: '03. 无头 ACP 智能体与权限控制',
    description: '14 种内置 ACP 预设、结构化对话、串行收件箱与实时插话、四档权限审批与内置 MCP 树。',
  },
  {
    src: 'docs/user-guide/04-handoff-checkpoints-and-ai.md',
    dest: 'guide/04-handoff-checkpoints-and-ai.md',
    title: '04. 全局 Core AI、润色输入、接力与快照',
    description: '全局 Core AI 必配中枢、AI 润色输入（Prompt Polish）原地改写与撤销、接力/分叉/旁路/发送上下文，以及隐藏 Git Ref 快照回滚。',
  },
  {
    src: 'docs/user-guide/05-drove-orchestration.md',
    dest: 'guide/05-drove-orchestration.md',
    title: '05. Drove 多智能体 DAG 编排',
    description: '桌面端角色一键配置、先 Plan 再 /drove 并行编排、/drove-add 热追加、Review 熔断与 Drove Web 7 大可视化工作台。',
  },
  {
    src: 'docs/user-guide/06-remote-customization-and-qa.md',
    dest: 'guide/06-remote-customization-and-qa.md',
    title: '06. 远程主机、深度定制与自动化自检',
    description: 'SSH 多机联邦、三套布局与 Mods/Layouts 热重载定制，以及隔离沙盒自动化 QA 框架。',
  },

  // Architecture & Principles (Chinese upstream sources -> root zh-CN locale)
  // Note: `architecture/drove.md` and `reference/{commands,machines,templates,security}.md`
  // under root (`/`) are maintained as Chinese translations inside this website repo
  // so that Chinese locale pages never fall back to raw English upstream text.
  {
    src: 'docs/herdr2-architecture-and-principles.md',
    dest: 'architecture/principles.md',
    title: 'Herdr2 架构与实现原理深度解析',
    description: '深入解析双平面混合运行时、二进制多路复用协议、无头 ACP 引擎与跨机联邦工程实现。',
  },
  {
    src: 'docs/context-handoff-and-lineage-plan.md',
    dest: 'architecture/handoff-and-lineage.md',
    title: '跨 Provider 上下文接力与统一会话血统',
    description: 'Context Handoff、Worktree Fork 与会话血统（Session Lineage）的架构设计与实现细节。',
  },
  {
    src: 'docs/herdr2-usage-guide.md',
    dest: 'architecture/usage-and-coexistence.md',
    title: 'Herdr2 使用指南与原版共存说明',
    description: 'Herdr2 与原版 Herdr 零冲突共存策略、环境变量隔离、日常开发与故障排查手册。',
  },

  // English upstream docs -> /en/ locale only
  {
    src: 'docs/drove-architecture.md',
    dest: 'en/architecture/drove.md',
    title: 'Drove Architecture Inside Herdr2',
    description: 'Architecture of Drove, the native single-daemon multi-agent DAG orchestrator inside Herdr2.',
    linkPrefix: '/en',
  },
  {
    src: 'herdr-core/docs/commands.md',
    dest: 'en/reference/commands.md',
    title: 'CLI Command Reference',
    description: 'Complete CLI command and flag reference generated from the h2 / herdr2 binary.',
    linkPrefix: '/en',
  },
  {
    src: 'herdr-core/docs/machines.md',
    dest: 'en/reference/machines.md',
    title: 'Remote Machines Federation',
    description: 'Run ACP agents, commands, and file edits across remote Linux/macOS/WSL machines over SSH.',
    linkPrefix: '/en',
  },
  {
    src: 'herdr-core/docs/templates.md',
    dest: 'en/reference/templates.md',
    title: 'Agent Templates',
    description: 'Save reusable ACP presets, models, permission policies, and opening instructions as templates.',
    linkPrefix: '/en',
  },
  {
    src: 'herdr-core/docs/security.md',
    dest: 'en/reference/security.md',
    title: 'Security & Trust Model',
    description: 'Execution boundary, permissions, and security guidance for Herdr2 Core.',
    linkPrefix: '/en',
  },
];

let syncedDocs = 0;
for (const doc of docEntries) {
  const srcPath = path.join(repoRoot, doc.src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`[sync-docs] Skip missing source: ${doc.src}`);
    continue;
  }
  const raw = fs.readFileSync(srcPath, 'utf8');
  const out = transformMarkdown(raw, doc);
  const destPath = path.join(docsOutRoot, doc.dest);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, out, 'utf8');
  syncedDocs += 1;
}

// 5. Generate dedicated install guide page focused exclusively on herdr2-install Skill
if (fs.existsSync(installSkillSrc)) {
  const installDoc = `---
title: "安装与升级（herdr2-install Skill）"
description: "通过 herdr2-install Agent Skill 让你的 AI 编程助手自动完成 Herdr2 桌面端、h2 守护进程与配套 Skills 的安装和升级。"
---

:::tip[唯一推荐安装方式：\`herdr2-install\` Skill]
Herdr2 统一通过 **\`herdr2-install\`** Agent Skill 完成跨平台安装与升级（支持 macOS、Linux、Windows 与 WSL），无需手动挑选安装包或配置环境变量。
:::

## 一步完成安装

将下面这句话直接发送给你的 AI 编程助手（**Antigravity、Claude Code、Codex、Cursor、OpenCode、Windsurf** 等均可）：

\`\`\`text
请读取 https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md 并按 herdr2-install skill 步骤帮我安装 Herdr2（桌面端 + h2 核心 + 配套 Skills）。
\`\`\`

> 若当前网络访问 GitHub Raw 较慢，可直接将本站同步镜像地址提供给 AI 助手：[\`/skills/herdr2-install/SKILL.md\`](/skills/herdr2-install/SKILL.md)。

---

## \`herdr2-install\` Skill 会自动为你完成什么？

1. **自动识别平台与架构**：检测本机属于 macOS（Apple Silicon）、Linux、Windows 还是 WSL 环境。
2. **下载并安装最新版 Herdr2**：自动拉取对应平台的桌面端应用与 \`h2\` 核心守护进程，并处理好 \`PATH\`。
3. **启动并自检守护进程**：校验 \`h2 --version\` 与 \`herdr2 --version\`，自动拉起常驻 \`h2 server\`。
4. **注入全部配套 Skills**：执行 \`h2 skill install --all\`，将 \`herdr2\`、\`drove\`、\`drove-add\`、\`drove-setup\` 自动安装到本机已有的 Coding Agents 中。
5. **引导首次配置内置 Core AI**：启动 Herdr2 桌面端，在欢迎向导中接入全局轻量 Core AI（推荐 DeepSeek / OpenAI 兼容接口）即可开始使用；后续版本升级直接点击界面右上角 **更新** 按钮即可热部署。

---

## 安装后如何在 Herdr2 App 中开始多 Agent 协作？

你不需要在终端里手敲任何 \`h2\` 命令行——整个日常协作都在 **Herdr2 桌面端 + 配套 Skills** 中完成：

1. **打开 Herdr2 桌面端并进入项目工作区**：完成欢迎向导（配置全局轻量 Core AI）后，点击左侧「工作区」旁的 \`+\` 打开你的代码仓库。
2. **打开一个主 Agent**：点击顶部标签栏的 \`+\`，选择你常用的 Agent（如 Claude Code、Codex、Antigravity、Cursor、Gemini 等）。
3. **直接用配套 Skills 指挥多 Agent 牧群**：
   - **\`/drove-setup\`**：在「设置 → Drove」或对话中完成多角色（\`coder\` / \`tester\` / \`reviewer\` / \`writer\` / \`researcher\`）的模型与思考强度配置。
   - **\`/drove <你的研发需求>\`**：主 Agent 自动化身编排者，拆解任务 DAG 并派生多角色无头子 Agent 在隔离 Worktree 中并行开发、跑测验收与异构审查；你可以随时在左侧「智能体」树或 Drove Web 画布中查看实时进展与审批关键写入。
   - **\`/drove-add <追加需求>\`**：需求有新变化时动态追加任务，直接复用温热（\`idle\`）的已有子 Agent 上下文。

---

## 查看原始 Skill 文件

- GitHub 源文件：[\`skills/herdr2-install/SKILL.md\`](https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md)
- 本站静态镜像：[\`/skills/herdr2-install/SKILL.md\`](/skills/herdr2-install/SKILL.md)
- 下一步：阅读 **[01. 安装、快速上手与界面导览](/guide/01-getting-started/)**
`;

  fs.writeFileSync(path.join(docsOutRoot, 'guide', 'install.md'), installDoc, 'utf8');
  syncedDocs += 1;

  const installDocEn = `---
title: "Install & Upgrade (herdr2-install Skill)"
description: "Use the herdr2-install Agent Skill to let your AI coding assistant automatically install and upgrade Herdr2 Desktop, the h2 daemon, and companion skills."
---

:::tip[Recommended Installation Method: \`herdr2-install\` Skill]
Herdr2 is installed and upgraded across macOS, Linux, Windows, and WSL using the **\`herdr2-install\`** Agent Skill — no need to pick installers manually or configure \`PATH\` by hand.
:::

## One-Step Installation

Send the following message directly to your AI coding assistant (**Antigravity, Claude Code, Codex, Cursor, OpenCode, Windsurf**, etc.):

\`\`\`text
Read https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md and follow the herdr2-install skill steps to install Herdr2 (Desktop app + h2 core + companion skills) on this machine.
\`\`\`

> If GitHub Raw is slow on your network, you can point your AI assistant to the static mirror hosted on this site: [\`/skills/herdr2-install/SKILL.md\`](/skills/herdr2-install/SKILL.md).

---

## What \`herdr2-install\` Automates for You

1. **Detects Platform & Architecture**: Automatically identifies macOS (Apple Silicon), Linux, Windows, or WSL.
2. **Downloads & Installs Latest Herdr2**: Fetches the matching desktop package and \`h2\` core daemon, and wires up \`PATH\`.
3. **Starts & Verifies the Daemon**: Checks \`h2 --version\` and \`herdr2 --version\`, then starts the persistent \`h2 server\`.
4. **Injects Companion Skills**: Runs \`h2 skill install --all\` to install \`herdr2\`, \`drove\`, \`drove-add\`, and \`drove-setup\` into all detected coding agents.
5. **Guides Core AI Setup**: Launches Herdr2 Desktop so you can configure the built-in global Core AI in the Welcome wizard (DeepSeek / any OpenAI-compatible API recommended); future upgrades are applied in-app via the top-right **Update** button without interrupting running agents.

---

## Starting Multi-Agent Workflows in Herdr2

You do not need to type \`h2\` CLI commands in day-to-day work — everything runs inside **Herdr2 Desktop + companion skills**:

1. **Open Herdr2 Desktop & Add a Workspace**: Finish the Welcome wizard (including global Core AI setup), then click \`+\` next to **Spaces** to open your repository.
2. **Start a Lead Agent**: Click \`+\` on the top tab bar to launch your preferred agent (Claude Code, Codex, Antigravity, Cursor, Gemini, etc.).
3. **Orchestrate with Companion Skills**:
   - **\`/drove-setup\`**: Configure role bindings (\`coder\` / \`tester\` / \`reviewer\` / \`writer\` / \`researcher\`) and thinking effort in **Settings → Drove** or via chat.
   - **\`/drove <your engineering goal>\`**: Your lead agent plans a task DAG and dispatches headless worker agents in isolated Git worktrees with automatic verification gates and cross-model reviews.
   - **\`/drove-add <follow-up request>\`**: Hot-append follow-up tasks directly onto warm \`idle\` workers without losing context.

---

## View the Raw Skill File

- GitHub Source: [\`skills/herdr2-install/SKILL.md\`](https://raw.githubusercontent.com/herdr2/herdr2/main/skills/herdr2-install/SKILL.md)
- Static Site Mirror: [\`/skills/herdr2-install/SKILL.md\`](/skills/herdr2-install/SKILL.md)
- Next Step: Read **[01. Install & Getting Started](/en/guide/01-getting-started/)**
`;

  fs.mkdirSync(path.join(docsOutRoot, 'en', 'guide'), { recursive: true });
  fs.writeFileSync(path.join(docsOutRoot, 'en', 'guide', 'install.md'), installDocEn, 'utf8');
  syncedDocs += 1;
}

console.log(
  `[sync-docs] Done! Synced ${syncedDocs} markdown docs and ${copiedImages} image assets from ${repoRoot}.`,
);
