export const NO_VECTOR_STORE_ID = "__none__";
export const SEMANTIC_TITLE_METADATA_KEYS = ["title", "titulo", "verbete", "tema", "cabecalho", "heading"] as const;
export const SEMANTIC_NUMBER_METADATA_KEYS = ["number", "numero", "paragraph_number", "index", "ordem", "id"] as const;
export const LLM_LOG_FONT_MIN = 0.5;
export const LLM_LOG_FONT_MAX = 1.0;
export const LLM_LOG_FONT_STEP = 0.05;
export const LLM_SETTINGS_STORAGE_KEY = "llm_settings_v1";
export const AI_ACTIONS_LLM_SETTINGS_STORAGE_KEY = "ai_actions_llm_settings_v1";
export const BIBLIO_EXTERNA_LLM_SETTINGS_STORAGE_KEY = "biblio_externa_llm_settings_v1";
export const GENERAL_SETTINGS_STORAGE_KEY = "general_settings_v1";
export const BIBLIO_EXTERNA_DEFAULT_SYSTEM_PROMPT = `Você é um assistente especializado em reconstrução de referências bibliográficas acadêmicas.
Sua função é identificar e reconstruir referências completas a partir de uma string bibliográfica livre fornecida pelo usuário.

A string de entrada pode conter:
- apenas parte do título
- nome parcial do autor
- sobrenome incompleto
- ano aproximado
- erros de digitação
- ordem aleatória de elementos

Identificação da obra:
- Utilize raciocínio bibliográfico para identificar a obra mais provável.

Caso existam múltiplas correspondências plausíveis:
- retorne no máximo 3 referências
- ordenadas da maior para a menor probabilidade de correspondência.

Normalização da saída
A saída deve sempre seguir EXATAMENTE o formato:
- **Sobrenome**, Nome; ***Título da obra***; informações adicionais separadas por ";"; ano.
- Não inclua explicações, comentários ou texto adicional.
- Retorne apenas as referências formatadas.

Exemplo
Entrada:
Tocci Digital Systems Principles 2011
Saída:
**Tocci**, Ronald J.; ***Digital Systems: Principles and Applications***; livro; brochura; 912 p.; 11ª ed.; Pearson; Upper Saddle River, NJ; 2011.`;
export const DEFAULT_LOG_FONT_SIZE_PX = 9;
export const DEFAULT_LOG_LINE_HEIGHT_RATIO = 1.1;
export const DEFAULT_DOLLAR_TOKEN = 5.5;
export const CONFIG_PROMPT_ROWS = 5;

export const DESKTOP_PANEL_SIZES_PX = {
  left: { default: 300, min: 300, max: 400 },
  parameter: { default: 300, min: 250, max: 400 },
  right: { default: 400, min: 200, max: 500 },
  json: { default: 300, min: 200, max: 500 },
  editor: { default: 400, min: 200, max: 500 },
} as const;

interface DefaultDesktopPanelLayoutOptions {
  hasCenterPanel: boolean;
  hasJsonPanel: boolean;
  hasEditorPanel: boolean;
  containerWidthPx: number;
}

interface DefaultDesktopPanelLayout {
  left: number;
  parameter: number | null;
  right: number;
  json: number | null;
  editor: number | null;
}

export const getDefaultDesktopPanelLayout = ({
  hasCenterPanel,
  hasJsonPanel,
  hasEditorPanel,
  containerWidthPx,
}: DefaultDesktopPanelLayoutOptions): DefaultDesktopPanelLayout => {
  const left = DESKTOP_PANEL_SIZES_PX.left.default;
  const parameter = hasCenterPanel ? DESKTOP_PANEL_SIZES_PX.parameter.default : null;
  const json = hasJsonPanel ? DESKTOP_PANEL_SIZES_PX.json.default : null;
  const editor = hasEditorPanel ? DESKTOP_PANEL_SIZES_PX.editor.default : null;
  const occupiedWithoutRight = left + (parameter ?? 0) + (json ?? 0) + (editor ?? 0);
  const remainingWidth = Math.max(0, containerWidthPx - occupiedWithoutRight);
  const right = Math.max(DESKTOP_PANEL_SIZES_PX.right.default, remainingWidth);

  return {
    left,
    parameter,
    right,
    json,
    editor,
  };
};
export const DEFAULT_BOOK_SEARCH_MAX_RESULTS = 10;
export const PDF_HEADER_SIGNATURE_RE = /enciclop(?:é|e)dia\s+da\s+conscienciologia/i;
export const CHAT_EDITOR_CONTEXT_MAX_CHARS = 10000;
export const MODEL_PRICING_USD_PER_1M: Record<string, { input: number; cached_input: number; output: number }> = {
  "gpt-5.4-under-272k": { input: 2.5, cached_input: 0.25, output: 15.0 },
  "gpt-5.4-over-272k": { input: 5.0, cached_input: 0.5, output: 22.5 },
  "gpt-5.2": { input: 1.75, cached_input: 0.175, output: 14.0 },
  "gpt-5-mini": { input: 0.25, cached_input: 0.025, output: 2.0 },
  "gpt-4.1-mini": { input: 0.4, cached_input: 0.1, output: 1.6 },
};
