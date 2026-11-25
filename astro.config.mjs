import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeBlack from 'starlight-theme-black';

const siteUrl = process.env.SITE_URL || 'https://herdr2.dev';

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Herdr2',
      description: 'Harness of Harnesses · 永不掉线的多 Agent 协作平台（ADE），内置 Drove DAG 编排与全局 Core AI 能力',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'Herdr2 Logo',
      },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: {
          label: '简体中文',
          lang: 'zh-CN',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/herdr2/herdr2',
        },
      ],
      components: {
        Header: './src/components/Header.astro',
        PageFrame: './src/components/PageFrame.astro',
        PageTitle: './src/components/PageTitle.astro',
        TwoColumnContent: './src/components/TwoColumnContent.astro',
      },
      plugins: [
        starlightThemeBlack({
          navLinks: [],
          footerText: '',
        }),
      ],
      customCss: [
        '@fontsource/geist-sans/400.css',
        '@fontsource/geist-sans/500.css',
        '@fontsource/geist-sans/600.css',
        '@fontsource/geist-sans/700.css',
        '@fontsource/geist-mono/400.css',
        '@fontsource/geist-mono/500.css',
        './src/styles/custom.css',
      ],
      sidebar: [
        {
          label: '用户使用手册',
          translations: { en: 'User Guide' },
          items: [
            {
              label: '安装与升级（herdr2-install）',
              translations: { en: 'Install (herdr2-install Skill)' },
              slug: 'guide/install',
            },
            {
              label: '手册导览与学习路线',
              translations: { en: 'Overview & Roadmap' },
              slug: 'guide',
            },
            {
              label: '01. 安装、快速上手与界面导览',
              translations: { en: '01. Install & Getting Started' },
              slug: 'guide/01-getting-started',
            },
            {
              label: '02. 工作区、终端与代码面板',
              translations: { en: '02. Workspaces & Terminals' },
              slug: 'guide/02-workspaces-and-terminals',
            },
            {
              label: '03. 无头 ACP 智能体与权限控制',
              translations: { en: '03. Headless ACP Agents' },
              slug: 'guide/03-headless-acp-agents',
            },
            {
              label: '04. 全局 Core AI、润色输入、接力与快照',
              translations: { en: '04. Core AI, Polish, Handoff & Checkpoints' },
              slug: 'guide/04-handoff-checkpoints-and-ai',
            },
            {
              label: '05. Drove 多智能体 DAG 编排',
              translations: { en: '05. Drove DAG Orchestration' },
              slug: 'guide/05-drove-orchestration',
            },
            {
              label: '06. 远程主机、热定制与自检',
              translations: { en: '06. Remote, Customization & QA' },
              slug: 'guide/06-remote-customization-and-qa',
            },
          ],
        },
        {
          label: '架构与实现原理',
          translations: { en: 'Architecture & Internals' },
          items: [
            {
              label: '双平面架构与实现原理',
              translations: { en: 'Dual-Plane Architecture' },
              slug: 'architecture/principles',
            },
            {
              label: 'Drove 编排引擎架构',
              translations: { en: 'Drove Architecture' },
              slug: 'architecture/drove',
            },
            {
              label: '上下文接力与会话血统',
              translations: { en: 'Context Handoff & Lineage' },
              slug: 'architecture/handoff-and-lineage',
            },
            {
              label: '使用指南与原版共存',
              translations: { en: 'Usage & Coexistence' },
              slug: 'architecture/usage-and-coexistence',
            },
          ],
        },
        {
          label: 'CLI 与运维参考',
          translations: { en: 'CLI & Reference' },
          items: [
            {
              label: 'h2 CLI 命令完整参考',
              translations: { en: 'CLI Commands' },
              slug: 'reference/commands',
            },
            {
              label: '远程主机联邦（Machines）',
              translations: { en: 'Machines' },
              slug: 'reference/machines',
            },
            {
              label: '智能体模板（Templates）',
              translations: { en: 'Agent Templates' },
              slug: 'reference/templates',
            },
            {
              label: '安全与信任模型（Security）',
              translations: { en: 'Security & Trust' },
              slug: 'reference/security',
            },
          ],
        },
      ],
    }),
  ],
});
