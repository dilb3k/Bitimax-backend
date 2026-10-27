import "server-only";
import type { PublicPolicy } from "../api";
export async function getPolicy(): Promise<PublicPolicy | null> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:3001"}/api/products/policy`,
      { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) },
    );
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}
