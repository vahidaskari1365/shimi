"use client";

import { useEffect, useState } from "react";
import type { HealthDTO } from "@/lib/types";

export class ApiClientError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.details = details;
  }
}

/** فراخوانی استاندارد API با تبدیل خطای یکنواخت به ApiClientError */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiClientError("NETWORK", "اتصال به سرور برقرار نشد.");
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // پاسخ بدون بدنه
  }

  if (!res.ok) {
    const errShape = (body as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiClientError(
      errShape?.code ?? `HTTP_${res.status}`,
      errShape?.message ?? "خطای غیرمنتظره در سرور رخ داد.",
      errShape?.details,
    );
  }

  return body as T;
}

export function jsonBody(data: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

/** وضعیت سلامت سرویس — با به‌روزرسانی دوره‌ای */
export function useHealth(pollMs = 30000): { health: HealthDTO | null; offline: boolean } {
  const [health, setHealth] = useState<HealthDTO | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const h = await apiFetch<HealthDTO>("/api/health");
        if (alive) {
          setHealth(h);
          setOffline(false);
        }
      } catch {
        if (alive) setOffline(true);
      }
    };
    load();
    const t = setInterval(load, pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs]);

  return { health, offline };
}
