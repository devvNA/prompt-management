"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Clipboard,
  Copy,
  ImagePlus,
  Pencil,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import type { PromptItem } from "@/lib/types";

const MODEL_BADGE_VARIANTS: Record<string, "indigo" | "default" | "muted"> = {
  ChatGPT: "indigo",
  Claude: "default",
  Midjourney: "muted",
};

interface ExecutionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PromptItem | null;
  executionValues: Record<string, string>;
  onExecutionValueChange: (key: string, value: string) => void;
  finalPromptPreview: string;
  onQuickCopyRaw: (text: string) => void;
  onCopyFinalPrompt: (text: string) => void;
  onUploadFile: (file: File) => void;
  uploadStatus: string | null;
  isUploadingImage: boolean;
  onEditPrompt: () => void;
  onDeletePrompt: () => void;
}

export function ExecutionSheet({
  open,
  onOpenChange,
  prompt,
  executionValues,
  onExecutionValueChange,
  finalPromptPreview,
  onQuickCopyRaw,
  onCopyFinalPrompt,
  onUploadFile,
  uploadStatus,
  isUploadingImage,
  onEditPrompt,
  onDeletePrompt,
}: ExecutionSheetProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full max-w-2xl overflow-y-auto p-0"
        >
          <AnimatePresence mode="wait">
            {prompt ? (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <SheetHeader className="border-b border-zinc-800 bg-zinc-900/70 pr-14">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={MODEL_BADGE_VARIANTS[prompt.model] ?? "default"}
                    >
                      {prompt.model}
                    </Badge>
                    <Badge variant="muted">{prompt.category}</Badge>
                  </div>
                  <SheetTitle>{prompt.title}</SheetTitle>
                  <SheetDescription>
                    Fill the generated form from your manual variables, then
                    copy the final prompt with substitutions.
                  </SheetDescription>
                  <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" variant="ghost" onClick={onEditPrompt}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        onOpenChange(false); // Close the Sheet
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </SheetHeader>

                <div className="space-y-6 p-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                        Prompt Template
                      </h3>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onQuickCopyRaw(prompt.content)}
                      >
                        <Copy className="h-4 w-4" />
                        Quick Copy
                      </Button>
                    </div>
                    <Textarea
                      value={prompt.content}
                      readOnly
                      className="min-h-[130px] font-mono text-xs"
                    />
                  </section>

                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                      Execution Variables
                    </h3>
                    {prompt.variables.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
                        This prompt has no manual variables. You can copy it
                        directly.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {prompt.variables.map((variable) => (
                          <div key={variable.id} className="space-y-2">
                            <Label htmlFor={`exec-${variable.id}`}>
                              {variable.label}{" "}
                              <span className="font-mono text-xs text-zinc-500">
                                [{variable.key}]
                              </span>
                            </Label>

                            {variable.type === "long_text" ? (
                              <Textarea
                                id={`exec-${variable.id}`}
                                placeholder={`Enter ${variable.label.toLowerCase()}`}
                                value={executionValues[variable.key] ?? ""}
                                onChange={(event) =>
                                  onExecutionValueChange(
                                    variable.key,
                                    event.target.value,
                                  )
                                }
                              />
                            ) : variable.type === "dropdown" ? (
                              <select
                                id={`exec-${variable.id}`}
                                value={executionValues[variable.key] ?? ""}
                                onChange={(event) =>
                                  onExecutionValueChange(
                                    variable.key,
                                    event.target.value,
                                  )
                                }
                                className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 text-sm text-zinc-50 outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                {(variable.options ?? []).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                id={`exec-${variable.id}`}
                                placeholder={`Enter ${variable.label.toLowerCase()}`}
                                value={executionValues[variable.key] ?? ""}
                                onChange={(event) =>
                                  onExecutionValueChange(
                                    variable.key,
                                    event.target.value,
                                  )
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">
                        Final Prompt
                      </h3>
                      <Button
                        size="sm"
                        onClick={() => onCopyFinalPrompt(finalPromptPreview)}
                      >
                        <Clipboard className="h-4 w-4" />
                        Copy Final Prompt
                      </Button>
                    </div>
                    <Textarea
                      value={finalPromptPreview}
                      readOnly
                      className="min-h-[160px] font-mono text-xs"
                    />
                  </section>

                  <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                      <ImagePlus className="h-4 w-4 text-indigo-300" />
                      Upload Output Image
                    </div>
                    <p className="text-xs text-zinc-500">
                      Upload your generated result to Supabase Storage. If
                      Supabase is not configured, a local preview is attached
                      for this session.
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) onUploadFile(file);
                      }}
                    />
                    {uploadStatus ? (
                      <p className="text-xs text-zinc-400">{uploadStatus}</p>
                    ) : null}
                    {prompt.outputImageUrl ? (
                      <div
                        className="group/image relative cursor-pointer overflow-hidden rounded-xl border border-zinc-800"
                        onClick={() => {
                          onOpenChange(false);
                          setIsImageModalOpen(true);
                        }}
                      >
                        <img
                          src={prompt.outputImageUrl}
                          alt={`${prompt.title} output`}
                          className="max-h-96 w-full object-contain transition duration-300 group-hover/image:scale-[1.02]"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover/image:bg-black/20">
                          <div className="rounded-full border border-white/30 bg-black/50 p-2 opacity-0 transition duration-300 group-hover/image:opacity-100">
                            <ZoomIn className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Prompt"
        description={
          prompt
            ? `Are you sure you want to delete "${prompt.title}"? This action cannot be undone and will permanently remove this prompt and all associated data.`
            : "Are you sure you want to delete this prompt?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => {
          onDeletePrompt(); // Execute delete
        }}
      />

      {/* Image Zoom Modal - Rendered outside Sheet to avoid overflow constraints */}
      <AnimatePresence>
        {isImageModalOpen && prompt?.outputImageUrl ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <button
              name="close-image-modal"
              aria-label="close"
              className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/60 p-2 text-white shadow-lg transition hover:bg-white/20 hover:scale-105"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={prompt.outputImageUrl}
              alt={`${prompt.title} output zoomed`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
