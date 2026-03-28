import type { AiActionId } from "@/features/ghost-writer/types";
import {
  buildAiCommandPrompt,
  buildDefinePrompt,
  buildEpigraphPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildSynonymsPrompt,
  buildTranslatePrompt,
  buildVerbeteDefinologiaPrompt,
  buildVerbeteFatologiaPrompt,
  buildVerbeteFraseEnfaticaPrompt,
  buildVerbeteSinonimologiaPrompt,
  type ChatMessage,
} from "@/lib/openai";

export type ActionSystemPromptId = AiActionId | "app8" | "app9" | "app10" | "app11";

const getFirstSystemPrompt = (messages: ChatMessage[]): string =>
  messages.find((message) => message.role === "system")?.content ?? "";

export const DEFAULT_ACTION_SYSTEM_PROMPTS: Record<ActionSystemPromptId, string> = {
  define: getFirstSystemPrompt(buildDefinePrompt("texto")),
  synonyms: getFirstSystemPrompt(buildSynonymsPrompt("texto")),
  epigraph: getFirstSystemPrompt(buildEpigraphPrompt("texto")),
  rewrite: getFirstSystemPrompt(buildRewritePrompt("texto")),
  summarize: getFirstSystemPrompt(buildSummarizePrompt("texto")),
  translate: getFirstSystemPrompt(buildTranslatePrompt("texto", "Ingles")),
  ai_command: getFirstSystemPrompt(buildAiCommandPrompt("texto", "query")),
  pensatas: "Voce e um pesquisador de pensatas da Conscienciologia. Use exclusivamente o material recuperado pela busca nos arquivos. Retorne ate 10 pensatas, paragrafos ou trechos curtos realmente relacionados ao tema pedido. Se nao houver material suficiente, diga exatamente: Nenhuma correspondencia encontrada na Vector Store LO.",
  app8: getFirstSystemPrompt(buildVerbeteDefinologiaPrompt("titulo: exemplo | especialidade: exemplo")),
  app9: getFirstSystemPrompt(buildVerbeteSinonimologiaPrompt("titulo: exemplo | especialidade: exemplo")),
  app10: getFirstSystemPrompt(buildVerbeteFatologiaPrompt("titulo: exemplo | especialidade: exemplo")),
  app11: getFirstSystemPrompt(buildVerbeteFraseEnfaticaPrompt("titulo: exemplo | especialidade: exemplo")),
};

export const getActionSystemPrompt = (
  prompts: Partial<Record<ActionSystemPromptId, string>>,
  actionId: ActionSystemPromptId | null,
): string => {
  if (!actionId) return "";
  return prompts[actionId] ?? DEFAULT_ACTION_SYSTEM_PROMPTS[actionId] ?? "";
};

export const sanitizeStoredActionSystemPrompts = (value: unknown): Partial<Record<ActionSystemPromptId, string>> => {
  if (!value || typeof value !== "object") return {};

  const next: Partial<Record<ActionSystemPromptId, string>> = {};
  for (const actionId of Object.keys(DEFAULT_ACTION_SYSTEM_PROMPTS) as ActionSystemPromptId[]) {
    const prompt = (value as Record<string, unknown>)[actionId];
    if (typeof prompt === "string") next[actionId] = prompt;
  }
  return next;
};

export const applySystemPromptOverride = (messages: ChatMessage[], systemPrompt: string): ChatMessage[] => {
  const nextMessages = [...messages];
  const systemIndex = nextMessages.findIndex((message) => message.role === "system");

  if (!systemPrompt.trim()) {
    if (systemIndex >= 0) nextMessages.splice(systemIndex, 1);
    return nextMessages;
  }

  if (systemIndex >= 0) {
    nextMessages[systemIndex] = { ...nextMessages[systemIndex], content: systemPrompt };
    return nextMessages;
  }

  return [{ role: "system", content: systemPrompt }, ...nextMessages];
};
