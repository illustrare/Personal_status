export type AiServicePublicConfig = {
  mode: "mock" | "remote";
  provider: "deepseek";
  model: string;
  apiKeyConfigured: boolean;
  status: "mock" | "configured" | "missing_api_key";
};

export type AiServiceConfigSubmission = {
  mode: AiServicePublicConfig["mode"];
  model: string;
  apiKey?: string;
  clearApiKey?: boolean;
};

async function readConfigResponse(response: Response): Promise<AiServicePublicConfig> {
  const body: unknown = await response.json();
  if (!response.ok || !body || typeof body !== "object") {
    throw new Error("无法读取 AI 服务配置。");
  }
  const config = body as Partial<AiServicePublicConfig>;
  if (
    (config.mode !== "mock" && config.mode !== "remote") ||
    config.provider !== "deepseek" ||
    typeof config.model !== "string" ||
    typeof config.apiKeyConfigured !== "boolean" ||
    (config.status !== "mock" && config.status !== "configured" && config.status !== "missing_api_key")
  ) {
    throw new Error("AI 服务返回的配置格式无效。");
  }
  return config as AiServicePublicConfig;
}

export async function loadAiServiceConfig(): Promise<AiServicePublicConfig> {
  return readConfigResponse(await fetch("/api/ai/config"));
}

export async function saveAiServiceConfig(
  submission: AiServiceConfigSubmission,
): Promise<AiServicePublicConfig> {
  return readConfigResponse(await fetch("/api/ai/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  }));
}

export async function testAiServiceConnection(): Promise<string> {
  const response = await fetch("/api/ai/connection-test", { method: "POST" });
  const body: unknown = await response.json();
  const message =
    body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
      ? (body as { message: string }).message
      : "AI 服务连接测试失败。";

  if (!response.ok) {
    throw new Error(message);
  }

  return message;
}
