import { html, nothing } from "lit";
import { t, getCurrentLanguage, type Language } from "../i18n.js";


export type RemoteNode = {
  id: string;
  name: string;
  host: string;
  port: number;
  status: "online" | "offline" | "connecting";
  uptime?: string;
  memory?: string;
  cpu?: string;
  pid?: number;
  version?: string;
  lastSeen?: number;
};

export type ToolStatus = {
  name: string;
  label: string;
  enabled: boolean;
  description: string;
};

export type InfrastructureProps = {
  loading: boolean;
  localGateway: {
    connected: boolean;
    url: string;
    uptime?: string;
  };
  remoteNodes: RemoteNode[];
  tools: ToolStatus[];
  lastRefresh: number | null;
  onRefresh: () => void;
  onConnectNode: (nodeId: string) => void;
  onDisconnectNode: (nodeId: string) => void;
  onConnectRemote: (url: string) => void;
};

export function renderInfrastructure(props: InfrastructureProps) {
  const lang = getCurrentLanguage();

  return html`
    <div class="infrastructure-container">
          
      <!-- Status Grid -->
      <section class="grid grid-cols-2" style="gap: 18px;">
        <!-- Local Gateway -->
        <div class="card glass-card glass-card--static">
          <div class="row" style="justify-content: space-between; align-items: center;">
            <div class="card-title">Local Gateway</div>
            <span class="status-badge ${props.localGateway.connected ? 'online' : 'offline'}">
              ${props.localGateway.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div class="card-sub">${props.localGateway.url || 'Not configured'}</div>
          
          <div class="stat-grid" style="margin-top: 16px;">
            <div class="stat">
              <div class="stat-label">Status</div>
              <div class="stat-value ${props.localGateway.connected ? 'ok' : 'warn'}">
                ${props.localGateway.connected ? 'READY' : 'OFFLINE'}
              </div>
            </div>
            <div class="stat">
              <div class="stat-label">Uptime</div>
              <div class="stat-value">${props.localGateway.uptime || 'n/a'}</div>
            </div>
          </div>
        </div>

        <!-- Remote Nodes -->
        <div class="card glass-card glass-card--static">
          <div class="row" style="justify-content: space-between; align-items: center;">
            <div class="card-title">Remote Nodes</div>
            <button 
              class="btn btn-sm" 
              ?disabled=${props.loading}
              @click=${props.onRefresh}
            >
              ${props.loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <div class="card-sub">Manage connections to external gateways (e.g. Colab)</div>
          
          <!-- Connect Input -->
          <div class="row" style="margin-top: 12px; gap: 8px;">
            <input 
              type="text" 
              class="input input-sm" 
              placeholder="wss://... (Colab Ngrok URL)" 
              id="remote-url-input"
              style="flex: 1;"
            >
            <button 
              class="btn btn-sm btn-primary"
              @click=${() => {
      const input = document.getElementById('remote-url-input') as HTMLInputElement;
      if (input && input.value) {
        props.onConnectRemote(input.value);
        input.value = '';
      }
    }}
            >
              Connect
            </button>
          </div>

          <div class="list" style="margin-top: 16px; max-height: 200px; overflow-y: auto;">
            ${props.remoteNodes.length === 0
      ? html`<div class="muted">No remote nodes configured</div>`
      : props.remoteNodes.map(node => renderNodeItem(node, props))
    }
          </div>
        </div>
      </section>

      <!-- Human Emulation Tools Status -->
      <section class="card glass-card" style="margin-top: 18px;">
        <div class="card-title">Human Emulation Tools</div>
        <div class="card-sub">Browser automation and anti-detection capabilities</div>
        
        <div class="tools-grid" style="margin-top: 16px;">
          ${props.tools.map(tool => renderToolCard(tool))}
        </div>
      </section>

      <!-- Architecture Legend -->
      <section class="card" style="margin-top: 18px;">
        <div class="card-title">Architecture Notes</div>
        <div class="note-grid" style="margin-top: 14px;">
          <div>
            <div class="note-title">Local Development</div>
            <div class="muted">
              Your local machine runs VS Code / IDE for development. 
              The UI dev server (pnpm ui:dev) is optional.
            </div>
          </div>
          <div>
            <div class="note-title">Remote Gateway</div>
            <div class="muted">
              BuyVM server runs AeonSage Gateway 24/7 via PM2.
              Access via SSH for management only.
            </div>
          </div>
          <div>
            <div class="note-title">Resource Allocation</div>
            <div class="muted">
              AI inference, browser automation, and tools run on remote.
              Local resources not required for production.
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}



function renderNodeItem(node: RemoteNode, props: InfrastructureProps) {
  const statusColor = {
    online: 'ok',
    offline: 'warn',
    connecting: 'accent'
  }[node.status];

  return html`
    <div class="list-item node-item">
      <div class="list-main">
        <div class="list-title">
          <span class="status-dot ${node.status}"></span>
          ${node.name}
        </div>
        <div class="list-sub">${node.host}:${node.port}</div>
        <div class="chip-row">
          ${node.pid ? html`<span class="chip">PID: ${node.pid}</span>` : nothing}
          ${node.memory ? html`<span class="chip">Mem: ${node.memory}</span>` : nothing}
          ${node.version ? html`<span class="chip">v${node.version}</span>` : nothing}
        </div>
      </div>
      <div class="list-meta">
        <div class="stat-value ${statusColor}">${node.status.toUpperCase()}</div>
        ${node.uptime ? html`<div class="muted">Up: ${node.uptime}</div>` : nothing}
      </div>
    </div>
  `;
}

function renderToolCard(tool: ToolStatus) {
  return html`
    <div class="tool-card ${tool.enabled ? 'enabled' : 'disabled'}">
      <div class="tool-header">
        <span class="tool-name">${tool.label}</span>
        <span class="tool-status ${tool.enabled ? 'ok' : 'muted'}">
          ${tool.enabled ? '✓ Ready' : '○ Disabled'}
        </span>
      </div>
      <div class="tool-description muted">${tool.description}</div>
    </div>
  `;
}
