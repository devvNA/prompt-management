import { NextResponse } from "next/server";

import { buildApiErrorMessage } from "@/lib/api-error";
import type { PromptItem, PromptVariableType } from "@/lib/types";
import { getPromptOwnerUserId, getSupabaseAdminClient } from "@/lib/supabase/server";

type DbPromptVariableRow = {
  id: string;
  key: string;
  label: string;
  type: PromptVariableType;
  dropdown_options: string[] | null;
  sort_order: number | null;
};

type DbPromptRow = {
  id: string;
  title: string;
  model: string;
  category: string;
  tags: string[] | null;
  content: string;
  output_image_url: string | null;
  created_at: string;
  prompt_variables?: DbPromptVariableRow[] | null;
};

type PromptWriteBody = {
  title?: string;
  model?: string;
  category?: string;
  tags?: string[];
  content?: string;
  outputImageUrl?: string;
  variables?: Array<{
    key?: string;
    label?: string;
    type?: PromptVariableType;
    options?: string[];
  }>;
};

function toPromptItem(row: DbPromptRow): PromptItem {
  const sortedVariables = [...(row.prompt_variables ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return {
    id: row.id,
    title: row.title,
    model: row.model,
    category: row.category,
    tags: row.tags ?? [],
    content: row.content,
    outputImageUrl: row.output_image_url ?? undefined,
    createdAt: row.created_at,
    variables: sortedVariables.map((variable) => ({
      id: variable.id,
      key: variable.key,
      label: variable.label,
      type: variable.type,
      options: variable.dropdown_options ?? []
    }))
  };
}

function validatePromptBody(body: PromptWriteBody) {
  if (!body.title?.trim()) throw new Error("Title is required");
  if (!body.content?.trim()) throw new Error("Content is required");

  const variables = (body.variables ?? []).map((variable, index) => {
    if (!variable.key?.trim() || !variable.label?.trim() || !variable.type) {
      throw new Error(`Variable at index ${index} is invalid`);
    }
    return {
      key: variable.key.trim(),
      label: variable.label.trim(),
      type: variable.type,
      options: variable.type === "dropdown" ? (variable.options ?? []).filter(Boolean) : []
    };
  });

  return {
    title: body.title.trim(),
    model: body.model?.trim() || "Custom",
    category: body.category?.trim() || "General",
    tags: (body.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    content: body.content,
    outputImageUrl: body.outputImageUrl?.trim() || null,
    variables
  };
}

async function fetchPromptById(promptId: string) {
  const supabase = getSupabaseAdminClient();
  const ownerUserId = getPromptOwnerUserId();

  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id,title,model,category,tags,content,output_image_url,created_at,prompt_variables(id,key,label,type,dropdown_options,sort_order)"
    )
    .eq("id", promptId)
    .eq("user_id", ownerUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Prompt not found");

  return toPromptItem(data as unknown as DbPromptRow);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as PromptWriteBody;
    const validated = validatePromptBody(body);
    const supabase = getSupabaseAdminClient();
    const ownerUserId = getPromptOwnerUserId();

    const { data: existing, error: existingError } = await supabase
      .from("prompts")
      .select("id")
      .eq("id", id)
      .eq("user_id", ownerUserId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("prompts")
      .update({
        title: validated.title,
        model: validated.model,
        category: validated.category,
        tags: validated.tags,
        content: validated.content,
        output_image_url: validated.outputImageUrl
      })
      .eq("id", id)
      .eq("user_id", ownerUserId);

    if (updateError) throw updateError;

    const { error: deleteVariablesError } = await supabase.from("prompt_variables").delete().eq("prompt_id", id);
    if (deleteVariablesError) throw deleteVariablesError;

    if (validated.variables.length > 0) {
      const { error: variableInsertError } = await supabase.from("prompt_variables").insert(
        validated.variables.map((variable, index) => ({
          prompt_id: id,
          key: variable.key,
          label: variable.label,
          type: variable.type,
          dropdown_options: variable.options,
          sort_order: index
        }))
      );
      if (variableInsertError) throw variableInsertError;
    }

    const prompt = await fetchPromptById(id);
    return NextResponse.json({ prompt });
  } catch (error) {
    const message = buildApiErrorMessage(error, "Failed to update prompt");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    const ownerUserId = getPromptOwnerUserId();

    const { error } = await supabase.from("prompts").delete().eq("id", id).eq("user_id", ownerUserId);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = buildApiErrorMessage(error, "Failed to delete prompt");
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
