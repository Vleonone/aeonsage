/**
 * AeonSage CLI Internationalization (i18n)
 *
 * Provides locale detection and translations for CLI output.
 * Supports English (en) and Chinese (zh).
 *
 * Usage:
 *   import { cliT, detectCliLocale } from "./cli-i18n.js";
 *   const locale = detectCliLocale();
 *   console.log(cliT(locale).commands.help);
 */

export type CliLocale = "en" | "zh";

export interface CliI18nTexts {
  // Banner & Info
  banner: {
    taglineDefault: string;
  };

  // Common phrases
  common: {
    loading: string;
    success: string;
    error: string;
    warning: string;
    done: string;
    cancelled: string;
    yes: string;
    no: string;
    confirm: string;
    abort: string;
  };

  // Commands
  commands: {
    help: string;
    version: string;
    start: string;
    stop: string;
    restart: string;
    status: string;
    config: string;
    doctor: string;
    update: string;
    logs: string;
  };

  // Doctor command
  doctor: {
    title: string;
    checkingSystem: string;
    checkingNode: string;
    checkingConfig: string;
    checkingGateway: string;
    checkingChannels: string;
    allPassed: string;
    issuesFound: string;
    fixSuggestion: string;
  };

  // Status messages
  status: {
    running: string;
    stopped: string;
    starting: string;
    stopping: string;
    connected: string;
    disconnected: string;
    healthy: string;
    unhealthy: string;
    checking: string;
  };

  // Config messages
  config: {
    loaded: string;
    saved: string;
    invalid: string;
    missingKey: string;
    keySet: string;
    keyCleared: string;
  };

  // Gateway messages
  gateway: {
    starting: string;
    listening: string;
    connected: string;
    disconnected: string;
    tokenGenerated: string;
    tokenRequired: string;
    invalidToken: string;
  };

  // Channel messages
  channels: {
    whatsapp: string;
    telegram: string;
    discord: string;
    matrix: string;
    slack: string;
    connecting: string;
    paired: string;
    pairingRequired: string;
    scanQR: string;
    authenticated: string;
  };

  // Error messages
  errors: {
    configNotFound: string;
    portInUse: string;
    authFailed: string;
    networkError: string;
    timeout: string;
    unknown: string;
  };

  // Prompts
  prompts: {
    enterToken: string;
    enterApiKey: string;
    selectChannel: string;
    confirmAction: string;
  };
}

