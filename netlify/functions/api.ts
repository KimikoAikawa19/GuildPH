import type { Handler } from "@netlify/functions";
import app from "../../apps/api/src/index";

function buildRequest(event: Parameters<Handler>[0]): Request {
  const protocol = event.headers["x-forwarded-proto"] ?? "https";
  const host = event.headers.host ?? "localhost";
  const rawUrl = event.rawUrl;
  let originalPath = event.path;

  if (rawUrl) {
    try {
      const url = new URL(rawUrl);
      originalPath = url.pathname;
    } catch {
      // Use the event path if the request URL cannot be parsed.
    }
  }

  const marker = "/.netlify/functions/api/";
  if (originalPath.startsWith(marker)) {
    originalPath = `/api/v1/${originalPath.slice(marker.length)}`;
  } else if (originalPath === "/.netlify/functions/api") {
    originalPath = "/api/v1";
  } else if (originalPath.startsWith("/api/v1/")) {
    // Already in versioned API form.
  } else if (originalPath.startsWith("/api/v1")) {
    // Already in versioned API form.
  } else {
    const query = originalPath.indexOf("?");
    const cleanPath = query >= 0 ? originalPath.slice(0, query) : originalPath;
    originalPath = `/api/v1${cleanPath}`;
  }

  const url = `${protocol}://${host}${originalPath}${event.rawQuery ? `?${event.rawQuery}` : ""}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers)) {
    if (typeof value === "string") headers.set(key, value);
  }
  return new Request(url, {
    method: event.httpMethod,
    headers,
    body: event.httpMethod === "GET" || event.httpMethod === "HEAD"
      ? undefined
      : event.body
  });
}

export const handler: Handler = async (event) => {
  const request = buildRequest(event);
  const response = await app.fetch(request, {
    DATABASE_URL: process.env.DATABASE_URL,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    APP_ORIGINS: process.env.APP_ORIGINS,
    API_VERSION: process.env.API_VERSION ?? "v1"
  });
  const headers = Object.fromEntries(response.headers.entries());
  return {
    statusCode: response.status,
    headers,
    body: await response.text()
  };
};
