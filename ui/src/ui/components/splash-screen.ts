import { html } from 'lit';

/**
 * Cosmic Splash Screen Component
 * Renders the AeonSage startup screen with nebula animation
 */
export function renderCosmicSplash(props: {
    onBegin?: () => void;
    loading?: boolean;
}) {
    const handleBegin = () => {
        if (props.onBegin) {
            // Show loader
            const loader = document.getElementById('cosmic-loader');
            if (loader) loader.classList.add('active');

            // Hide button
            const btn = document.querySelector('.cosmic-btn');
            if (btn) (btn as HTMLElement).style.opacity = '0';

            // Trigger callback after animation
            setTimeout(() => {
                props.onBegin!();
            }, 3000);
        }
    };

    return html`
    <div class="cosmic-startup">
      <!-- Animated cosmic background -->
      <div class="cosmic-bg">
        <div class="nebula-layer layer-1"></div>
        <div class="nebula-layer layer-2"></div>
        <div class="stars"></div>
      </div>
      
      <!-- Title -->
      <h1 class="cosmic-title">AEONSAGE</h1>
      <p class="cosmic-subtitle">Personal AI Cognitive OS</p>
      
      <!-- BEGIN button -->
      <button 
        class="cosmic-btn" 
        @click=${handleBegin}
        ?disabled=${props.loading}
      >
        BEGIN
      </button>
      
      <!-- Loading state -->
      <div 
        class="cosmic-loader ${props.loading ? 'active' : ''}" 
        id="cosmic-loader"
      >
        <div class="loader-bar"></div>
        <p class="loader-text">Initializing neural core...</p>
      </div>
    </div>
  `;
}
