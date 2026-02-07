/**
 * ProFeatureGate - UI component for gating Pro features in Open Source
 * 
 * Shows preview/upgrade prompt for Pro features in open source edition
 */

import { html } from "lit";

export type LicenseTier = 'open-source' | 'pro-personal' | 'pro-enterprise';

export interface LicenseState {
  tier: LicenseTier;
  isTrial: boolean;
  trialDaysLeft: number;
  features: string[];
}

// Feature requirements mapping
const FEATURE_REQUIREMENTS: Record<string, LicenseTier> = {
  'multi-worker': 'pro-personal',
  'workflow-canvas': 'pro-personal',
  'parallel-execution': 'pro-personal',
  'feishu-channel': 'pro-personal',
  'line-channel': 'pro-personal',
  'advanced-analytics': 'pro-personal',
  'vdid-identity': 'pro-enterprise',
  'saml-sso': 'pro-enterprise',
  'on-premise': 'pro-enterprise',
  'custom-connectors': 'pro-enterprise',
  'compliance-reports': 'pro-enterprise',
};

const TIER_LEVEL: Record<LicenseTier, number> = {
  'open-source': 0,
  'pro-personal': 1,
  'pro-enterprise': 2,
};

/**
 * Check if current license can use a feature
 */
export function canUseFeature(feature: string, license: LicenseState): boolean {
  const required = FEATURE_REQUIREMENTS[feature];
  if (!required) return true;
  return TIER_LEVEL[license.tier] >= TIER_LEVEL[required];
}

/**
 * Get feature display info
 */
export function getFeatureInfo(feature: string): {
  name: string;
  description: string;
  benefit: string;
  previewImage?: string;
} {
  const info: Record<string, ReturnType<typeof getFeatureInfo>> = {
    'multi-worker': {
      name: 'Multi-Worker Parallel Mode',
      description: 'Your AI CEO can spawn multiple workers to complete tasks in parallel',
      benefit: 'Complete tasks 3x faster with parallel execution',
    },
    'workflow-canvas': {
      name: 'Workflow Canvas',
      description: 'Visual supervision of your AI agency in real-time',
      benefit: 'Watch your agents work with live node visualization',
    },
    'parallel-execution': {
      name: 'Parallel Execution',
      description: 'Execute multiple subtasks simultaneously',
      benefit: 'Reduce task completion time by 60-80%',
    },
    'feishu-channel': {
      name: 'Feishu/Lark Integration',
      description: 'Enterprise-native connector for Asian markets',
      benefit: 'Connect with China enterprise users',
    },
    'vdid-identity': {
      name: 'VDID Identity Verification',
      description: 'Blockchain-verified agent identity',
      benefit: 'Non-repudiable agent actions for compliance',
    },
  };
  
  return info[feature] || {
    name: 'Pro Feature',
    description: 'This feature is available in Pro',
    benefit: 'Upgrade to unlock',
  };
}

/**
 * Render upgrade banner for open source users
 */
export function renderUpgradeBanner() {
  return html`
    <div class="upgrade-banner" style="
      background: linear-gradient(135deg, rgba(0,161,0,0.1) 0%, rgba(255,69,0,0.1) 100%);
      border: 1px solid var(--color-accent, #00a100);
      border-radius: 12px;
      padding: 16px 20px;
      margin: 16px 0;
    ">
      <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        <div style="font-size: 24px;">⚡</div>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-weight: 600; color: var(--text-primary);">
            Unlock Parallel Processing with Pro
          </div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
            Complete tasks 3x faster • Visual Workflow Canvas • 100k tokens/day
          </div>
        </div>
        <a href="https://pro.aeonsage.org" target="_blank" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--color-accent, #00a100);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          white-space: nowrap;
        " onclick="event.stopPropagation();">
          Try Pro Free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7M17 7H7M17 7V17"/>
          </svg>
        </a>
      </div>
    </div>
  `;
}

/**
 * Render locked feature preview
 */
export function renderLockedFeature(feature: string, onUpgrade?: () => void) {
  const info = getFeatureInfo(feature);
  
  return html`
    <div class="locked-feature" style="
      background: var(--bg-secondary, #1a1a1a);
      border: 1px dashed var(--border-color, #333);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
      <h3 style="margin: 0 0 8px 0; color: var(--text-primary);">${info.name}</h3>
      <p style="margin: 0 0 8px 0; color: var(--text-secondary);">${info.description}</p>
      <p style="margin: 0 0 24px 0; color: var(--color-accent, #00a100); font-weight: 500;">
        ✨ ${info.benefit}
      </p>
      
      <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
        <a href="https://pro.aeonsage.org" target="_blank" style="
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--color-accent, #00a100);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
        ">
          Start Free Trial
          <span style="font-size: 12px; opacity: 0.9;">(7 days)</span>
        </a>
        <button @click=${() => {}} style="
          padding: 12px 24px;
          background: transparent;
          border: 1px solid var(--border-color, #333);
          border-radius: 8px;
          color: var(--text-secondary);
          cursor: pointer;
        ">
          Watch Demo
        </button>
      </div>
      
      <p style="margin: 16px 0 0 0; font-size: 12px; color: var(--text-tertiary);">
        $19/month after trial • Cancel anytime
      </p>
    </div>
  `;
}

/**
 * Render security warning for self-hosted deployment
 */
export function renderSecurityWarning() {
  return html`
    <div class="security-warning" style="
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 12px;
      padding: 20px;
      margin: 16px 0;
    ">
      <div style="display: flex; gap: 16px; align-items: flex-start;">
        <div style="font-size: 24px; flex-shrink: 0;">⚠️</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; color: #ffc107; margin-bottom: 8px;">
            Self-Hosted Deployment Detected
          </div>
          <div style="color: var(--text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 16px;">
            You're running AeonSage Open Source locally. For production use with sensitive data,
            we <strong>strongly recommend</strong> Pro Cloud deployment:
            
            <ul style="margin: 12px 0; padding-left: 20px;">
              <li>Automatic security updates</li>
              <li>Managed SSL certificates & DDoS protection</li>
              <li>24/7 monitoring & automated backups</li>
              <li>Compliance-ready infrastructure</li>
            </ul>
          </div>
          
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="https://pro.aeonsage.org/deploy" target="_blank" style="
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              background: #ffc107;
              color: #000;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 500;
              font-size: 14px;
            ">
              Deploy to Cloud (One-Click)
            </a>
            <button @click=${() => {}} style="
              padding: 10px 20px;
              background: transparent;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              color: var(--text-secondary);
              cursor: pointer;
              font-size: 14px;
            ">
              I'll take the risk
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Main ProFeatureGate component
 */
export function ProFeatureGate(
  feature: string,
  license: LicenseState,
  content: unknown,
  options?: {
    showPreview?: boolean;
    onUpgrade?: () => void;
  }
) {
  const canUse = canUseFeature(feature, license);
  
  if (canUse) {
    return content;
  }
  
  if (options?.showPreview) {
    return renderLockedFeature(feature, options.onUpgrade);
  }
  
  // Return nothing or minimal placeholder
  return html``;
}

export default {
  canUseFeature,
  getFeatureInfo,
  renderUpgradeBanner,
  renderLockedFeature,
  renderSecurityWarning,
  ProFeatureGate,
};
