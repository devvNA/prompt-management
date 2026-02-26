import type { PromptItem } from "@/lib/types";

export const seededPrompts: PromptItem[] = [
  {
    id: "prompt_midjourney_city",
    title: "Neon Rain Street Scene",
    model: "Midjourney",
    category: "Image Generation",
    tags: ["cinematic", "cyberpunk", "lighting"],
    content:
      "A cinematic night street in [city], neon reflections on wet pavement, moody fog, ultra-detailed storefronts, people with umbrellas, volumetric lighting, 35mm photography aesthetic --ar 16:9 --stylize 250",
    variables: [
      {
        id: "v_city",
        key: "city",
        label: "City Name",
        type: "short_text"
      }
    ],
    outputImageUrl: "https://picsum.photos/seed/prompt-midjourney/1200/900",
    createdAt: new Date().toISOString()
  },
  {
    id: "prompt_chatgpt_story",
    title: "Short Story Draft Composer",
    model: "ChatGPT",
    category: "Writing",
    tags: ["storytelling", "creative-writing", "drafting"],
    content:
      "Write a compelling 700-word short story about [topic]. The writing style should feel [tone]. Include a surprising midpoint twist and end with an emotionally resonant final line.",
    variables: [
      {
        id: "v_topic",
        key: "topic",
        label: "Target Topic",
        type: "short_text"
      },
      {
        id: "v_tone",
        key: "tone",
        label: "Tone",
        type: "dropdown",
        options: ["whimsical", "suspenseful", "melancholic", "hopeful"]
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "prompt_claude_refactor",
    title: "Claude Refactor Review",
    model: "Claude",
    category: "Coding",
    tags: ["refactor", "code-review", "architecture"],
    content:
      "You are a senior engineer. Refactor the following [language] code for readability and maintainability. Explain the changes and trade-offs. Focus area: [focus_area]. Code:\\n\\n[paste_code]",
    variables: [
      {
        id: "v_language",
        key: "language",
        label: "Language",
        type: "dropdown",
        options: ["TypeScript", "Python", "Dart", "Go"]
      },
      {
        id: "v_focus",
        key: "focus_area",
        label: "Focus Area",
        type: "short_text"
      },
      {
        id: "v_code",
        key: "paste_code",
        label: "Code Snippet",
        type: "long_text"
      }
    ],
    createdAt: new Date().toISOString()
  }
];

