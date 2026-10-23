"use client";

/**
 * Thin fetch wrapper for the application's own /api routes.
 *
 * Session state lives in an HttpOnly cookie, so same-origin requests carry it
 * automatically — no token is read from or written to localStorage anywhere.
 * Every call funnels through here so 401s are handled in one place.
 */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "same-origin" });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiSend<T = unknown>(
  path: string,
  method: "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new ApiError(res.status, await parseError(res));
  return res.json() as Promise<T>;
}