const translations: Record<CliLocale, CliI18nTexts> = {
  en: {
    banner: {
      taglineDefault: "All your chats, one AeonSage.",
    },
    common: {
      loading: "Loading...",
      success: "Success",
      error: "Error",
      warning: "Warning",
      done: "Done",
      cancelled: "Cancelled",
      yes: "Yes",
      no: "No",
      confirm: "Confirm",
      abort: "Abort",
    },
    commands: {
      help: "Show help",
      version: "Show version",
      start: "Start the gateway",
      stop: "Stop the gateway",
      restart: "Restart the gateway",
      status: "Show status",
      config: "Manage configuration",
      doctor: "Run diagnostics",
      update: "Check for updates",
      logs: "View logs",
    },
    doctor: {
      title: "AeonSage Doctor",
      checkingSystem: "Checking system requirements...",
      checkingNode: "Checking Node.js version...",
      checkingConfig: "Checking configuration...",
      checkingGateway: "Checking gateway status...",
      checkingChannels: "Checking channel connections...",
      allPassed: "All checks passed!",
      issuesFound: "Issues found:",
      fixSuggestion: "Suggested fix:",
    },
    status: {
      running: "Running",
      stopped: "Stopped",
      starting: "Starting...",
      stopping: "Stopping...",
      connected: "Connected",
      disconnected: "Disconnected",
      healthy: "Healthy",
      unhealthy: "Unhealthy",
      checking: "Checking...",
    },
    config: {
      loaded: "Configuration loaded",
      saved: "Configuration saved",
      invalid: "Invalid configuration",
      missingKey: "Missing required key:",
      keySet: "Key set:",
      keyCleared: "Key cleared:",
    },
    gateway: {
      starting: "Starting gateway...",
      listening: "Gateway listening on port",
      connected: "Gateway connected",
      disconnected: "Gateway disconnected",
      tokenGenerated: "Gateway token generated:",
      tokenRequired: "Gateway token required",
      invalidToken: "Invalid gateway token",
    },
    channels: {
      whatsapp: "WhatsApp",
      telegram: "Telegram",
      discord: "Discord",
      matrix: "Matrix",
      slack: "Slack",
      connecting: "Connecting to",
      paired: "Successfully paired with",
      pairingRequired: "Pairing required for",
      scanQR: "Scan QR code to connect:",
      authenticated: "Authenticated with",
    },
    errors: {
      configNotFound: "Configuration file not found",
      portInUse: "Port is already in use:",
      authFailed: "Authentication failed",
      networkError: "Network error:",
      timeout: "Operation timed out",
      unknown: "Unknown error occurred",
    },
    prompts: {
      enterToken: "Enter gateway token:",
      enterApiKey: "Enter API key:",
      selectChannel: "Select a channel:",
      confirmAction: "Are you sure?",
    },
  },

  zh: {
    banner: {
      taglineDefault: "所有聊天，一个 AeonSage。",
    },
    common: {
      loading: "加载中...",
      success: "成功",
      error: "错误",
      warning: "警告",
      done: "完成",
      cancelled: "已取消",
      yes: "是",
      no: "否",
      confirm: "确认",
      abort: "中止",
    },
    commands: {
      help: "显示帮助",
      version: "显示版本",
      start: "启动网关",
      stop: "停止网关",
      restart: "重启网关",
      status: "显示状态",
      config: "管理配置",
      doctor: "运行诊断",
      update: "检查更新",
      logs: "查看日志",
    },
    doctor: {
      title: "AeonSage 诊断工具",
      checkingSystem: "检查系统要求...",
      checkingNode: "检查 Node.js 版本...",
      checkingConfig: "检查配置...",
      checkingGateway: "检查网关状态...",
      checkingChannels: "检查频道连接...",
      allPassed: "所有检查通过！",
      issuesFound: "发现问题：",
      fixSuggestion: "建议修复：",
    },
    status: {
      running: "运行中",
      stopped: "已停止",
      starting: "启动中...",
      stopping: "停止中...",
      connected: "已连接",
      disconnected: "已断开",
      healthy: "健康",
      unhealthy: "异常",
      checking: "检查中...",
    },
    config: {
      loaded: "配置已加载",
      saved: "配置已保存",
      invalid: "配置无效",
      missingKey: "缺少必需的键：",
      keySet: "已设置键：",
      keyCleared: "已清除键：",
    },
    gateway: {
      starting: "正在启动网关...",
      listening: "网关正在监听端口",
      connected: "网关已连接",
      disconnected: "网关已断开",
      tokenGenerated: "网关令牌已生成：",
      tokenRequired: "需要网关令牌",
      invalidToken: "无效的网关令牌",
    },
    channels: {
      whatsapp: "WhatsApp",
      telegram: "Telegram",
      discord: "Discord",
      matrix: "Matrix",
      slack: "Slack",
      connecting: "正在连接",
      paired: "已成功配对",
      pairingRequired: "需要配对",
      scanQR: "扫描二维码以连接：",
      authenticated: "已通过认证",
    },
    errors: {
      configNotFound: "未找到配置文件",
      portInUse: "端口已被占用：",
      authFailed: "认证失败",
      networkError: "网络错误：",
      timeout: "操作超时",
      unknown: "发生未知错误",
    },
    prompts: {
      enterToken: "请输入网关令牌：",
      enterApiKey: "请输入 API 密钥：",
      selectChannel: "请选择频道：",
      confirmAction: "确定要执行此操作吗？",
    },
  },
};

/**
 * Detect CLI locale from environment variables.
 * Checks LANG, LC_ALL, LC_MESSAGES in order.
 * Defaults to English if Chinese is not detected.
 */
export function detectCliLocale(env?: NodeJS.ProcessEnv): CliLocale {
  const e = env ?? process.env;
  const langVars = [e.LANG, e.LC_ALL, e.LC_MESSAGES, e.LANGUAGE];

  for (const lang of langVars) {
    if (lang?.toLowerCase().startsWith("zh")) {
      return "zh";
    }
  }

  // Also check for explicit AeonSage locale setting
  const aeonsageLang = e.AEONSAGE_LOCALE;
  if (aeonsageLang?.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  return "en";
}

/**
 * Get CLI translations for the specified locale.
 */
export function cliT(locale: CliLocale): CliI18nTexts {
  return translations[locale];
}

/**
 * Get CLI translations with auto-detected locale.
 */
export function getCliTexts(env?: NodeJS.ProcessEnv): CliI18nTexts {
  return cliT(detectCliLocale(env));
}

export { translations as cliTranslations };
