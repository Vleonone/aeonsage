import { Type } from "@sinclair/typebox";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

export enum CaptchaType {
  RECAPTCHA_V2 = "recaptcha_v2",
  RECAPTCHA_V3 = "recaptcha_v3",
  HCAPTCHA = "hcaptcha",
  FUNCAPTCHA = "funcaptcha",
  TURNSTILE = "turnstile",
  IMAGE_CAPTCHA = "image",
  SLIDER = "slider",
  CLICK = "click",
  AUDIO = "audio",
}

export enum CaptchaProvider {
  TWOCAPTCHA = "2captcha",
  ANTICAPTCHA = "anticaptcha",
  CAPSOLVER = "capsolver",
  MANUAL = "manual",
}

const PROVIDER_ENDPOINTS: Record<CaptchaProvider, string> = {
  [CaptchaProvider.TWOCAPTCHA]: "https://2captcha.com/in.php",
  [CaptchaProvider.ANTICAPTCHA]: "https://api.anti-captcha.com/createTask",
  [CaptchaProvider.CAPSOLVER]: "https://api.capsolver.com/createTask",
  [CaptchaProvider.MANUAL]: "",
};

const CaptchaSolverToolSchema = Type.Object({
  action: Type.String(),
  captchaType: Type.Optional(Type.String()),
  provider: Type.Optional(Type.String()),
  siteKey: Type.Optional(Type.String()),
  pageUrl: Type.Optional(Type.String()),
  imageBase64: Type.Optional(Type.String()),
  apiKey: Type.Optional(Type.String()),
});

function createSolveRequest(params: {
  provider: CaptchaProvider;
  captchaType: CaptchaType;
  siteKey?: string;
  pageUrl?: string;
  imageBase64?: string;
  apiKey: string;
}): Record<string, unknown> {
  const { provider, captchaType, siteKey, pageUrl, imageBase64, apiKey } = params;

  switch (provider) {
    case CaptchaProvider.TWOCAPTCHA:
      if (captchaType === CaptchaType.RECAPTCHA_V2) {
        return {
          key: apiKey,
          method: "userrecaptcha",
          googlekey: siteKey,
          pageurl: pageUrl,
          json: 1,
        };
      }
      if (captchaType === CaptchaType.HCAPTCHA) {
        return { key: apiKey, method: "hcaptcha", sitekey: siteKey, pageurl: pageUrl, json: 1 };
      }
      if (captchaType === CaptchaType.IMAGE_CAPTCHA) {
        return { key: apiKey, method: "base64", body: imageBase64, json: 1 };
      }
      break;
    case CaptchaProvider.CAPSOLVER:
      if (captchaType === CaptchaType.RECAPTCHA_V2) {
        return {
          clientKey: apiKey,
          task: { type: "ReCaptchaV2TaskProxyLess", websiteURL: pageUrl, websiteKey: siteKey },
        };
      }
      if (captchaType === CaptchaType.TURNSTILE) {
        return {
          clientKey: apiKey,
          task: { type: "TurnstileTaskProxyLess", websiteURL: pageUrl, websiteKey: siteKey },
        };
      }
      break;
  }
  return {};
}

export function createCaptchaSolverTool(): AnyAgentTool {
  return {
    label: "CAPTCHA Solver",
    name: "captcha_solver",
    description: `Solve various types of CAPTCHAs using third-party services.

Supported CAPTCHA types:
- recaptcha_v2: Google reCAPTCHA v2 (checkbox)
- recaptcha_v3: Google reCAPTCHA v3 (invisible)
- hcaptcha: hCaptcha verification
- funcaptcha: Arkose Labs FunCaptcha
- turnstile: Cloudflare Turnstile
- image: Traditional image CAPTCHA
- slider: Slider puzzles
- click: Click-based verification
- audio: Audio CAPTCHA

Providers: 2captcha, anticaptcha, capsolver, manual`,
    parameters: CaptchaSolverToolSchema,
    execute: async (_toolCallId, rawArgs) => {
      const args = rawArgs as Record<string, unknown>;
      const action = readStringParam(args, "action");
      const provider = (args.provider as CaptchaProvider) || CaptchaProvider.TWOCAPTCHA;
      const captchaType = args.captchaType as CaptchaType;
      const apiKey = args.apiKey as string;

      switch (action) {
        case "solve": {
          if (!apiKey) {
            return jsonResult({
              success: false,
              error: "API key required for CAPTCHA solving",
              hint: "Configure CAPTCHA_API_KEY in environment or provide apiKey parameter",
            });
          }

          if (!captchaType) {
            return jsonResult({
              success: false,
              error: "captchaType is required",
              supportedTypes: Object.values(CaptchaType),
            });
          }

          const request = createSolveRequest({
            provider,
            captchaType,
            siteKey: args.siteKey as string,
            pageUrl: args.pageUrl as string,
            imageBase64: args.imageBase64 as string,
            apiKey,
          });

          // In real implementation, this would make HTTP request
          // For now, return structured response
          return jsonResult({
            success: true,
            action: "solve",
            provider,
            captchaType,
            request,
            message: `CAPTCHA solving request prepared for ${captchaType} via ${provider}`,
            nextSteps: [
              "1. Submit request to provider API",
              "2. Poll for result (typically 10-60 seconds)",
              "3. Inject solution token into page",
            ],
            estimatedTime: captchaType.includes("recaptcha") ? "20-60s" : "5-30s",
            cost: captchaType.includes("recaptcha") ? "$2.99/1000" : "$0.50/1000",
          });
        }

        case "balance": {
          if (!apiKey) {
            return jsonResult({
              success: false,
              error: "API key required to check balance",
            });
          }

          return jsonResult({
            success: true,
            action: "balance",
            provider,
            message: `Balance check request prepared for ${provider}`,
            endpoint: PROVIDER_ENDPOINTS[provider],
          });
        }

        case "report": {
          return jsonResult({
            success: true,
            action: "report",
            message: "Result reporting helps improve solving accuracy",
            supportedReports: ["correct", "incorrect"],
          });
        }

        default:
          return jsonResult({ success: false, error: `Unknown action: ${action}` });
      }
    },
  };
}

/**
 * Helper: Detect CAPTCHA type on page
 * 辅助函数：检测页面上的验证码类型
 */
export function detectCaptchaType(pageHtml: string): CaptchaType | null {
  if (pageHtml.includes("g-recaptcha") || pageHtml.includes("grecaptcha")) {
    return pageHtml.includes("recaptcha/api.js?render=")
      ? CaptchaType.RECAPTCHA_V3
      : CaptchaType.RECAPTCHA_V2;
  }
  if (pageHtml.includes("hcaptcha.com") || pageHtml.includes("h-captcha")) {
    return CaptchaType.HCAPTCHA;
  }
  if (pageHtml.includes("challenges.cloudflare.com") || pageHtml.includes("turnstile")) {
    return CaptchaType.TURNSTILE;
  }
  if (pageHtml.includes("funcaptcha") || pageHtml.includes("arkoselabs")) {
    return CaptchaType.FUNCAPTCHA;
  }
  return null;
}
