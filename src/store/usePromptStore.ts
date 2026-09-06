import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PromptTemplate = {
  id: string;
  name: string;
  content: string;
  category: string;
  isSystem: boolean;
  updatedAt: number;
};

interface PromptState {
  templates: PromptTemplate[];
  addTemplate: (template: Omit<PromptTemplate, 'id' | 'updatedAt'>) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set) => ({
      templates: [
        {
          id: "1",
          name: "Expert Senior Developer",
          category: "Coding",
          content: "You are a senior full-stack developer with 20 years of experience. Provide concise, performant, and secure code. Always explain your reasoning and point out potential edge cases.",
          isSystem: true,
          updatedAt: Date.now()
        },
        {
          id: "2",
          name: "Creative Content Strategist",
          category: "Writing",
          content: "You are an expert content strategist. Your tone is engaging and professional. Focus on SEO optimization, viral potential, and brand consistency.",
          isSystem: true,
          updatedAt: Date.now()
        }
      ],
      addTemplate: (t) => set((state) => ({
        templates: [{ ...t, id: crypto.randomUUID(), updatedAt: Date.now() }, ...state.templates]
      })),
      removeTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id)
      })),
      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t)
      })),
    }),
    {
      name: "omni-prompts-v1",
      storage: createJSONStorage(() => localStorage),
    }
  )
);