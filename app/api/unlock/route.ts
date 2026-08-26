import { NextRequest, NextResponse } from "next/server";
import { unlockSchema } from "@/lib/schemas";
import { decryptPayload } from "@/lib/crypto";
import { AnalysisResult } from "@/types";

export const runtime = "nodejs";

/**
 * DEMO / PLACEHOLDER PAYMENT FLOW.
 *
 * There is no real payment processor wired up here. The client shows a
 * card-style form purely for show (see components/PaymentModal.tsx) — no
 * card details are sent here, validated against a card network, or stored
 * anywhere. Once the demo form "succeeds" client-side, it calls this route
 * to fetch the full analysis, which was encrypted server-side right after
 * scoring (see lib/crypto.ts) so the client never had access to the locked
 * content before this point.
 *
 * To wire up a real payment provider later: create a checkout/order on the
 * server, confirm payment server-side (signature/webhook check), and only
 * then call decryptPayload — the shape below (decrypt + return result)
 * stays the same.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = unlockSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }

    const { analysisId, lockedPayload } = parsed.data;

    const decrypted = decryptPayload<{ analysisId: string; result: AnalysisResult }>(
      lockedPayload
    );

    if (decrypted.analysisId !== analysisId) {
      return NextResponse.json(
        { error: "Analysis mismatch — please re-run the scan." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      unlocked: true,
      result: decrypted.result,
    });
  } catch (err: any) {
    console.error("[/api/unlock] error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Could not unlock the report." },
      { status: 500 }
    );
  }
}
