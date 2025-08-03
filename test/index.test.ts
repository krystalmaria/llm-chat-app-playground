import handler from "../src/index";
import { describe, it, expect, vi } from "vitest";

// Utility to create Env with mocks
function createEnv(options: {
  assetResponse?: Response;
  aiResponse?: Response;
} = {}) {
  const assetResponse = options.assetResponse || new Response("asset", { status: 200 });
  const aiResponse = options.aiResponse || new Response("ai", { status: 200 });
  const env = {
    ASSETS: { fetch: vi.fn().mockResolvedValue(assetResponse) },
    AI: { run: vi.fn().mockResolvedValue(aiResponse) },
  } as any;
  return { env, assetResponse, aiResponse };
}

describe("fetch handler", () => {
  it("serves static assets for root path", async () => {
    const { env, assetResponse } = createEnv();
    const request = new Request("https://example.com/");
    const res = await handler.fetch(request, env, {} as ExecutionContext);
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
    expect(res).toBe(assetResponse);
  });

  it("returns 405 for non-POST to /api/chat", async () => {
    const { env } = createEnv();
    const request = new Request("https://example.com/api/chat", { method: "GET" });
    const res = await handler.fetch(request, env, {} as ExecutionContext);
    expect(res.status).toBe(405);
  });

  it("calls AI.run for POST /api/chat and returns result", async () => {
    const { env, aiResponse } = createEnv();
    const body = { messages: [{ role: "user", content: "hi" }] };
    const request = new Request("https://example.com/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const res = await handler.fetch(request, env, {} as ExecutionContext);
    expect(env.AI.run).toHaveBeenCalledOnce();
    expect(res).toBe(aiResponse);
  });

  it("returns 404 for unknown API routes", async () => {
    const { env } = createEnv();
    const request = new Request("https://example.com/api/unknown");
    const res = await handler.fetch(request, env, {} as ExecutionContext);
    expect(res.status).toBe(404);
  });
});
