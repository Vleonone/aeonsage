import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type SquidMood = 'happy' | 'working' | 'disconnected' | 'error';

@customElement('squid-mascot')
export class SquidMascot extends LitElement {
  @property({ type: String }) mood: SquidMood = 'happy';
  @property({ type: Boolean }) connected = false;
  @property({ type: Boolean }) working = false;
  @property({ type: String }) error: string | null = null;

  static styles = css`
    :host {
      display: inline-block;
      width: 36px;
      height: 36px;
    }
    
    svg {
      width: 100%;
      height: 100%;
      /* 无发光效果 - 克制设计 */
    }
  `;

  private getMood(): SquidMood {
    if (this.error) return 'error';
    if (!this.connected) return 'disconnected';
    if (this.working) return 'working';
    return 'happy';
  }

  private renderFace() {
    const mood = this.getMood();
    
    switch (mood) {
      case 'happy':
        return html`
          <!-- 左眼睛 -->
          <ellipse cx="32" cy="42" rx="7" ry="8" fill="#1A3A1A"/>
          <circle cx="34" cy="40" r="2.5" fill="#FFFFFF"/>
          <!-- 右眼睛 -->
          <ellipse cx="68" cy="42" rx="7" ry="8" fill="#1A3A1A"/>
          <circle cx="70" cy="40" r="2.5" fill="#FFFFFF"/>
          <!-- 微笑 -->
          <path d="M42,60 Q50,68 58,60" stroke="#1A3A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        `;
      
      case 'working':
        return html`
          <!-- 左眼睛 -->
          <ellipse cx="32" cy="42" rx="6" ry="7" fill="#1A3A1A"/>
          <circle cx="33" cy="41" r="2" fill="#FFFFFF"/>
          <!-- 右眼睛 -->
          <ellipse cx="68" cy="42" rx="6" ry="7" fill="#1A3A1A"/>
          <circle cx="69" cy="41" r="2" fill="#FFFFFF"/>
          <!-- 小嘴 -->
          <ellipse cx="50" cy="62" rx="3" ry="4" fill="#1A3A1A"/>
        `;
      
      case 'disconnected':
        return html`
          <!-- 左眼睛 -->
          <ellipse cx="32" cy="42" rx="7" ry="8" fill="#1A3A1A"/>
          <circle cx="34" cy="40" r="2.5" fill="#FFFFFF"/>
          <!-- 右眼睛 -->
          <ellipse cx="68" cy="42" rx="7" ry="8" fill="#1A3A1A"/>
          <circle cx="70" cy="40" r="2.5" fill="#FFFFFF"/>
          <!-- 悲伤嘴 -->
          <path d="M42,66 Q50,60 58,66" stroke="#1A3A1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <!-- 眼泪 -->
          <circle cx="25" cy="50" r="2" fill="#5DADE2" opacity="0.8">
            <animate attributeName="cy" values="50;58;50" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite"/>
          </circle>
        `;
      
      case 'error':
        return html`
          <!-- 左X眼睛 -->
          <line x1="26" y1="38" x2="38" y2="46" stroke="#1A3A1A" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="38" y1="38" x2="26" y2="46" stroke="#1A3A1A" stroke-width="2.5" stroke-linecap="round"/>
          <!-- 右X眼睛 -->
          <line x1="62" y1="38" x2="74" y2="46" stroke="#1A3A1A" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="74" y1="38" x2="62" y2="46" stroke="#1A3A1A" stroke-width="2.5" stroke-linecap="round"/>
          <!-- 波浪嘴 -->
          <path d="M44,64 L47,61 L50,64 L53,61 L56,64" stroke="#1A3A1A" stroke-width="2" fill="none" stroke-linecap="round"/>
        `;
      
      default:
        return html``;
    }
  }

