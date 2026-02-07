import { html } from "lit";
import { type OverviewProps, renderOverview } from "./overview.js";
import { type UsageState } from "../controllers/usage.js";
import { renderUsageView } from "./usage.js";
import { type InstancesProps, renderInstances } from "./instances.js";
import { type InfrastructureProps, renderInfrastructure } from "./infrastructure.js";
import { t, getCurrentLanguage } from "../i18n.js";

export type DashboardSubTab = "overview" | "usage" | "instances" | "infrastructure";

export type DashboardProps = {
  overview: OverviewProps;
  usage: UsageState;
  instances: InstancesProps;
  infrastructure: InfrastructureProps;
  subTab: DashboardSubTab;
  onSubTabChange: (tab: DashboardSubTab) => void;
  // Hook for "Setup Wizard" card action
  onSetupWizard?: () => void;
};

export function renderDashboard(props: DashboardProps) {
  const lang = getCurrentLanguage();
  const texts = t(lang);

  return html`
    <div class="dashboard-container dashboard-bg">
      
      <!-- Top Sub-Navigation -->
      <div class="sub-nav glass-floating">
        <button 
          class="sub-nav-item ${props.subTab === 'overview' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('overview')}
        >
          ${texts.nav.overview}
        </button>
        <button 
          class="sub-nav-item ${props.subTab === 'usage' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('usage')}
        >
          ${texts.nav.usage}
        </button>
        <button 
          class="sub-nav-item ${props.subTab === 'instances' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('instances')}
        >
          ${texts.nav.instances}
        </button>
        <button 
          class="sub-nav-item ${props.subTab === 'infrastructure' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('infrastructure')}
        >
          ${lang === 'zh-CN' ? '基础设施' : 'Infrastructure'}
        </button>
      </div>

      <!-- Quick Access / Setup Wizard Card (Shown on Overview only or always?) -->
      <!-- We will implement the specific Setup Wizard card later, for now placeholder -->

      <div class="dashboard-content" style="margin-top: 20px;">
        ${props.subTab === 'overview' ? renderOverview(props.overview) : ''}
        ${props.subTab === 'usage' ? renderUsageView(props.usage) : ''}
        ${props.subTab === 'instances' ? renderInstances(props.instances) : ''}
        ${props.subTab === 'infrastructure' ? renderInfrastructure(props.infrastructure) : ''}
      </div>
    </div>
  `;
}
