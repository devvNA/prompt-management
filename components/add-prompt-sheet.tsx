"use client";

import { ChevronRight, ImagePlus, Plus, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { createBlankVariable, parseDropdownOptions } from "@/lib/prompt-utils";
import type { PromptVariable, PromptVariableType } from "@/lib/types";

export type DraftPrompt = {
  title: string;
  model: string;
  category: string;
  tags: string;
  content: string;
  outputImageUrl: string;
};

const VARIABLE_TYPE_LABELS: Array<{
  value: PromptVariableType;
  label: string;
}> = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "dropdown", label: "Dropdown" },
];

interface AddPromptSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  draftPrompt: DraftPrompt;
  setDraftPrompt: React.Dispatch<React.SetStateAction<DraftPrompt>>;
  draftVariables: PromptVariable[];
  setDraftVariables: React.Dispatch<React.SetStateAction<PromptVariable[]>>;
  draftImageFile: File | null;
  onDraftImageFileChange: (file: File | null) => void;
  imageFileInputKey: number;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isSavingPrompt: boolean;
}

export function AddPromptSheet({
  open,
  onOpenChange,
  mode,
  draftPrompt,
  setDraftPrompt,
  draftVariables,
  setDraftVariables,
  draftImageFile,
  onDraftImageFileChange,
  imageFileInputKey,
  onSubmit,
  isSavingPrompt,
}: AddPromptSheetProps) {
  const isEditMode = mode === "edit";

  function updateDraftVariable(id: string, patch: Partial<PromptVariable>) {
    setDraftVariables((prev) =>
      prev.map((variable) =>
        variable.id === id ? { ...variable, ...patch } : variable,
      ),
    );
  }

  function handleVariableTypeChange(id: string, type: PromptVariableType) {
    setDraftVariables((prev) =>
      prev.map((variable) =>
        variable.id === id
          ? {
              ...variable,
              type,
              options: type === "dropdown" ? (variable.options ?? []) : [],
            }
          : variable,
      ),
    );
  }

  function removeDraftVariable(id: string) {
    setDraftVariables((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl overflow-y-auto p-0"
      >
        <SheetHeader className="border-b border-zinc-800 bg-zinc-900/70 pr-14">
          <SheetTitle>{isEditMode ? "Edit Prompt" : "Add Prompt"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update prompt details and manual variables."
              : "Create a reusable prompt with manually defined variables."}{" "}
            Use bracket keys like <code>[topic]</code> inside the prompt
            content.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="draft-title">Title</Label>
              <Input
                id="draft-title"
                value={draftPrompt.title}
                onChange={(event) =>
                  setDraftPrompt((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                placeholder="Prompt title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-model">AI Model</Label>
              <Input
                id="draft-model"
                value={draftPrompt.model}
                onChange={(event) =>
                  setDraftPrompt((prev) => ({
                    ...prev,
                    model: event.target.value,
                  }))
                }
                placeholder="ChatGPT / Claude / Midjourney"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-category">Category</Label>
              <Input
                id="draft-category"
                value={draftPrompt.category}
                onChange={(event) =>
                  setDraftPrompt((prev) => ({
                    ...prev,
                    category: event.target.value,
                  }))
                }
                placeholder="Writing / Coding / Image Generation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-tags">Tags (comma-separated)</Label>
              <Input
                id="draft-tags"
                value={draftPrompt.tags}
                onChange={(event) =>
                  setDraftPrompt((prev) => ({
                    ...prev,
                    tags: event.target.value,
                  }))
                }
                placeholder="creative, workflow, production"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="draft-image-url">
                Output Image URL (optional)
              </Label>
              <Input
                id="draft-image-url"
                value={draftPrompt.outputImageUrl}
                onChange={(event) =>
                  setDraftPrompt((prev) => ({
                    ...prev,
                    outputImageUrl: event.target.value,
                  }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="draft-image-file">
                Output Image File (optional)
              </Label>
              <Input
                key={imageFileInputKey}
                id="draft-image-file"
                type="file"
                accept="image/*"
                disabled={isSavingPrompt}
                onChange={(event) =>
                  onDraftImageFileChange(event.target.files?.[0] ?? null)
                }
              />
              <p className="text-xs text-zinc-500">
                Kamu bisa upload file gambar langsung. Jika file dipilih, hasil
                upload akan menggantikan URL cover setelah prompt disimpan.
              </p>
              {draftImageFile ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
                  <div className="flex min-w-0 items-center gap-2 text-zinc-300">
                    <ImagePlus className="h-4 w-4 shrink-0 text-indigo-300" />
                    <span className="truncate">{draftImageFile.name}</span>
                    <span className="shrink-0 text-zinc-500">
                      ({Math.ceil(draftImageFile.size / 1024)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => onDraftImageFileChange(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-2">
            <Label htmlFor="draft-content">Prompt Content</Label>
            <Textarea
              id="draft-content"
              value={draftPrompt.content}
              onChange={(event) =>
                setDraftPrompt((prev) => ({
                  ...prev,
                  content: event.target.value,
                }))
              }
              placeholder="Write a story about [topic] in a [tone] voice..."
              className="min-h-[180px] font-mono text-xs"
              required
            />
            <p className="text-xs text-zinc-500">
              Reference variables with square brackets using the exact key, e.g.{" "}
              <code>[topic]</code>.
            </p>
          </section>

          <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Manual Variable System
                </h3>
                <p className="text-xs text-zinc-500">
                  Define each variable with key, label, and type. Dropdown
                  variables support options.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDraftVariables((prev) => [...prev, createBlankVariable()])
                }
              >
                <Plus className="h-4 w-4" />
                Add Variable
              </Button>
            </div>

            <div className="space-y-3">
              {draftVariables.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
                  No variables defined yet.
                </div>
              ) : (
                draftVariables.map((variable) => (
                  <div
                    key={variable.id}
                    className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 md:grid-cols-[1.1fr_1.2fr_0.9fr_auto]"
                  >
                    <div className="space-y-2">
                      <Label htmlFor={`${variable.id}-key`}>Key</Label>
                      <Input
                        id={`${variable.id}-key`}
                        value={variable.key}
                        onChange={(event) =>
                          updateDraftVariable(variable.id, {
                            key: event.target.value,
                          })
                        }
                        placeholder="topic"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${variable.id}-label`}>Label</Label>
                      <Input
                        id={`${variable.id}-label`}
                        value={variable.label}
                        onChange={(event) =>
                          updateDraftVariable(variable.id, {
                            label: event.target.value,
                          })
                        }
                        placeholder="Target Topic"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`${variable.id}-type`}>Type</Label>
                      <select
                        id={`${variable.id}-type`}
                        value={variable.type}
                        onChange={(event) =>
                          handleVariableTypeChange(
                            variable.id,
                            event.target.value as PromptVariableType,
                          )
                        }
                        className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {VARIABLE_TYPE_LABELS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeDraftVariable(variable.id)}
                      >
                        Remove
                      </Button>
                    </div>

                    {variable.type === "dropdown" ? (
                      <div className="space-y-2 md:col-span-4">
                        <Label htmlFor={`${variable.id}-options`}>
                          Dropdown Options (comma-separated)
                        </Label>
                        <Input
                          id={`${variable.id}-options`}
                          value={(variable.options ?? []).join(", ")}
                          onChange={(event) =>
                            updateDraftVariable(variable.id, {
                              options: parseDropdownOptions(event.target.value),
                            })
                          }
                          placeholder="formal, casual, persuasive"
                        />
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSavingPrompt}>
              {isSavingPrompt
                ? "Saving..."
                : isEditMode
                  ? "Update Prompt"
                  : "Save Prompt"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
