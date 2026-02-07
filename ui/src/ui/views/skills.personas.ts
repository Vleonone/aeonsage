/**
 * Persona and Category Definitions with SVG Icons
 * Uses Feather-style SVG icons matching the project design system
 */

import { html, type TemplateResult } from "lit";

// ============================================================================
// SVG Icons (Feather-style)
// ============================================================================

export const ICONS = {
    // Personas
    developer: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    researcher: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    trader: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`,
    devops: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg>`,
    writer: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`,
    assistant: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
    security: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    data: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,

    // Categories
    brain: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"></path><circle cx="8" cy="14" r="1"></circle><circle cx="16" cy="14" r="1"></circle></svg>`,
    code: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
    globe: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    cloud: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>`,
    search: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
    dollarSign: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
    image: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    clipboard: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
    shield: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    terminal: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
    package: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
    user: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    grid: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
    list: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    star: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
    refresh: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
    check: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    x: html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
};

// ============================================================================
// Persona Definitions
// ============================================================================

export interface Persona {
    id: string;
    name: string;
    icon: TemplateResult;
    description: string;
    traits: string[];
    skills: string[];
    systemPromptHint: string;
}

export const PERSONAS: Persona[] = [
    {
        id: 'developer',
        name: 'Full-Stack Developer',
        icon: ICONS.developer,
        description: 'Expert in coding, debugging, and building applications',
        traits: ['Technical', 'Problem-solver', 'Detail-oriented'],
        skills: ['coding-agent', 'github', 'docker-essentials', 'git', 'terminal', 'web-dev', 'database', 'api'],
        systemPromptHint: 'You are an expert full-stack developer. Focus on clean code, best practices, and efficient solutions.'
    },
    {
        id: 'researcher',
        name: 'Research Analyst',
        icon: ICONS.researcher,
        description: 'Deep research, analysis, and comprehensive reporting',
        traits: ['Analytical', 'Curious', 'Thorough'],
        skills: ['web-search', 'research', 'browse', 'perplexity', 'document-analysis', 'summarize', 'translate'],
        systemPromptHint: 'You are a meticulous research analyst. Always cite sources and provide comprehensive analysis.'
    },
    {
        id: 'trader',
        name: 'Crypto Trader',
        icon: ICONS.trader,
        description: 'Market analysis, trading signals, and portfolio management',
        traits: ['Risk-aware', 'Data-driven', 'Decisive'],
        skills: ['crypto-price', 'yahoo-finance', 'chain-analysis', 'trading-signals', 'portfolio', 'news-aggregator'],
        systemPromptHint: 'You are a professional crypto trader. Analyze market trends and provide data-backed trading insights.'
    },
    {
        id: 'devops',
        name: 'DevOps Engineer',
        icon: ICONS.devops,
        description: 'Infrastructure, deployment, and system reliability',
        traits: ['Systematic', 'Automation-focused', 'Reliable'],
        skills: ['docker-essentials', 'kubernetes', 'aws-infra', 'ssh', 'terraform', 'ci-cd', 'monitoring', 'health-check'],
        systemPromptHint: 'You are an experienced DevOps engineer. Focus on automation, reliability, and infrastructure as code.'
    },
    {
        id: 'writer',
        name: 'Content Creator',
        icon: ICONS.writer,
        description: 'Writing, content creation, and creative expression',
        traits: ['Creative', 'Articulate', 'Engaging'],
        skills: ['writing', 'seo', 'social-media', 'image-generation', 'translate', 'summarize', 'tts'],
        systemPromptHint: 'You are a creative content creator. Write engaging, well-structured content with a unique voice.'
    },
    {
        id: 'assistant',
        name: 'Executive Assistant',
        icon: ICONS.assistant,
        description: 'Scheduling, emails, and productivity management',
        traits: ['Organized', 'Proactive', 'Professional'],
        skills: ['email', 'calendar', 'reminder', 'task-manager', 'meeting-notes', 'weather', 'translate'],
        systemPromptHint: 'You are a highly efficient executive assistant. Stay organized and anticipate needs proactively.'
    },
    {
        id: 'security',
        name: 'Security Specialist',
        icon: ICONS.security,
        description: 'Cybersecurity, auditing, and vulnerability assessment',
        traits: ['Vigilant', 'Methodical', 'Paranoid'],
        skills: ['security-audit', 'password-gen', 'encryption', 'vulnerability-scan', 'osint', 'log-analyzer'],
        systemPromptHint: 'You are a cybersecurity specialist. Always prioritize security and identify potential vulnerabilities.'
    },
    {
        id: 'data',
        name: 'Data Scientist',
        icon: ICONS.data,
        description: 'Data analysis, visualization, and machine learning',
        traits: ['Quantitative', 'Logical', 'Insightful'],
        skills: ['python', 'data-analysis', 'visualization', 'database', 'statistics', 'ml-models', 'jupyter'],
        systemPromptHint: 'You are a data scientist. Extract insights from data and communicate findings clearly.'
    },
];

// ============================================================================
// Category Definitions
// ============================================================================

export interface SkillCategory {
    id: string;
    name: string;
    icon: TemplateResult;
    description: string;
    keywords: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        id: 'ai-agents',
        name: 'AI & Agents',
        icon: ICONS.brain,
        description: 'AI models, agents, and intelligent automation',
        keywords: ['agent', 'llm', 'ai', 'gpt', 'claude', 'openai', 'gemini', 'memory']
    },
    {
        id: 'coding',
        name: 'Development',
        icon: ICONS.code,
        description: 'Coding, IDEs, and development tools',
        keywords: ['code', 'coding', 'dev', 'ide', 'git', 'github', 'python', 'javascript', 'typescript']
    },
    {
        id: 'browser',
        name: 'Browser & Web',
        icon: ICONS.globe,
        description: 'Web browsing, scraping, and automation',
        keywords: ['browser', 'web', 'scrape', 'selenium', 'puppeteer', 'playwright']
    },
    {
        id: 'devops',
        name: 'DevOps & Cloud',
        icon: ICONS.cloud,
        description: 'Infrastructure, containers, and deployment',
        keywords: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ci', 'cd', 'deploy']
    },
    {
        id: 'search',
        name: 'Search & Research',
        icon: ICONS.search,
        description: 'Web search, research, and information gathering',
        keywords: ['search', 'research', 'perplexity', 'brave', 'google', 'bing']
    },
    {
        id: 'finance',
        name: 'Finance & Trading',
        icon: ICONS.dollarSign,
        description: 'Crypto, stocks, and financial data',
        keywords: ['crypto', 'bitcoin', 'trading', 'finance', 'stock', 'price', 'market']
    },
    {
        id: 'media',
        name: 'Media & Creative',
        icon: ICONS.image,
        description: 'Images, video, audio, and content creation',
        keywords: ['image', 'video', 'audio', 'voice', 'tts', 'generation', 'dalle', 'midjourney']
    },
    {
        id: 'productivity',
        name: 'Productivity',
        icon: ICONS.clipboard,
        description: 'Email, calendar, and task management',
        keywords: ['email', 'calendar', 'task', 'reminder', 'notion', 'slack', 'discord']
    },
    {
        id: 'security',
        name: 'Security',
        icon: ICONS.shield,
        description: 'Security tools and password management',
        keywords: ['security', 'password', 'encrypt', 'hash', 'audit', 'vuln']
    },
    {
        id: 'cli',
        name: 'CLI & System',
        icon: ICONS.terminal,
        description: 'Terminal commands and system utilities',
        keywords: ['cli', 'terminal', 'shell', 'bash', 'system', 'ssh', 'file']
    },
    {
        id: 'other',
        name: 'Other',
        icon: ICONS.package,
        description: 'Miscellaneous tools and utilities',
        keywords: []
    }
];

// ============================================================================
// Utility Functions
// ============================================================================

/** Auto-categorize a skill based on its metadata */
export function categorizeSkill(skill: { name: string; description: string }): string {
    const text = `${skill.name} ${skill.description}`.toLowerCase();

    for (const category of SKILL_CATEGORIES) {
        if (category.id === 'other') continue;
        for (const keyword of category.keywords) {
            if (text.includes(keyword)) {
                return category.id;
            }
        }
    }

    return 'other';
}

/** Get persona by ID */
export function getPersonaById(id: string): Persona | undefined {
    return PERSONAS.find(p => p.id === id);
}

/** Get category by ID */
export function getCategoryById(id: string): SkillCategory | undefined {
    return SKILL_CATEGORIES.find(c => c.id === id);
}