  render() {
    const mood = this.getMood();
    const isHappy = mood === 'happy';
    const isWorking = mood === 'working';
    
    return html`
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bodyGrad" cx="35%" cy="25%" r="75%">
            <stop offset="0%" style="stop-color:#9ACD32;stop-opacity:1"/>
            <stop offset="30%" style="stop-color:#7CFC00;stop-opacity:1"/>
            <stop offset="60%" style="stop-color:#32CD32;stop-opacity:1"/>
            <stop offset="100%" style="stop-color:#006400;stop-opacity:1"/>
          </radialGradient>
          <!-- 身体高光 - 无发光效果 -->
          <radialGradient id="highlightGrad" cx="40%" cy="20%" r="35%">
            <stop offset="0%" style="stop-color:#CCFF90;stop-opacity:0.6"/>
            <stop offset="100%" style="stop-color:#7CFC00;stop-opacity:0"/>
          </radialGradient>
          <linearGradient id="tentacleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#32CD32;stop-opacity:0.9"/>
            <stop offset="50%" style="stop-color:#228B22;stop-opacity:0.8"/>
            <stop offset="100%" style="stop-color:#006400;stop-opacity:0.6"/>
          </linearGradient>
        </defs>
        
        <!-- 触手后层 -->
        <g opacity="0.5">
          <path d="M28,68 Q18,78 12,88 Q8,95 15,92 Q22,88 28,78 Q32,72 35,65" fill="url(#tentacleGrad)">
            <animate attributeName="d" values="M28,68 Q18,78 12,88 Q8,95 15,92 Q22,88 28,78 Q32,72 35,65;M28,68 Q15,80 10,92 Q6,98 14,95 Q22,90 27,80 Q32,73 35,65;M28,68 Q18,78 12,88 Q8,95 15,92 Q22,88 28,78 Q32,72 35,65" dur="${isWorking ? '2s' : '3s'}" repeatCount="indefinite"/>
          </path>
          <path d="M72,68 Q82,78 88,88 Q92,95 85,92 Q78,88 72,78 Q68,72 65,65" fill="url(#tentacleGrad)">
            <animate attributeName="d" values="M72,68 Q82,78 88,88 Q92,95 85,92 Q78,88 72,78 Q68,72 65,65;M72,68 Q85,80 90,92 Q94,98 86,95 Q78,90 73,80 Q68,73 65,65;M72,68 Q82,78 88,88 Q92,95 85,92 Q78,88 72,78 Q68,72 65,65" dur="${isWorking ? '2s' : '3s'}" repeatCount="indefinite" begin="0.5s"/>
          </path>
        </g>
        
        <!-- 身体 -->
        <g>
          <path d="M50,12 C25,12 18,35 18,52 C18,72 32,82 50,82 C68,82 82,72 82,52 C82,35 75,12 50,12 Z" fill="url(#bodyGrad)">
            <animate attributeName="d" values="M50,12 C25,12 18,35 18,52 C18,72 32,82 50,82 C68,82 82,72 82,52 C82,35 75,12 50,12 Z;M50,${isHappy ? '10' : '11'} C23,${isHappy ? '10' : '11'} 16,34 16,51 C16,71 31,84 50,84 C69,84 84,71 84,51 C84,34 77,${isHappy ? '10' : '11'} 50,${isHappy ? '10' : '11'} Z;M50,12 C25,12 18,35 18,52 C18,72 32,82 50,82 C68,82 82,72 82,52 C82,35 75,12 50,12 Z" dur="${isWorking ? '1.5s' : '2.5s'}" repeatCount="indefinite"/>
          </path>
          <!-- 高光 -->
          <ellipse cx="38" cy="28" rx="15" ry="20" fill="url(#highlightGrad)" opacity="0.6"/>
          <circle cx="32" cy="22" r="3" fill="#FFFFFF" opacity="0.8"/>
        </g>
        
        <!-- 表情 -->
        <g>${this.renderFace()}</g>
        
        <!-- 触手前层 -->
        <g opacity="0.8">
          <path d="M32,78 Q22,90 18,96 Q15,100 22,98 Q30,94 38,82 Q42,76 45,70" fill="url(#tentacleGrad)">
            <animate attributeName="d" values="M32,78 Q22,90 18,96 Q15,100 22,98 Q30,94 38,82 Q42,76 45,70;M32,78 Q20,92 16,98 Q13,103 21,101 Q29,96 37,84 Q42,77 45,70;M32,78 Q22,90 18,96 Q15,100 22,98 Q30,94 38,82 Q42,76 45,70" dur="${isWorking ? '1.5s' : '2.5s'}" repeatCount="indefinite"/>
          </path>
          <path d="M68,78 Q78,90 82,96 Q85,100 78,98 Q70,94 62,82 Q58,76 55,70" fill="url(#tentacleGrad)">
            <animate attributeName="d" values="M68,78 Q78,90 82,96 Q85,100 78,98 Q70,94 62,82 Q58,76 55,70;M68,78 Q80,92 84,98 Q87,103 79,101 Q71,96 63,84 Q58,77 55,70;M68,78 Q78,90 82,96 Q85,100 78,98 Q70,94 62,82 Q58,76 55,70" dur="${isWorking ? '1.5s' : '2.5s'}" repeatCount="indefinite" begin="0.4s"/>
          </path>
        </g>
      </svg>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'squid-mascot': SquidMascot;
  }
}
