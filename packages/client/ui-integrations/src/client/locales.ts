/** Locale-owned Integrations Hub copy. */
export const zh = {
  'type.label': '能力集成中心',
  'guide.title': '能力集成中心',
  'guide.description': '监控、探索与交互 140 项生活管理、电商及创意能力套件',
  'search.placeholder': '搜索 140 项集成能力与工具…',
  'domain.all': '全部',
  'domain.life': '生活管理',
  'domain.commerce': '电商与套利',
  'domain.finance': '资产与金融',
  'domain.devops': '企业研发运维',
  'domain.marketing': '增长与营销',
  'domain.ai': 'AI 与数据底座',
  'domain.creative': '创意与艺术',
  'status.active': '已就绪',
  'status.configured': '需配置',
  'status.ready': '可用',
  'action.runPrompt': '在对话中触发',
  'action.copied': '已复制提示词！',
  'env.required': '所需环境配置',
  'empty.noResults': '未找到匹配的集成能力',
  'header.summary': '140 项全栈能力已接入',
} satisfies Record<string, string>

/** Integrations dictionary key union. */
export type SidebarIntegrationsKey = keyof typeof zh

/** English dictionary with matching keys. */
export const en = {
  'type.label': 'Integrations Hub',
  'guide.title': 'Integrations Hub',
  'guide.description': 'Monitor, explore, and interact with the 140 life management, commerce, and creative capabilities',
  'search.placeholder': 'Search 140 integrations & tools…',
  'domain.all': 'All',
  'domain.life': 'Life Management',
  'domain.commerce': 'E-Commerce',
  'domain.finance': 'Financial Autonomy',
  'domain.devops': 'Enterprise DevOps',
  'domain.marketing': 'Growth Marketing',
  'domain.ai': 'AI & Data Infra',
  'domain.creative': 'Creative Suite',
  'status.active': 'Active',
  'status.configured': 'Needs Token',
  'status.ready': 'Ready',
  'action.runPrompt': 'Trigger in Chat',
  'action.copied': 'Prompt copied!',
  'env.required': 'Requires Env',
  'empty.noResults': 'No matching capabilities found',
  'header.summary': '140 Full-Stack Capabilities Integrated',
} satisfies Record<SidebarIntegrationsKey, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Sidebar Integrations Hub copy. */
    sidebarIntegrations: SidebarIntegrationsKey
  }
}
