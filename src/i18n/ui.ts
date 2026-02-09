export type UiLocale = "en" | "zh-CN";

export type ResolveUiLocaleParams = {
  acceptLanguageHeader?: string | string[] | undefined;
  configLocale?: string | null | undefined;
  fallbackLocale?: string | null | undefined;
};

function normalizeLocaleValue(raw: string | null | undefined): UiLocale | undefined {
  if (!raw) return undefined;
  const value = raw.trim().toLowerCase();
  if (!value) return undefined;
  if (value === "zh" || value === "zh-cn") return "zh-CN";
  if (value === "en" || value === "en-us" || value === "en-gb") return "en";
  return undefined;
}

function pickFromAcceptLanguage(header: string | undefined): UiLocale | undefined {
  if (!header) return undefined;
  const parts = header.split(",");
  for (const part of parts) {
    const [lang] = part.split(";");
    const normalized = normalizeLocaleValue(lang);
    if (normalized) return normalized;
  }
  return undefined;
}

export function resolveUiLocale(params: ResolveUiLocaleParams): UiLocale {
  const header = Array.isArray(params.acceptLanguageHeader)
    ? params.acceptLanguageHeader[0]
    : params.acceptLanguageHeader;

  const fromConfig = normalizeLocaleValue(params.configLocale ?? undefined);
  if (fromConfig) return fromConfig;

  const fromHeader = pickFromAcceptLanguage(header);
  if (fromHeader) return fromHeader;

  const fromFallback = normalizeLocaleValue(params.fallbackLocale ?? undefined);
  if (fromFallback) return fromFallback;

  return "en";
}

export type DashboardStatusMessages = {
  title: string;
  subtitle: string;
  description: string;
};

export type SceneMessages = {
  title: string;
  description: string;
};

export type CommonMessages = {
  online: string;
  offline: string;
  enabled: string;
  disabled: string;
  loading: string;
  error: string;
  success: string;
  channels: string;
  sessions: string;
  scenes: string;
  skills: string;
};

export function getDashboardStatusMessages(locale: UiLocale): DashboardStatusMessages {
  if (locale === "zh-CN") {
    return {
      title: "AeonSage 控制面板",
      subtitle: "你的个人认知操作系统中枢",
      description: "查看网关状态、通道、场景与技能，并从任意设备进行控制。",
    };
  }

  return {
    title: "AeonSage Dashboard",
    subtitle: "Control plane for your personal cognitive OS.",
    description: "View gateway status, channels, scenes, and skills from any device.",
  };
}

export function getCommonMessages(locale: UiLocale): CommonMessages {
  if (locale === "zh-CN") {
    return {
      online: "在线",
      offline: "离线",
      enabled: "已启用",
      disabled: "已禁用",
      loading: "加载中",
      error: "错误",
      success: "成功",
      channels: "通道",
      sessions: "会话",
      scenes: "场景",
      skills: "技能",
    };
  }

  return {
    online: "Online",
    offline: "Offline",
    enabled: "Enabled",
    disabled: "Disabled",
    loading: "Loading",
    error: "Error",
    success: "Success",
    channels: "Channels",
    sessions: "Sessions",
    scenes: "Scenes",
    skills: "Skills",
  };
}
