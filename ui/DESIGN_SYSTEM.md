# AeonSage UI 设计系统

> **LOCKED** - All color changes require design review

## Brand Mascot

**AeonSage's Pet** - Toxic Slime Squid
- Cute green slime creature
- Large eyes, droplet-shaped body
- Wriggling tentacles, dripping slime
- Glowing particle effects

## Primary Colors

### Toxic Green Scheme
```css
/* Main Brand Colors */
--accent: #00a100;           /* Dark Green - Button/Emphasis */
--accent-bright: #39FF14;    /* Neon Green - Glow */
--accent-toxic: #7CFC00;     /* Lawn Green - Highlight */
--accent-lime: #ADFF2F;      /* Yellow Green - Brightest Highlight */

/* Gradient Combo */
--slime-dark: #006400;       /* Dark Green - Shadow */
--slime-mid: #32CD32;        /* Mid Green - Body */
--slime-light: #00FF00;      /* Light Green - Glow */

/* Glow Effects */
--glow-toxic: rgba(57, 255, 20, 0.5);
--glow-bright: rgba(0, 255, 0, 0.3);
--glow-soft: rgba(124, 252, 0, 0.2);
```

### Status Colors
```css
--ok: #00FF88;               /* Success - Cyan Green */
--ok-muted: rgba(0, 255, 136, 0.75);
--ok-subtle: rgba(0, 255, 136, 0.12);
--destructive: #FF4444;      /* Error - Red */
--warn: #FFB800;             /* Warning - Yellow */
--info: #4FC3F7;             /* Info - Blue */
```

## Background Colors

```css
--bg: #0A0A0A;               /* Main Background - Pure Black */
--bg-accent: #111111;        /* Accent Background */
--bg-subtle: #1A1A1A;        /* Subtle Background */
--bg-elevated: #222222;      /* Elevated Background */
--bg-hover: #2A2A2A;         /* Hover Background */
--bg-muted: #333333;         /* Muted Background */
```

## Text Colors

```css
--text: #FFFFFF;             /* Main Text */
--text-strong: #FFFFFF;      /* Strong Text */
--chat-text: #F2F2F2;        /* Chat Text */
--muted: #888888;            /* Muted Text */
--muted-strong: #AAAAAA;     /* Secondary Muted */
--muted-foreground: #777777; /* Foreground Muted */
--text-muted: #999999;       /* Disabled Text */
```

## Border Colors

```css
--border-subtle: #1a1a1a;
--border: #333333;
--border-strong: #444444;
--border-active: #666666;
--border-hover: #888888;
```

## Animated Logo Specs

### Toxic Squid Logo
```css
/* Body Gradient */
radial-gradient: #7CFC00 → #32CD32 → #006400

/* Eyes */
fill: url(#eyeGrad) /* #00FF88 → #00a100 → #004d00 */

/* Glow */
filter: drop-shadow(0 0 10px rgba(57, 255, 20, 0.5))
        drop-shadow(0 0 20px rgba(0, 255, 0, 0.3));

/* Hover Enhancement */
filter: drop-shadow(0 0 15px rgba(57, 255, 20, 0.7))
        drop-shadow(0 0 30px rgba(0, 255, 0, 0.5));
```

### Animation Effects
1. **Body Breathing** - Float + Scale
2. **Tentacle Wriggle** - Wave motion
3. **Eye Blink** - Scale highlight
4. **Slime Drip** - Particle drop
5. **Particle Float** - Rise and fade
6. **Outer Glow Pulse** - Breathing rhythm

## Usage Guidelines

### Correct Usage
- Brand logo uses Toxic Green gradient
- Glow effects use `--accent-bright` (#39FF14)
- Success states use `--ok` (#00FF88)
- Error states use `--destructive` (#FF4444)

### Prohibited Usage
- ~~Orange (#FF4500)~~ - Removed from brand colors
- ~~Red as Brand Color~~ - Only for error states
- ~~White Text on Light Background~~ - Ensure contrast

## 文件位置

- 动画标志: `ui/public/aeonsage-squid-logo.svg`
- 样式定义: `ui/src/styles/layout.css` (.logo-animated)
- 图标引用: `ui/src/ui/icons.ts` (logo)

## 变更日志

| 日期 | 变更 | 说明 |
|------|------|------|
| 2026-02-01 | 毒液鱿鱼 | 全新绿色主题动画标志 |
| 2026-02-01 | 移除橙色 | 将品牌色从橙色改为绿色 |
| 2026-01-31 | 初始化 | 建立设计系统基础 |
