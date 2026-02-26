import type { PromptItem, PromptVariableType } from "@/lib/types";

export interface PromptVariableInput {
  id?: string;
  key: string;
  label: string;
  type: PromptVariableType;
  options?: string[];
}

export interface PromptUpsertInput {
  title: string;
  model: string;
  category: string;
  tags: string[];
  content: string;
  outputImageUrl?: string;
  variables: PromptVariableInput[];
}

async function parseJsonOrThrow(response: Response) {
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export async function fetchPromptsApi() {
  const response = await fetch("/api/prompts", { cache: "no-store" });
  const data = (await parseJsonOrThrow(response)) as { prompts: PromptItem[] };
  return data.prompts;
}

export async function createPromptApi(payload: PromptUpsertInput) {
  const response = await fetch("/api/prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = (await parseJsonOrThrow(response)) as { prompt: PromptItem };
  return data.prompt;
}

export async function updatePromptApi(promptId: string, payload: PromptUpsertInput) {
  const response = await fetch(`/api/prompts/${promptId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = (await parseJsonOrThrow(response)) as { prompt: PromptItem };
  return data.prompt;
}

export async function deletePromptApi(promptId: string) {
  const response = await fetch(`/api/prompts/${promptId}`, { method: "DELETE" });
  await parseJsonOrThrow(response);
}

export async function uploadPromptResultImageApi(file: File, promptId: string) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/prompts/${promptId}/upload`, {
    method: "POST",
    body: formData
  });

  const data = (await parseJsonOrThrow(response)) as { url: string; path: string };
  return data;
}

