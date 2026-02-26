"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy, ImageOff, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { PromptItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODEL_BADGE_VARIANTS: Record<string, "indigo" | "default" | "muted"> = {
  ChatGPT: "indigo",
  Claude: "default",
  Midjourney: "muted",
};

export function PromptCard({
  prompt,
  onOpen,
  onQuickCopy,
  onEdit,
  onDelete,
}: {
  prompt: PromptItem;
  onOpen: () => void;
  onQuickCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const normalizedOutputImageUrl = useMemo(
    () => prompt.outputImageUrl?.trim() || "",
    [prompt.outputImageUrl]
  );
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [normalizedOutputImageUrl]);

  const showCoverImage = Boolean(normalizedOutputImageUrl) && !imageLoadFailed;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
        className="group overflow-hidden border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 transition hover:-translate-y-0.5 hover:border-indigo-500/30"
      >
        <div className="relative h-44 overflow-hidden border-b border-zinc-800">
          {showCoverImage ? (
            <img
              src={normalizedOutputImageUrl}
              alt={`${prompt.title} cover`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <div className="relative h-full w-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.08),transparent_35%)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <div className="rounded-2xl border border-zinc-700/80 bg-zinc-900/80 p-3 text-zinc-400">
                  <ImageOff className="h-5 w-5" />
                </div>
                <p className="px-4 text-xs font-medium text-zinc-300">
                  No output image yet
                </p>
                <p className="px-4 text-[11px] text-zinc-500">
                  Upload result image from prompt detail
                </p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-950/20 to-transparent" />
          <div className="absolute left-3 top-3">
            <Badge variant={MODEL_BADGE_VARIANTS[prompt.model] ?? "default"}>
              {prompt.model}
            </Badge>
          </div>
        </div>

        <CardHeader className={cn("pt-4")}>
          <div className="mb-2">
            <Badge variant="muted">{prompt.category}</Badge>
          </div>
          <CardTitle className="text-base">{prompt.title}</CardTitle>
          <CardDescription className="line-clamp-3 text-zinc-400">
            {prompt.content.slice(0, 150)}
            {prompt.content.length > 150 ? "..." : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-300"
              >
                #{tag}
              </span>
            ))}
            {prompt.tags.length === 0 ? (
              <span className="rounded-full border border-dashed border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-500">
                no tags
              </span>
            ) : null}
          </div>

          {prompt.variables.length > 0 ? (
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs">
              <div className="text-zinc-400">Variables</div>
              <div className="font-mono text-zinc-200">
                {prompt.variables.length}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="flex-1"
              onClick={(event) => {
                event.stopPropagation();
                onOpen();
              }}
            >
              Open
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Quick copy ${prompt.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onQuickCopy();
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Edit ${prompt.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              aria-label={`Delete ${prompt.title}`}
              onClick={(event) => {
                event.stopPropagation();
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Prompt"
        description={`Are you sure you want to delete "${prompt.title}"? This action cannot be undone and will permanently remove this prompt and all associated data.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  );
}
