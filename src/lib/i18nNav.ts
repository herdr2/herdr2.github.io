export interface BilingualNavItem {
  label: { 'zh-CN': string; en: string };
  link: string;
  external?: boolean;
}

export const BILINGUAL_NAV_LINKS: BilingualNavItem[] = [
  {
    label: { 'zh-CN': '安装指南', en: 'Install' },
    link: '/guide/install/',
  },
  {
    label: { 'zh-CN': '使用手册', en: 'User Guide' },
    link: '/guide/',
  },
  {
    label: { 'zh-CN': '架构原理', en: 'Architecture' },
    link: '/architecture/principles/',
  },
  {
    label: { 'zh-CN': 'Drove 编排', en: 'Drove' },
    link: '/guide/05-drove-orchestration/',
  },
  {
    label: { 'zh-CN': 'CLI 参考', en: 'CLI Reference' },
    link: '/reference/commands/',
  },
  {
    label: { 'zh-CN': 'GitHub', en: 'GitHub' },
    link: 'https://github.com/herdr2/herdr2',
    external: true,
  },
];

export function resolveLocale(locale: string | undefined, pathname: string): 'zh-CN' | 'en' {
  if (locale === 'en' || pathname === '/en' || pathname.startsWith('/en/')) {
    return 'en';
  }
  return 'zh-CN';
}

export function resolveNavLinks(locale: 'zh-CN' | 'en') {
  const prefix = locale === 'en' ? '/en' : '';
  return BILINGUAL_NAV_LINKS.map((item) => ({
    label: item.label[locale],
    href: item.external ? item.link : `${prefix}${item.link}`,
    attrs: item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {},
  }));
}

export function getFooterHtml(locale: 'zh-CN' | 'en'): string {
  if (locale === 'en') {
    return 'Herdr2 is licensed under <a href="https://github.com/herdr2/herdr2/blob/main/herdr-core/LICENSE">Apache-2.0</a> · Inspired by <a href="https://github.com/herdrdev/herdr-app">Herdr</a> · Source on <a href="https://github.com/herdr2/herdr2">GitHub</a>.';
  }
  return 'Herdr2 遵循 <a href="https://github.com/herdr2/herdr2/blob/main/herdr-core/LICENSE">Apache-2.0</a> 开源许可证 · 特别鸣谢原版 <a href="https://github.com/herdrdev/herdr-app">Herdr</a> · 源码托管于 <a href="https://github.com/herdr2/herdr2">GitHub</a>。';
}
