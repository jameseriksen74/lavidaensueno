import { NextResponse } from "next/server";
import { Pool } from "pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGIONS = ["latam", "us", "eu", "other"] as const;
const LANGS = ["es", "en"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Reuse one pool across hot reloads / requests.
const g = globalThis as unknown as { waitlistPool?: Pool; waitlistReady?: Promise<void> };

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!g.waitlistPool) {
    g.waitlistPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return g.waitlistPool;
}

function ensureTable(pool: Pool): Promise<void> {
  if (!g.waitlistReady) {
    g.waitlistReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS waitlist (
           id          BIGSERIAL PRIMARY KEY,
           email       TEXT NOT NULL UNIQUE,
           first_name  TEXT,
           region      TEXT NOT NULL,
           lang        TEXT NOT NULL,
           consent     BOOLEAN NOT NULL DEFAULT TRUE,
           created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
         )`
      )
      .then(() => undefined)
      .catch((err) => {
        g.waitlistReady = undefined; // retry on next request
        throw err;
      });
  }
  return g.waitlistReady;
}

// Very small per-IP rate limit (per container instance).
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Honeypot: real people never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, status: "joined" });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const firstName = String(body.firstName ?? "").trim().slice(0, 60) || null;
  const region = String(body.region ?? "");
  const lang = String(body.lang ?? "es");
  const consent = body.consent === true;

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, error: "email" }, { status: 400 });
  }
  if (!(REGIONS as readonly string[]).includes(region)) {
    return NextResponse.json({ ok: false, error: "region" }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ ok: false, error: "consent" }, { status: 400 });
  }
  const safeLang = (LANGS as readonly string[]).includes(lang) ? lang : "es";

  const pool = getPool();
  if (!pool) {
    console.error("waitlist: DATABASE_URL is not set");
    return NextResponse.json({ ok: false, error: "server" }, { status: 503 });
  }

  try {
    await ensureTable(pool);
    const result = await pool.query(
      `INSERT INTO waitlist (email, first_name, region, lang, consent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [email, firstName, region, safeLang, consent]
    );
    return NextResponse.json({ ok: true, status: result.rowCount ? "joined" : "already" });
  } catch (err) {
    console.error("waitlist insert failed:", err);
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }
}
