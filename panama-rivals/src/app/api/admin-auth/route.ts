import { NextResponse } from "next/server";

// Server-only admin code — never ships in the client bundle.
// Set ADMIN_CODE in .env.local (Vercel: Settings → Environment Variables).
// Falls back to the legacy default so existing setups keep working, but it stays server-side.,

const ADMIN_CODE = process.env.ADMIN_CODE ?? "fieles-2026-campeon";

export async function POST(req: Request) {
  let code: string;
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code : "";
  } catch {
    code = "";
  }
  const ok = code.length > 0 && code === ADMIN_CODE;
  return NextResponse.json({ ok }, { status: ok ? 200 : 401 });
}