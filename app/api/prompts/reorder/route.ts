import { NextResponse } from "next/server";

import { buildApiErrorMessage } from "@/lib/api-error";
import { getPromptOwnerUserId, getSupabaseAdminClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
    try {
        const body = (await request.json()) as { orderedIds?: unknown };

        if (!Array.isArray(body.orderedIds) || body.orderedIds.length === 0) {
            return NextResponse.json(
                { error: "orderedIds array is required" },
                { status: 400 }
            );
        }

        const orderedIds = body.orderedIds as string[];
        const supabase = getSupabaseAdminClient();
        const ownerUserId = getPromptOwnerUserId();

        const results = await Promise.all(
            orderedIds.map((id, index) =>
                supabase
                    .from("prompts")
                    .update({ display_order: index })
                    .eq("id", id)
                    .eq("user_id", ownerUserId)
            )
        );

        const firstError = results.find((r) => r.error);
        // Ignore 42703 (column not found) — migration not yet applied
        if (firstError?.error && firstError.error.code !== "42703") {
            throw firstError.error;
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        const message = buildApiErrorMessage(error, "Failed to reorder prompts");
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
