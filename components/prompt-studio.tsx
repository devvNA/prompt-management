"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  Plus,
  Search,
  Sparkles,
  Tags
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AddPromptSheet,
  type DraftPrompt,
} from "@/components/add-prompt-sheet";
import { ExecutionSheet } from "@/components/execution-sheet";
import { PromptCard } from "@/components/prompt-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createPromptApi,
  deletePromptApi,
  fetchPromptsApi,
  reorderPromptsApi,
  updatePromptApi,
  uploadPromptResultImageApi,
} from "@/lib/prompt-api";
import {
  normalizeVariableKey,
  parseTags,
  replacePromptVariables,
} from "@/lib/prompt-utils";
import type { PromptItem, PromptVariable } from "@/lib/types";

function SortablePromptCard({
  prompt,
  isDragDisabled,
  onOpen,
  onQuickCopy,
  onEdit,
  onDelete,
}: {
  prompt: PromptItem;
  isDragDisabled: boolean;
  onOpen: () => void;
  onQuickCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prompt.id, disabled: isDragDisabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PromptCard
        prompt={prompt}
        onOpen={onOpen}
        onQuickCopy={onQuickCopy}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

const FILTER_SELECT_CLASSNAME =
  "h-11 w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 pr-10 text-sm text-zinc-50 shadow-inner shadow-black/10 outline-none transition-colors hover:border-zinc-700 focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50";

function createEmptyDraft(): DraftPrompt {
  return {
    title: "",
    model: "ChatGPT",
    category: "Writing",
    tags: "",
    content: "",
    outputImageUrl: "",
  };
}

export function PromptStudio() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [modelFilter, setModelFilter] = useState("All");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [executionValues, setExecutionValues] = useState<
    Record<string, string>
  >({});
  const [execSheetOpen, setExecSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState<DraftPrompt>(createEmptyDraft);
  const [draftVariables, setDraftVariables] = useState<PromptVariable[]>([]);
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null);
  const [draftImageFileInputKey, setDraftImageFileInputKey] = useState(0);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  const selectedPrompt =
    prompts.find((item) => item.id === selectedPromptId) ?? null;

  useEffect(() => {
    if (!selectedPrompt) return;
    const nextValues: Record<string, string> = {};
    selectedPrompt.variables.forEach((variable) => {
      nextValues[variable.key] =
        variable.type === "dropdown" && variable.options?.length
          ? (variable.options[0] ?? "")
          : "";
    });
    setExecutionValues(nextValues);
    setUploadStatus(null);
  }, [selectedPromptId, selectedPrompt?.variables]);

  useEffect(() => {
    if (!flashMessage) return;
    const timeoutId = window.setTimeout(() => setFlashMessage(null), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [flashMessage]);

  useEffect(() => {
    void loadPrompts();
  }, []);

  async function loadPrompts() {
    setIsLoadingPrompts(true);
    setLoadError(null);

    try {
      const { prompts: nextPrompts, total } = await fetchPromptsApi();
      setPrompts(nextPrompts);
      setTotalCount(total);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load prompts";
      setLoadError(message);
    } finally {
      setIsLoadingPrompts(false);
    }
  }

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(new Set(prompts.map((prompt) => prompt.category))).sort(),
    ],
    [prompts],
  );

  const models = useMemo(
    () => [
      "All",
      ...Array.from(new Set(prompts.map((prompt) => prompt.model))).sort(),
    ],
    [prompts],
  );

  const filteredPrompts = prompts.filter((prompt) => {
    const q = deferredSearch.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      prompt.title.toLowerCase().includes(q) ||
      prompt.content.toLowerCase().includes(q) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      prompt.model.toLowerCase().includes(q);

    const matchesCategory =
      categoryFilter === "All" || prompt.category === categoryFilter;
    const matchesModel = modelFilter === "All" || prompt.model === modelFilter;

    return matchesSearch && matchesCategory && matchesModel;
  });

  const isFiltersActive =
    search.trim().length > 0 ||
    categoryFilter !== "All" ||
    modelFilter !== "All";

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 300, tolerance: 5 },
    }),
  );

  const activePrompt = activeId
    ? (prompts.find((p) => p.id === activeId) ?? null)
    : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPrompts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      void reorderPromptsApi(newOrder.map((p) => p.id));
      return newOrder;
    });
  }

  const finalPromptPreview = selectedPrompt
    ? replacePromptVariables(selectedPrompt.content, executionValues)
    : "";

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFlashMessage(`${label} copied`);
    } catch {
      setFlashMessage(`Failed to copy ${label.toLowerCase()}`);
    }
  }

  function openExecutionSheet(prompt: PromptItem) {
    setSelectedPromptId(prompt.id);
    setExecSheetOpen(true);
  }

  function openCreatePromptSheet() {
    setEditingPromptId(null);
    resetAddForm();
    setAddSheetOpen(true);
  }

  function openEditPromptSheet(prompt: PromptItem) {
    setExecSheetOpen(false);
    setEditingPromptId(prompt.id);
    setDraftImageFile(null);
    setDraftImageFileInputKey((prev) => prev + 1);
    setDraftPrompt({
      title: prompt.title,
      model: prompt.model,
      category: prompt.category,
      tags: prompt.tags.join(", "),
      content: prompt.content,
      outputImageUrl: prompt.outputImageUrl ?? "",
    });
    setDraftVariables(
      prompt.variables.map((variable) => ({
        ...variable,
        options: variable.options ? [...variable.options] : [],
      })),
    );
    setAddSheetOpen(true);
  }

  async function deletePrompt(prompt: PromptItem) {
    try {
      await deletePromptApi(prompt.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete prompt";
      setFlashMessage(message);
      return;
    }

    setPrompts((prev) => prev.filter((item) => item.id !== prompt.id));
    setTotalCount((prev) => Math.max(prev - 1, 0));
    if (selectedPromptId === prompt.id) {
      setExecSheetOpen(false);
      setSelectedPromptId(null);
      setUploadStatus(null);
    }
    if (editingPromptId === prompt.id) {
      setEditingPromptId(null);
      setAddSheetOpen(false);
      resetAddForm();
    }
    setFlashMessage("Prompt deleted");
  }

  function resetAddForm() {
    setDraftPrompt(createEmptyDraft());
    setDraftVariables([]);
    setDraftImageFile(null);
    setDraftImageFileInputKey((prev) => prev + 1);
  }

  async function handleAddPromptSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!draftPrompt.title.trim() || !draftPrompt.content.trim()) {
      setFlashMessage("Title and prompt content are required");
      return;
    }

    const cleanedVariables = draftVariables
      .map((variable) => {
        const key = normalizeVariableKey(variable.key);
        return {
          ...variable,
          key,
          label: variable.label.trim(),
          options:
            variable.type === "dropdown"
              ? (variable.options ?? [])
                .map((option) => option.trim())
                .filter(Boolean)
              : undefined,
        };
      })
      .filter((variable) => variable.key && variable.label);

    const payload = {
      title: draftPrompt.title.trim(),
      model: draftPrompt.model.trim() || "Custom",
      category: draftPrompt.category.trim() || "General",
      tags: parseTags(draftPrompt.tags),
      content: draftPrompt.content,
      variables: cleanedVariables,
      outputImageUrl: draftPrompt.outputImageUrl.trim() || undefined,
    };

    setIsSavingPrompt(true);
    try {
      const isEditing = Boolean(editingPromptId);
      let savedPrompt: PromptItem;

      if (editingPromptId) {
        savedPrompt = await updatePromptApi(editingPromptId, payload);
        setSelectedPromptId((prev) =>
          prev === editingPromptId ? editingPromptId : prev,
        );
      } else {
        savedPrompt = await createPromptApi(payload);
      }

      let uploadFailedMessage: string | null = null;
      if (draftImageFile) {
        try {
          const result = await uploadPromptResultImageApi(
            draftImageFile,
            savedPrompt.id,
          );
          savedPrompt = { ...savedPrompt, outputImageUrl: result.url };
        } catch (error) {
          uploadFailedMessage =
            error instanceof Error ? error.message : "Failed to upload image";
        }
      }

      if (isEditing) {
        setPrompts((prev) =>
          prev.map((item) => (item.id === savedPrompt.id ? savedPrompt : item)),
        );
      } else {
        setPrompts((prev) => [savedPrompt, ...prev]);
        setTotalCount((prev) => prev + 1);
      }

      if (uploadFailedMessage) {
        setFlashMessage(
          `${isEditing ? "Prompt updated" : "Prompt added"} (image upload failed: ${uploadFailedMessage})`,
        );
      } else if (draftImageFile) {
        setFlashMessage(
          `${isEditing ? "Prompt updated" : "Prompt added"} + image uploaded`,
        );
      } else {
        setFlashMessage(isEditing ? "Prompt updated" : "Prompt added");
      }

      setAddSheetOpen(false);
      setEditingPromptId(null);
      resetAddForm();
      setLoadError(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save prompt";
      setFlashMessage(message);
    } finally {
      setIsSavingPrompt(false);
    }
  }

  async function handleUploadOutputImage(file: File) {
    if (!selectedPrompt) return;
    setIsUploadingImage(true);
    setUploadStatus("Uploading image...");

    try {
      const result = await uploadPromptResultImageApi(file, selectedPrompt.id);
      setPrompts((prev) =>
        prev.map((prompt) =>
          prompt.id === selectedPrompt.id
            ? { ...prompt, outputImageUrl: result.url }
            : prompt,
        ),
      );
      setUploadStatus("Image uploaded to Supabase Storage.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadStatus(`Upload failed: ${message}`);
    } finally {
      setIsUploadingImage(false);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-zinc-800/70 bg-zinc-900/70 p-5 shadow-2xl lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Prompt Management Studio
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
              Personal Prompt Management
            </h1>
            <p className="max-w-2xl text-sm text-zinc-400">
              Curate, parameterize, and execute reusable prompts with a manual
              variable system and visual output tracking.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={openCreatePromptSheet}>
              <Plus className="h-4 w-4" />
              Add Prompt
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid]">
          <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Search prompts, tags, content, models..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Tags className="h-4 w-4" />
                <span>{filteredPrompts.length} results</span>
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredPrompts.map((p) => p.id)}
                strategy={rectSortingStrategy}
              >
                <div className="prompt-grid">
                  {filteredPrompts.map((prompt) => (
                    <SortablePromptCard
                      key={prompt.id}
                      prompt={prompt}
                      isDragDisabled={isFiltersActive}
                      onOpen={() => openExecutionSheet(prompt)}
                      onQuickCopy={() =>
                        void copyToClipboard(prompt.content, "Raw prompt")
                      }
                      onEdit={() => openEditPromptSheet(prompt)}
                      onDelete={() => void deletePrompt(prompt)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activePrompt ? (
                  <div className="max-w-sm rotate-[2deg] scale-[1.02] cursor-grabbing shadow-2xl shadow-indigo-500/20">
                    <PromptCard
                      prompt={activePrompt}
                      onOpen={() => { }}
                      onQuickCopy={() => { }}
                      onEdit={() => { }}
                      onDelete={() => { }}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {loadError ? (
              <Card className="border-red-900/60 bg-red-950/20">
                <CardContent className="py-10 text-center">
                  <p className="text-red-200">Gagal memuat data Supabase</p>
                  <p className="mt-1 text-sm text-red-300/80">{loadError}</p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => void loadPrompts()}
                    >
                      Coba Lagi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {!loadError && isLoadingPrompts ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-zinc-300">Loading...</p>
                </CardContent>
              </Card>
            ) : null}

            {!loadError && !isLoadingPrompts && filteredPrompts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-zinc-300">
                    {prompts.length === 0
                      ? "Belum ada prompt di database."
                      : "No prompts match the current filters."}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {prompts.length === 0
                      ? "Jalankan seed SQL atau tambahkan prompt baru untuk mulai."
                      : "Try changing search text or clearing filters."}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </section>
        </div>
      </div>

      <ExecutionSheet
        open={execSheetOpen}
        onOpenChange={setExecSheetOpen}
        prompt={selectedPrompt}
        executionValues={executionValues}
        onExecutionValueChange={(key, value) =>
          setExecutionValues((prev) => ({ ...prev, [key]: value }))
        }
        finalPromptPreview={finalPromptPreview}
        onQuickCopyRaw={(text) => void copyToClipboard(text, "Raw prompt")}
        onCopyFinalPrompt={(text) => void copyToClipboard(text, "Final prompt")}
        onUploadFile={(file) => void handleUploadOutputImage(file)}
        uploadStatus={uploadStatus}
        isUploadingImage={isUploadingImage}
        onEditPrompt={() => {
          if (selectedPrompt) openEditPromptSheet(selectedPrompt);
        }}
        onDeletePrompt={() => {
          if (selectedPrompt) void deletePrompt(selectedPrompt);
        }}
      />

      <AddPromptSheet
        open={addSheetOpen}
        onOpenChange={(open) => {
          setAddSheetOpen(open);
          if (!open) {
            setEditingPromptId(null);
            resetAddForm();
          }
        }}
        mode={editingPromptId ? "edit" : "create"}
        draftPrompt={draftPrompt}
        setDraftPrompt={setDraftPrompt}
        draftVariables={draftVariables}
        setDraftVariables={setDraftVariables}
        draftImageFile={draftImageFile}
        onDraftImageFileChange={setDraftImageFile}
        imageFileInputKey={draftImageFileInputKey}
        onSubmit={handleAddPromptSubmit}
        isSavingPrompt={isSavingPrompt}
      />

      {flashMessage ? (
        <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/95 px-4 py-3 text-sm text-zinc-100 shadow-xl animate-toast-in">
          <Check className="h-4 w-4 text-indigo-300" />
          {flashMessage}
        </div>
      ) : null}
    </div>
  );
}
