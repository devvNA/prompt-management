export type PromptVariableType = "short_text" | "long_text" | "dropdown";

export interface PromptVariable {
  id: string;
  key: string;
  label: string;
  type: PromptVariableType;
  options?: string[];
}

export interface PromptItem {
  id: string;
  title: string;
  model: string;
  category: string;
  tags: string[];
  content: string;
  variables: PromptVariable[];
  outputImageUrl?: string;
  createdAt: string;
}

