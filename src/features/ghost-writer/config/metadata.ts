import { BookOpen, FileText, Languages, ListOrdered, PenLine, Repeat2, Search, type LucideIcon } from "lucide-react";
import { BOOK_LABELS } from "@/lib/bookCatalog";
import type { AiActionId, AiPanelScope, AppActionId, AppPanelScope, MacroActionId, ParameterPanelHeaderMeta, ParameterPanelTarget } from "@/features/ghost-writer/types";

export const BOOK_OPTION_LABELS: Record<string, string> = BOOK_LABELS;

export const ACTION_PANEL_BUTTONS_BY_SCOPE: Record<AiPanelScope, AiActionId[]> = {
  actions: ["dictionary", "synonyms", "antonyms", "etymology", "cognatos"],
  rewriting: ["rewrite", "summarize", "epigraph"],
  translation: ["translate", "dict_lookup"],
  customized_prompts: [ "analogies", "comparisons", "examples", "counterpoints", "neoparadigma", "ai_command"],
  ai_command: [],
};

export const APP_PANEL_BUTTONS_BY_SCOPE: Record<AppPanelScope, AppActionId[]> = {
  bibliografia: ["app1", "app2", "app3", "app6"],
  busca_termos: ["app4", "app5", "app13"],
  semantic_search: ["app12"],
  verbetografia: ["app8", "app9", "app10", "app11"],
};

export const MACRO_PANEL_BUTTONS: MacroActionId[] = ["macro1", "macro2"];

export const ACTION_PANEL_ICONS: Record<AiActionId, LucideIcon> = {
  synonyms: Repeat2,
  antonyms: Repeat2,
  etymology: Search,
  dictionary: BookOpen,
  epigraph: Search,
  cognatos: Search,
  rewrite: PenLine,
  summarize: FileText,
  translate: Languages,
  dict_lookup: Search,
  ai_command: PenLine,
  analogies: PenLine,
  comparisons: PenLine,
  examples: PenLine,
  counterpoints: PenLine,
  neoparadigma: PenLine,
};

export const APP_PANEL_ICONS: Record<AppActionId, LucideIcon> = {
  app1: BookOpen,
  app2: Repeat2,
  app3: Search,
  app4: Search,
  app13: Search,
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
  app1: { title: "Bibliografia de Livros", description: "Monta Bibliografia de obras Waldo Vieira." },
  app2: { title: "Bibliografia de Verbetes", description: "Monta Bibliografia de verbetes." },
  app3: { title: "Bibliografia Autores", description: "Monta bibliografia de autores diversos." },
  app4: { title: "Busca em Livros", description: "Busca termos nos livros de Waldo Vieira." },
  app13: { title: "Lexical Overview", description: "Busca o termo em todos os livros." },
  app5: { title: "Busca em Verbetes", description: "Busca termos nos verbetes em geral." },
  app6: { title: "Bibliografia Externa", description: "Busca referencias externas na internet." },
  app12: { title: "Semantic Search", description: "Busca semantica por similaridade." },
  app7: { title: "Tabela Automatizada", description: "Abre tabela Word e editor HTML." },
  app8: { title: "Definologia", description: "Gera Definologia do verbete." },
  app9: { title: "Sinonimologia", description: "Gera Sinonimologia do verbete." },
  app10: { title: "Fatologia", description: "Gera Fatologia do verbete." },
  app11: { title: "Frase Enfatica", description: "Gera Frase Enfatica do verbete." },
};

export const parameterMacroMeta: Record<MacroActionId, { title: string; description: string }> = {
  macro1: { title: "Highlight", description: "Destaca termos no documento." },
  macro2: { title: "Numerar lista", description: "Aplica numeracao manual a lista de itens." },
};

export const parameterActionMeta: Record<AiActionId, { title: string; description: string }> = {
  dictionary: { title: "Definicao", description: "Definicao dicionarizada." },
  synonyms: { title: "Sinonimia", description: "Lista de sinonimos." },
  antonyms: { title: "Antonimia", description: "Lista de antonimos." },
  etymology: { title: "Etimologia", description: "Etimologia do termo." },
  cognatos: { title: "Cognatos", description: "Cognatos do termo." },
  epigraph: { title: "Epigrafe", description: "Sugere epigrafe do termo." },
  rewrite: { title: "Reescrever", description: "Melhora clareza e fluidez." },
  summarize: { title: "Resumir", description: "Sintese concisa." },
  translate: { title: "Traduzir", description: "Traduz para o idioma selecionado." },
  dict_lookup: { title: "Dicionarios", description: "Consulta dicionarios online." },
  ai_command: { title: "Comando IA", description: "Envia uma query livre para a LLM." },
  analogies: { title: "Analogias", description: "Analogias da Conscienciologia." },
  comparisons: { title: "Comparacoes", description: "Comparacoes na Conscienciologia." },
  examples: { title: "Exemplos", description: "Exemplos segundo a Conscienciologia." },
  counterpoints: { title: "Contrapontos", description: "Contrapontos pela Conscienciologia." },
  neoparadigma: { title: "Neoparadigma", description: "Analise comparativa paradigmatica." },
};

export const getAiPanelScopeByAction = (id: AiActionId): AiPanelScope =>
  id === "ai_command"
    ? "ai_command"
    : ACTION_PANEL_BUTTONS_BY_SCOPE.rewriting.includes(id)
      ? "rewriting"
      : ACTION_PANEL_BUTTONS_BY_SCOPE.translation.includes(id)
        ? "translation"
        : ACTION_PANEL_BUTTONS_BY_SCOPE.customized_prompts.includes(id)
          ? "customized_prompts"
          : "actions";

export const getParameterPanelTargetByAiAction = (id: AiActionId): ParameterPanelTarget => {
  const section = getAiPanelScopeByAction(id);

  switch (section) {
    case "actions":
      return { section, id };
    case "rewriting":
      return { section, id };
    case "translation":
      return { section, id };
    case "customized_prompts":
      return { section, id };
    case "ai_command":
      return { section, id };
    default:
      return null;
  }
};

export const getParameterPanelTargetByAiActionInSection = (
  id: AiActionId,
  section: Extract<AiPanelScope, "actions" | "rewriting" | "translation" | "customized_prompts" | "ai_command">,
): ParameterPanelTarget => ({ section, id });

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
      return { title: "Termos & Conceitos", description: "Definir, sinonimos, etimologia e cognatos" };
    case "rewriting":
      return { title: "Trechos & Parágrafos", description: "Reescrever, resumir e criar epigrafe" };
    case "ai_command":
      return { title: "Comando IA", description: "Envia uma query livre para a LLM" };
    case "translation":
      return { title: "Tradução & Dicionário", description: "Traduzir texto e consultar termos" };
    case "customized_prompts":
      return { title: "Customized Prompts", description: "Painel de prompts customizados" };
    case "applications":
      return { title: "Aplicativos", description: "Cons-IA, Bibliomancia, Canal de Vídeos, PDFs" };
    case "apps":
      if (target.id === "app12") return { title: "Semantic Search", description: "Busca por afinidade semantica" };
      if (target.id === "app7") return { title: "Tabela Automatizada", description: "Abre tabela Word e editor HTML" };
      if (appScope === "busca_termos") return { title: "Lexical Search", description: "Busca lexica nos livros e verbetes" };
      if (appScope === "verbetografia") return { title: "Seções do Verbete", description: "Escreve seções com auxilio da IA" };
      return { title: "Bibliografia", description: "Busca as referencias bibliograficas" };
    default:
      return { title: "Parameters", description: "" };
  }
};

export const normalizeIdList = (values: string[] | undefined): string[] =>
  [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
