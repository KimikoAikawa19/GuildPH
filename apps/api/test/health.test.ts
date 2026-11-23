import { describe, expect, it } from "vitest";
import app from "../src/index";

describe("Phase 1 API", () => {
  it("returns API health", async () => {
    const response = await app.request("/api/v1/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { status: "ok" } });
  });

  it("validates community pagination", async () => {
    const response = await app.request("/api/v1/communities?page=0");
    expect(response.status).toBe(400);
  });

  it("rejects protected account access without a bearer token", async () => {
    const response = await app.request("/api/v1/users/me");
    expect(response.status).toBe(401);
  });

  it("rejects protected account access for a malformed bearer token", async () => {
    const response = await app.request("/api/v1/users/me", {
      headers: { Authorization: "Bearer not-a-firebase-token" }
    });
    expect([401, 503]).toContain(response.status);
  });
});
