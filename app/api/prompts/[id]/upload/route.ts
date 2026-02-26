import { NextResponse } from "next/server";

import { buildApiErrorMessage } from "@/lib/api-error";
import { getPromptOwnerUserId, getPromptResultsBucket, getSupabaseAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const ownerUserId = getPromptOwnerUserId();
    const bucket = getPromptResultsBucket();

    const { data: prompt, error: promptError } = await supabase
      .from("prompts")
      .select("id")
      .eq("id", id)
      .eq("user_id", ownerUserId)
      .maybeSingle();

    if (promptError) throw promptError;
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const safeName = file.name.replace(/[^\w.\-]/g, "_");
    const path = `${id}/${Date.now()}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream"
    });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    const url = publicUrlData.publicUrl;

    const { error: updatePromptError } = await supabase
      .from("prompts")
      .update({
        output_image_url: url,
        output_image_storage_path: path
      })
      .eq("id", id)
      .eq("user_id", ownerUserId);

    if (updatePromptError) throw updatePromptError;

    const { error: outputInsertError } = await supabase.from("prompt_outputs").insert({
      prompt_id: id,
      user_id: ownerUserId,
      image_url: url,
      storage_path: path,
      is_cover: true
    });

    if (outputInsertError) throw outputInsertError;

    return NextResponse.json({ url, path });
  } catch (error) {
    const message = buildApiErrorMessage(error, "Failed to upload image");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
