import { NextResponse } from "next/server";
import { liveAvatarContextsBodySchema } from "@/lib/api/schemas";
import { jsonError } from "@/lib/api/errors";
import { fetchWithTimeout } from "@/lib/providers/util";
import { withApiLogging } from "@/lib/api/log";

export const runtime = "nodejs";

/**
 * Proxies LiveAvatar [List User Contexts](https://docs.liveavatar.com/api-reference/contexts/list-user-contexts.md):
 * `GET https://api.liveavatar.com/v1/contexts` with `X-API-KEY`.
 */
export async function POST(request: Request) {
  return withApiLogging(request, async () => {
    const json = await request.json().catch(() => ({}));
    const parsed = liveAvatarContextsBodySchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(
        400,
        "INVALID_LIVEAVATAR_CONTEXTS_BODY",
        "Invalid LiveAvatar contexts payload",
        parsed.error.flatten()
      );
    }

    const { apiKey } = parsed.data;
    const res = await fetchWithTimeout(
      "https://api.liveavatar.com/v1/contexts?page=1&page_size=100",
      {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey.trim(),
          Accept: "application/json",
        },
        cache: "no-store",
      },
      15_000
    );

    const body = (await res.json().catch(() => ({}))) as {
      code?: number;
      message?: string;
      data?: { results?: { id: string; name: string }[]; count?: number };
    };

    if (!res.ok) {
      return jsonError(
        res.status === 401 || res.status === 403 ? res.status : 502,
        "LIVEAVATAR_CONTEXTS_FAILED",
        body.message || `LiveAvatar contexts: ${res.status}`
      );
    }

    const results = body.data?.results ?? [];
    const contexts = results.map((c) => ({ id: c.id, name: c.name }));

    return NextResponse.json({ contexts });
  });
}
