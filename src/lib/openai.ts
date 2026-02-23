export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const apiUrl = (path: string): string => `${API_BASE_URL}${path}`;

// ============================================================
// LLM DEFAULTS (CENTRALIZADOS)
// ============================================================
// Modelo padrao global.
export const LLM_DEFAULT_MODEL = "gpt-4.1-mini";
// Temperatura padrao global.
export const LLM_DEFAULT_TEMPERATURE = 0.7;
// Parametro GPT-5.x (text.verbosity na Responses API).
export const LLM_DEFAULT_GPT5_VERBOSITY: "low" | "medium" | "high" = "low";
// Parametro GPT-5.x (reasoning.effort na Responses API).
export const LLM_DEFAULT_GPT5_EFFORT: "none" | "low" | "medium" | "high" = "none";
// Prompt-base global (aplicado em todas as funcionalidades).
export const LLM_DEFAULT_SYSTEM_PROMPT = "Você é um assistente tutor de Conscienciologia";
// Vector stores vindos de .env.
export const LLM_VECTOR_STORES = (import.meta.env.VITE_OPENAI_VECTOR_STORES as string | undefined)?.trim() || "";
export const LLM_VECTOR_STORE_LO = (import.meta.env.VITE_OPENAI_VECTOR_STORE_LO as string | undefined)?.trim() || "";
export const LLM_VECTOR_STORE_TRANSLATE_RAG =
  (import.meta.env.VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG as string | undefined)?.trim() || "";

// ============================================================
// CHAT DEFAULTS (AJUSTE ESPECIFICO DO CHAT)
// ============================================================
export const CHAT_MODEL = "gpt-5.2";
export const CHAT_TEMPERATURE = LLM_DEFAULT_TEMPERATURE;
export const CHAT_GPT5_VERBOSITY: "low" | "medium" | "high" = LLM_DEFAULT_GPT5_VERBOSITY;
export const CHAT_GPT5_EFFORT: "none" | "low" | "medium" | "high" = LLM_DEFAULT_GPT5_EFFORT;
export const CHAT_MAX_OUTPUT_TOKENS: number | undefined = undefined;
export const CHAT_SYSTEM_PROMPT = `
System: Você é um assistente especializado em Conscienciologia. Baseie respostas exclusivamente nos documentos fornecidos.

# Diretrizes
- Responda sempre em Markdown, com formatação estruturada, objetiva e limpa.
- Responda no idioma do usuário, com tom acadêmico, claro e natural, similar ao de um professor universitário.
- Use só os documentos fornecidos como referência.
- Destaque termos-chave com itálico, negrito ou ambos, conforme contexto.
- Não inclua referências nos textos principais.
- Não mostre na resposta os checklists, planos de etapa ou qualquer processamento interno ao usuário.

# Casos Especiais
- Em perguntas básicas sobre Conscienciologia (ex.: "o que é a Conscienciologia?"), cite o livro "Nossa Evolução", de Waldo Vieira, e recomende o site www.icge.org.br.
- Se não houver dados suficientes nos documentos para responder, informe a insuficiência de informações e sugira que o usuário reformule a pergunta.

# Formatação das Respostas
- Garanta apresentação limpa, objetiva e agradável em Markdown puro.

## Padrão de Saída
Respostas devem seguir o padrão abaixo em Markdown:

# ##Título da Resposta (em negrito, header 1)

**Definologia:** (1 frase breve definindo o tema de modo direto e objetivo, sempre de acordo com a ótica da Conscienciologia)

# **Argumentação:** (em negrito)
- Resposta direta da query do usuário, priorizando as listagens numéricas 01. , 02. , etc
- Se aplicável, use tabelas Markdown para comparações

# **Conclusão:** (em negrito)
 - Breve síntese conclusiva em 1 frase.

# ***Sugestões de Aprofundamento:*** (em negrito-italico)
- Tema sugerido 1
- Tema sugerido 2
`;

export interface ExecuteLLMParams {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  maxOutputTokens?: number;
  gpt5Verbosity?: "low" | "medium" | "high";
  gpt5Effort?: "none" | "low" | "medium" | "high";
  vectorStoreIds?: string[];
  ragQuery?: string;
  vectorMaxResults?: number;
  returnChunksOnly?: boolean;
  tools?: Array<Record<string, unknown>>;
}

export interface ExecuteLLMResult {
  content: string;
  chunks: string[];
}

