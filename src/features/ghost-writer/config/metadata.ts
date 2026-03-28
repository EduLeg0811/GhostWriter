import { BookOpen, FileText, Languages, ListOrdered, PenLine, Repeat2, Search, type LucideIcon } from "lucide-react";
import { BOOK_LABELS } from "@/lib/bookCatalog";
import type { AiActionId, AiPanelScope, AppActionId, AppPanelScope, MacroActionId, ParameterPanelHeaderMeta, ParameterPanelTarget } from "@/features/ghost-writer/types";

export const BOOK_OPTION_LABELS: Record<string, string> = BOOK_LABELS;

export const ACTION_PANEL_BUTTONS_BY_SCOPE: Record<AiPanelScope, AiActionId[]> = {
  actions: ["define", "synonyms", "pensatas"],
  rewriting: ["epigraph", "rewrite", "summarize"],
  translation: ["translate"],
};

export const APP_PANEL_BUTTONS_BY_SCOPE: Record<AppPanelScope, AppActionId[]> = {
  bibliografia: ["app1", "app2", "app3", "app6"],
  busca_termos: ["app4", "app5"],
  semantic_search: ["app12"],
  verbetografia: ["app8", "app9", "app10", "app11", "app7"],
};

export const MACRO_PANEL_BUTTONS: MacroActionId[] = ["macro1", "macro2"];

export const ACTION_PANEL_ICONS: Record<AiActionId, LucideIcon> = {
  define: BookOpen,
  synonyms: Repeat2,
  epigraph: Search,
  pensatas: Search,
  rewrite: PenLine,
  summarize: FileText,
  translate: Languages,
  ai_command: PenLine,
};

export const APP_PANEL_ICONS: Record<AppActionId, LucideIcon> = {
  app1: BookOpen,
  app2: Repeat2,
  app3: Search,
  app4: Search,
  app5: Search,
  app6: Search,
  app12: Search,
  app7: FileText,
  app8: BookOpen,
  app11: PenLine,
  app9: Repeat2,
  app10: ListOrdered,
};

export const MACRO_PANEL_ICONS: Record<MacroActionId, LucideIcon> = {
  macro1: BookOpen,
  macro2: ListOrdered,
};

export const parameterAppMeta: Record<AppActionId, { title: string; description: string }> = {
  app1: { title: "Bibliografia de Livros", description: "Monta Bibliografia das obras de Waldo Vieira." },
  app2: { title: "Bibliografia de Verbetes", description: "Monta Bibliografia de verbetes." },
  app3: { title: "Bibliografia Autores", description: "Monta bibliografia de autores diversos." },
  app4: { title: "Busca em Livros", description: "Busca termos nos livros de Waldo Vieira." },
  app5: { title: "Busca em Verbetes", description: "Busca termos nos verbetes em geral." },
  app6: { title: "Bibliografia Externa", description: "Busca referências externas na internet." },
  app12: { title: "Semantic Search", description: "Busca semântica nas bases vetoriais disponíveis." },
  app7: { title: "Tabela Automatizada", description: "Abre tabela Word e editor HTML." },
  app8: { title: "Definologia", description: "Gera Definologia do verbete." },
  app9: { title: "Sinonimologia", description: "Gera Sinonimologia do verbete." },
  app10: { title: "Fatologia", description: "Gera Fatologia do verbete." },
  app11: { title: "Frase Enfática", description: "Gera Frase Enfática do verbete." },
};

export const parameterMacroMeta: Record<MacroActionId, { title: string; description: string }> = {
  macro1: { title: "Highlight", description: "Destaca termos no documento." },
  macro2: { title: "Numerar lista", description: "Aplica numeração manual à lista de itens." },
};

export const parameterActionMeta: Record<AiActionId, { title: string; description: string }> = {
  define: { title: "Definir", description: "Definologia conscienciológica." },
  synonyms: { title: "Sinonímia", description: "Sinonimologia." },
  epigraph: { title: "Epígrafe", description: "Sugere epígrafe." },
  rewrite: { title: "Reescrever", description: "Melhora clareza e fluidez." },
  summarize: { title: "Resumir", description: "Síntese concisa." },
  pensatas: { title: "Pensatas LO", description: "Pensatas afins." },
  translate: { title: "Traduzir", description: "Traduz para o idioma selecionado." },
  ai_command: { title: "Comando IA", description: "Envia uma query livre para a LLM." },
};

export const getAiPanelScopeByAction = (id: AiActionId): AiPanelScope =>
  ACTION_PANEL_BUTTONS_BY_SCOPE.rewriting.includes(id)
    ? "rewriting"
    : ACTION_PANEL_BUTTONS_BY_SCOPE.translation.includes(id)
      ? "translation"
      : "actions";

export const getParameterPanelHeaderMeta = (
  target: ParameterPanelTarget,
  appScope: AppPanelScope | null,
): ParameterPanelHeaderMeta => {
  if (!target) return { title: "Parameters", description: "" };

  switch (target.section) {
    case "document":
      return { title: "Documento", description: "Novo, abrir e editar documento" };
    case "sources":
      return { title: "LLM Sources", description: "Vector stores e arquivos" };
    case "actions":
      if (target.id === "ai_command") return { title: "Comando IA", description: "Envia uma query livre para a LLM" };
      return { title: "Termos & Conceitos", description: "Definir e listar sinonimos" };
    case "rewriting":
      return { title: "Paragrafos & Trechos", description: "Reescrever, resumir e criar epigrafe" };
    case "translation":
      return { title: "Traducao & Dicionario", description: "Traduzir texto e consultar termos" };
    case "applications":
      return { title: "Aplicativos", description: "Cons-IA, Bibliomancia, Canal de Videos, PDFs" };
    case "apps":
      if (target.id === "app12") return { title: "Semantic Search", description: "Busca por afinidade semantica" };
      if (target.id === "app7") return { title: "Tabela Automatizada", description: "Abre tabela Word e editor HTML" };
      if (appScope === "busca_termos") return { title: "Lexical Search", description: "Busca lexica nos livros e verbetes" };
      if (appScope === "verbetografia") return { title: "Verbetografia IA", description: "Tabela automatizada de verbete" };
      return { title: "Bibliografia", description: "Busca as referencias bibliograficas" };
    default:
      return { title: "Parameters", description: "" };
  }
};

export const normalizeIdList = (values: string[] | undefined): string[] =>
  [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
