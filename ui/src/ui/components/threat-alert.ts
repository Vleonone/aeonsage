
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { icon } from "../icons.js";

// Type shim for ThreatReport if not available in frontend scope yet
// Ideally importing from shared types, but for UI self-containment we define shape here matching backend
export interface ThreatMatch {
    patternId: string;
    level: "low" | "medium" | "high" | "critical";
    description: string;
    snippet: string;
}

export interface ThreatReport {
    detected: boolean;
    maxLevel: "low" | "medium" | "high" | "critical";
    matches: ThreatMatch[];
    score: number;
}

@customElement("threat-alert")
export class ThreatAlert extends LitElement {
    @property({ type: Object }) report: ThreatReport | undefined;

    static styles = css`
        :host {
            display: block;
            margin: 16px 0;
        }

        .alert {
            border-radius: 8px;
            padding: 16px;
            position: relative;
            animation: pulse-border 2s infinite;
        }

        .alert.low {
            background: rgba(52, 152, 219, 0.1);
            border: 1px solid rgba(52, 152, 219, 0.3);
            color: #3498db;
        }
        
        .alert.medium {
            background: rgba(241, 196, 15, 0.1);
            border: 1px solid rgba(241, 196, 15, 0.3);
            color: #f1c40f;
        }
        
        .alert.high {
            background: rgba(231, 76, 60, 0.1);
            border: 1px solid rgba(231, 76, 60, 0.5);
            color: #e74c3c;
            /* animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; */
        }
        
        .alert.critical {
            background: rgba(231, 76, 60, 0.15);
            border: 1px solid #e74c3c;
            color: #e74c3c;
            box-shadow: 0 0 15px rgba(231, 76, 60, 0.2);
            animation: pulse-red 1.5s infinite;
        }

        @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
            100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
        }

        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .title {
            font-weight: 700;
            font-size: 16px;
            letter-spacing: 0.02em;
            text-transform: uppercase;
        }

        .matches {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .match-item {
            background: rgba(0, 0, 0, 0.2);
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
        }

        .match-desc {
            font-weight: 600;
            margin-bottom: 4px;
        }

        .snippet {
            font-family: monospace;
            background: #000;
            padding: 4px 8px;
            border-radius: 4px;
            color: #ecf0f1;
            font-size: 11px;
            overflow-x: auto;
            white-space: pre-wrap;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .action-needed {
            margin-top: 12px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            background: rgba(0,0,0,0.2);
            padding: 6px;
            border-radius: 4px;
        }
    `;

    render() {
        if (!this.report || !this.report.detected) {
            return html``;
        }

        const level = this.report.maxLevel;
        let iconName = "alert-circle"; // default
        let title = "Security Notice";

        switch (level) {
            case "critical":
                iconName = "shield-off";
                title = "CRITICAL THREAT DETECTED";
                break;
            case "high":
                iconName = "alert-triangle";
                title = "High Risk Activity";
                break;
            case "medium":
                title = "Suspicious Pattern";
                break;
        }

        return html`
            <div class="alert ${level}">
                <div class="header">
                    <div style="width:24px;height:24px">${icon(iconName as any)}</div>
                    <div class="title">${title}</div>
                </div>
                
                <div class="matches">
                    ${this.report.matches.map(m => html`
                        <div class="match-item">
                            <div class="match-desc">${m.description}</div>
                            ${m.snippet ? html`<div class="snippet">${m.snippet}</div>` : ''}
                        </div>
                    `)}
                </div>

                ${level === 'critical' || level === 'high' ? html`
                    <div class="action-needed">
                        RECOMMENDED ACTION: BLOCK OPERATION
                    </div>
                ` : ''}
            </div>
        `;
    }
}
