import type { PromptVariable } from "@/lib/types";

export function replacePromptVariables(template: string, values: Record<string, string>) {
  return template.replace(/\[([^\]]+)\]/g, (_, key: string) => {
    const value = values[key];
    return value && value.trim().length > 0 ? value.trim() : `[${key}]`;
  });
}

export function normalizeVariableKey(raw: string) {
  return raw.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "");
}

export function parseTags(raw: string) {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseDropdownOptions(raw: string) {
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function createBlankVariable(): PromptVariable {
  return {
    id: `var_${Math.random().toString(36).slice(2, 9)}`,
    key: "",
    label: "",
    type: "short_text",
    options: []
  };
}