export async function executeLLM(params: ExecuteLLMParams): Promise<ExecuteLLMResult> {
  const res = await fetch(apiUrl("/api/ai/execute"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model ?? LLM_DEFAULT_MODEL,
      messages: params.messages,
      systemPrompt: params.systemPrompt ?? LLM_DEFAULT_SYSTEM_PROMPT,
      temperature: params.temperature ?? LLM_DEFAULT_TEMPERATURE,
      maxOutputTokens: params.maxOutputTokens,
      gpt5Verbosity: params.gpt5Verbosity ?? LLM_DEFAULT_GPT5_VERBOSITY,
      gpt5Effort: params.gpt5Effort ?? LLM_DEFAULT_GPT5_EFFORT,
      vectorStoreIds: params.vectorStoreIds ?? [],
      ragQuery: params.ragQuery ?? "",
      vectorMaxResults: params.vectorMaxResults ?? 5,
      returnChunksOnly: Boolean(params.returnChunksOnly),
      tools: params.tools ?? null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { content: data.content ?? "", chunks: data.chunks ?? [] };
}

export function buildDefinePrompt(text: string, ragContext?: string): ChatMessage[] {
  const systemBase =
    "Voce e um dicionario especializado em Conscienciologia. Busque nos textos da Conscienciologia fornecidos se ha uma Definologia ou Definicao ja pronta para o termo ou expressao. Caso haja, copie ipsis litteris. Caso nao haja, escreva a definicao clara e concisa. O formato de saida deve ser: <strong>Definologia.</strong> {artigo definido O, Os ou A, As dependendo do genero e do numero do termo de entrada} <em>{termo de entrada}</em> e {definologia ou definicao do termo}.";

  const system = ragContext
    ? `${systemBase}\n\nContexto de referencia:\n${ragContext}`
    : systemBase;

  return [
    { role: "system", content: system },
    { role: "user", content: `Defina: "${text}"` },
  ];
}

export function buildSynonymsPrompt(text: string, ragContext?: string): ChatMessage[] {
  const systemBase =
    "Voce e um especialista em Conscienciologia. Forneca exatamente 10 sinonimos em portugues brasileiro para o termo dado. De preferencia a termos da Conscienciologia. Liste-os numerados.";

  const system = ragContext
    ? `${systemBase}\n\nContexto de referencia:\n${ragContext}`
    : systemBase;

  return [
    { role: "system", content: system },
    { role: "user", content: `Liste 10 sinonimos para: "${text}"` },
  ];
}



export function buildEpigraphPrompt(text: string, ragContext?: string): ChatMessage[] {
  const systemBase =
    "Voce e um especialista em Conscienciologia. Analise o texto fornecido e crie uma única paravra epigrafica que sintetize a ideia central do texto. Dê preferÇencia a termos da Conscienciologia. A saída deve ser uma única palavra em negrito.";

  const system = ragContext
    ? `${systemBase}\n\nContexto de referencia:\n${ragContext}`
    : systemBase;

   return [
    { role: "system", content: system },
    { role: "user", content: `Crie uma palavra epigrafica para: "${text}"` },
  ];
}

export function buildRewritePrompt(text: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "Voce e um editor de textos acadêmicos da Conscienciologia. Reescreva o trecho fornecido, melhorando a clareza, fluidez e elegancia, mantendo o sentido original.",
    },
    { role: "user", content: `Reescreva: "${text}"` },
  ];
}

export function buildSummarizePrompt(text: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "Voce e um especialista em resumos. Resuma o texto fornecido de forma concisa, capturando os pontos principais. De preferencia a termos já exitentes nos documentos da Conscienciologia.",
    },
    { role: "user", content: `Resuma o seguinte texto:\n\n${text}` },
  ];
}

export function buildTranslatePrompt(text: string, targetLanguage: string, ragContext?: string): ChatMessage[] {
  const systemBase =
    "Voce é um tradutor de textos da Conscienciologia. Traduza com fidelidade sem adicionar explicações. Busque SEMPRE por palavras ou termos já traduzidos diretamente para a Conscienciologia (jargões) no material fornecido. APENAS se não encontrar tradução já existente, crie uma tradução nova ou mantenha o termo original em itálico. Preserve estrutura, paragrafos e pontuação. O texto traduzido final deve ser o mais fiel possível ao original, sem adicionar explicações ou comentarios.";
  const system = ragContext
    ? `${systemBase}\n\nContexto terminológico de referência da Conscienciologia(use para padronização terminológica quando aplicável):\n${ragContext}`
    : systemBase;

  return [
    {
      role: "system",
      content: system,
    },
    { role: "user", content: `Traduza para ${targetLanguage}:\n\n${text}` },
  ];
}

export function buildChatPrompt(fullText: string, userMessage: string, history: ChatMessage[]): ChatMessage[] {
  return [
    {
      role: "system",
      content: `Voce e um assistente de escrita profissional, especialista em Conscienciologia. O usuario esta trabalhando no seguinte texto:\n\n---\n${fullText}\n---\n\nAjude com perguntas, sugestoes e instrucoes sobre o texto.`,
    },
    ...history,
    { role: "user", content: userMessage },
  ];
}

export function buildPensataAnalysisPrompt(pensata: string): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "Voce e um especialista em Conscienciologia. Responda em portugues brasileiro, com objetividade e clareza.",
    },
    {
      role: "user",
      content:
        `Analise a seguinte pensata, segundo a Conscienciologia. Apresente a resposta da analise em apenas 1 paragrafo breve. Forneca tambem um exemplo pratico que ilustra a pensata, tambem em 1 paragrafo curto.\n\nPensata:\n"${pensata}"`,
    },
  ];
}
