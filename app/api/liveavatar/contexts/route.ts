import { NextResponse } from "next/server";
import { liveAvatarContextsBodySchema } from "@/lib/api/schemas";

export const runtime = "nodejs";

/**
 * Proxies LiveAvatar [List User Contexts](https://docs.liveavatar.com/api-reference/contexts/list-user-contexts.md):
 * `GET https://api.liveavatar.com/v1/contexts` with `X-API-KEY`.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => ({}));
  const parsed = liveAvatarContextsBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { apiKey } = parsed.data;
  const res = await fetch(
    "https://api.liveavatar.com/v1/contexts?page=1&page_size=100",
    {
      method: "GET",
      headers: {
        "X-API-KEY": apiKey.trim(),
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  const body = (await res.json().catch(() => ({}))) as {
    code?: number;
    message?: string;
    data?: { results?: { id: string; name: string }[]; count?: number };
  };

  if (!res.ok) {
    return NextResponse.json(
      { error: body.message || `LiveAvatar contexts: ${res.status}` },
      { status: res.status === 401 || res.status === 403 ? res.status : 502 }
    );
  }

  const results = body.data?.results ?? [];
  const contexts = results.map((c) => ({ id: c.id, name: c.name }));

  return NextResponse.json({ contexts });
}
