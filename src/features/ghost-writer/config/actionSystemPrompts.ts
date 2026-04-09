import type { AiActionId } from "@/features/ghost-writer/types";
import {
  buildAnalogiesPrompt,
  buildAiCommandPrompt,
  buildAntonymsConsPrompt,
  buildAntonymsPrompt,
  buildCognatosConsPrompt,
  buildCognatosPrompt,
  buildComparisonsPrompt,
  buildCounterpointsPrompt,
  buildDictLookupPrompt,
  buildDefineConsPrompt,
  buildDefinePrompt,
  buildEtymologyConsPrompt,
  buildEtymologyPrompt,
  buildExamplesPrompt,
  buildEpigraphPrompt,
  buildNeoparadigmaPrompt,
  buildRewritePrompt,
  buildSummarizePrompt,
  buildSynonymsConsPrompt,
  buildSynonymsPrompt,
  buildTranslatePrompt,
  buildVerbeteDefinologiaPrompt,
  buildVerbeteFatologiaPrompt,
  buildVerbeteFraseEnfaticaPrompt,
  buildVerbeteSinonimologiaPrompt,
  type ChatMessage,
} from "@/lib/openai";

export type TermsConceptsBasicActionId = "dictionary" | "synonyms" | "antonyms" | "etymology" | "cognatos";
export type TermsConceptsConsActionSystemPromptId = "dictionaryCons" | "synonymsCons" | "antonymsCons" | "etymologyCons" | "cognatosCons";
export type ActionSystemPromptId =
  | AiActionId
  | TermsConceptsConsActionSystemPromptId
  | "app8"
  | "app9"
  | "app10"
  | "app11";

const getFirstSystemPrompt = (messages: ChatMessage[] | unknown): string => {
  if (!Array.isArray(messages)) return "";
  return messages.find((message) => message?.role === "system")?.content ?? "";
};

export const DEFAULT_ACTION_SYSTEM_PROMPTS: Record<ActionSystemPromptId, string> = {
  synonyms: getFirstSystemPrompt(buildSynonymsPrompt("texto")),
  synonymsCons: getFirstSystemPrompt(buildSynonymsConsPrompt("texto")),
  antonyms: getFirstSystemPrompt(buildAntonymsPrompt("texto")),
  antonymsCons: getFirstSystemPrompt(buildAntonymsConsPrompt("texto")),
  etymology: getFirstSystemPrompt(buildEtymologyPrompt("texto")),
  etymologyCons: getFirstSystemPrompt(buildEtymologyConsPrompt("texto")),
  dictionary: getFirstSystemPrompt(buildDefinePrompt("texto")),
  dictionaryCons: getFirstSystemPrompt(buildDefineConsPrompt("texto")),
  epigraph: getFirstSystemPrompt(buildEpigraphPrompt("texto")),
  rewrite: getFirstSystemPrompt(buildRewritePrompt("texto")),
  summarize: getFirstSystemPrompt(buildSummarizePrompt("texto")),
  translate: getFirstSystemPrompt(buildTranslatePrompt("texto", "Ingles")),
  dict_lookup: getFirstSystemPrompt(buildDictLookupPrompt("texto")),
  ai_command: getFirstSystemPrompt(buildAiCommandPrompt("texto", "query")),
  analogies: getFirstSystemPrompt(buildAnalogiesPrompt("texto")),
  comparisons: getFirstSystemPrompt(buildComparisonsPrompt("texto")),
  examples: getFirstSystemPrompt(buildExamplesPrompt("texto")),
  counterpoints: getFirstSystemPrompt(buildCounterpointsPrompt("texto")),
  neoparadigma: getFirstSystemPrompt(buildNeoparadigmaPrompt("texto")),
  cognatos: getFirstSystemPrompt(buildCognatosPrompt("texto")),
  cognatosCons: getFirstSystemPrompt(buildCognatosConsPrompt("texto")),
  app8: getFirstSystemPrompt(buildVerbeteDefinologiaPrompt("titulo: exemplo | especialidade: exemplo")),
  app9: getFirstSystemPrompt(buildVerbeteSinonimologiaPrompt("titulo: exemplo | especialidade: exemplo")),
  app10: getFirstSystemPrompt(buildVerbeteFatologiaPrompt("titulo: exemplo | especialidade: exemplo")),
  app11: getFirstSystemPrompt(buildVerbeteFraseEnfaticaPrompt("titulo: exemplo | especialidade: exemplo")),
};

const TERMS_CONCEPTS_CONS_PROMPT_IDS: Record<TermsConceptsBasicActionId, TermsConceptsConsActionSystemPromptId> = {
  dictionary: "dictionaryCons",
  synonyms: "synonymsCons",
  antonyms: "antonymsCons",
  etymology: "etymologyCons",
  cognatos: "cognatosCons",
};

export const getTermsConceptsActionSystemPromptId = (
  actionId: TermsConceptsBasicActionId | null,
  isConscienciografiaEnabled: boolean,
): ActionSystemPromptId | null => {
  if (!actionId) return null;
  return isConscienciografiaEnabled ? TERMS_CONCEPTS_CONS_PROMPT_IDS[actionId] : actionId;
};

export const getActionSystemPrompt = (
  prompts: Partial<Record<ActionSystemPromptId, string>> | undefined,
  actionId: ActionSystemPromptId | null,
): string => {
  if (!actionId) return "";
  return prompts?.[actionId] ?? DEFAULT_ACTION_SYSTEM_PROMPTS[actionId] ?? "";
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
