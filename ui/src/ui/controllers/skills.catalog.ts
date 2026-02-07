/**
 * Skills Catalog Controller
 * Extended controller for skill catalog with categories and personas
 */

import type { GatewayBrowserClient } from "../gateway";
import type { SkillStatusReport } from "../types";
import type { SkillMessage, SkillMessageMap } from "./skills";
import { loadSkills, updateSkillEnabled as baseUpdateSkillEnabled, saveSkillApiKey, installSkill } from "./skills";
import { PERSONAS, type Persona } from "../views/skills.personas";

/** Extended state for skill catalog */
export type SkillsCatalogState = {
    client: GatewayBrowserClient | null;
    connected: boolean;

    // Base skills state
    skillsLoading: boolean;
    skillsReport: SkillStatusReport | null;
    skillsError: string | null;
    skillsBusyKey: string | null;
    skillEdits: Record<string, string>;
    skillMessages: SkillMessageMap;

    // Catalog extensions
    skillFilter: string;
    selectedCategory: string | null;
    selectedPersona: string | null;
    viewMode: 'grid' | 'list';

    // Persona state
    activePersona: Persona | null;
    personaSkillsEnabled: string[];  // Track skills enabled by persona
};

/** Create initial catalog state */
export function createCatalogState(): Pick<
    SkillsCatalogState,
    | 'skillsLoading'
    | 'skillsReport'
    | 'skillsError'
    | 'skillsBusyKey'
    | 'skillEdits'
    | 'skillMessages'
    | 'skillFilter'
    | 'selectedCategory'
    | 'selectedPersona'
    | 'viewMode'
    | 'activePersona'
    | 'personaSkillsEnabled'
> {
    return {
        skillsLoading: false,
        skillsReport: null,
        skillsError: null,
        skillsBusyKey: null,
        skillEdits: {},
        skillMessages: {},
        skillFilter: '',
        selectedCategory: null,
        selectedPersona: null,
        viewMode: 'grid',
        activePersona: null,
        personaSkillsEnabled: [],
    };
}

/** Update skill filter */
export function updateSkillFilter(state: SkillsCatalogState, filter: string) {
    state.skillFilter = filter;
}

/** Select category */
export function selectCategory(state: SkillsCatalogState, categoryId: string | null) {
    state.selectedCategory = categoryId;
}

/** Select persona (preview) */
export function selectPersona(state: SkillsCatalogState, personaId: string | null) {
    state.selectedPersona = personaId;
}

/** Change view mode */
export function changeViewMode(state: SkillsCatalogState, mode: 'grid' | 'list') {
    state.viewMode = mode;
}

/** Apply a persona - enable all its skills */
export async function applyPersona(state: SkillsCatalogState, persona: Persona) {
    if (!state.client || !state.connected || !state.skillsReport) return;

    state.skillsBusyKey = `persona:${persona.id}`;
    state.skillsError = null;

    try {
        // Get all skill keys that match persona's skill list
        const skills = state.skillsReport.skills;
        const skillsToEnable: string[] = [];

        for (const skill of skills) {
            const nameL = skill.name.toLowerCase();
            for (const pSkill of persona.skills) {
                if (nameL.includes(pSkill.toLowerCase()) || pSkill.toLowerCase().includes(nameL)) {
                    if (skill.disabled) {
                        skillsToEnable.push(skill.skillKey);
                    }
                    break;
                }
            }
        }

        // Enable each skill
        for (const skillKey of skillsToEnable) {
            await state.client.request("skills.update", { skillKey, enabled: true });
        }

        // Reload skills
        await loadSkills(state);

        // Store active persona
        state.activePersona = persona;
        state.personaSkillsEnabled = skillsToEnable;
        state.selectedPersona = null;

        // Show success message
        console.log(`[Persona] Applied "${persona.name}" - enabled ${skillsToEnable.length} skills`);

    } catch (err) {
        state.skillsError = err instanceof Error ? err.message : String(err);
    } finally {
        state.skillsBusyKey = null;
    }
}

/** Clear active persona */
export function clearPersona(state: SkillsCatalogState) {
    state.activePersona = null;
    state.personaSkillsEnabled = [];
}

/** Get persona suggestion based on current context */
export function suggestPersona(context: { task?: string; channel?: string }): Persona | null {
    const text = `${context.task || ''} ${context.channel || ''}`.toLowerCase();

    // Simple keyword matching for suggestions
    const suggestions: { persona: Persona; score: number }[] = [];

    for (const persona of PERSONAS) {
        let score = 0;

        // Check traits and skills for matches
        for (const skill of persona.skills) {
            if (text.includes(skill)) score += 2;
        }
        for (const trait of persona.traits) {
            if (text.includes(trait.toLowerCase())) score += 1;
        }

        // Check persona name
        if (text.includes(persona.id)) score += 3;

        if (score > 0) {
            suggestions.push({ persona, score });
        }
    }

    // Return highest scoring persona
    suggestions.sort((a, b) => b.score - a.score);
    return suggestions[0]?.persona || null;
}

/** Export skill catalog actions for use in UI */
export const catalogActions = {
    loadSkills,
    updateSkillFilter,
    selectCategory,
    selectPersona,
    changeViewMode,
    applyPersona,
    clearPersona,
    suggestPersona,
    updateSkillEnabled: baseUpdateSkillEnabled,
    saveSkillApiKey,
    installSkill,
};
