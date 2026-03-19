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
export const LLM_VECTOR_STORE_TRANSLATE_RAG = (import.meta.env.VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG as string | undefined)?.trim() || "";

// ============================================================
// CHAT DEFAULTS (AJUSTE ESPECIFICO DO CHAT)
// ============================================================
export const CHAT_MODEL = "gpt-4.1-mini";
export const CHAT_TEMPERATURE = LLM_DEFAULT_TEMPERATURE;
export const CHAT_GPT5_VERBOSITY: "low" | "medium" | "high" = LLM_DEFAULT_GPT5_VERBOSITY;
export const CHAT_GPT5_EFFORT: "none" | "low" | "medium" | "high" = LLM_DEFAULT_GPT5_EFFORT;
export const CHAT_MAX_OUTPUT_TOKENS: number | undefined = 500;
export const CHAT_MAX_NUM_RESULTS = 5;
export const CHAT_SYSTEM_PROMPT = `
You are a plainspoken and direct AI assistant focused on helping the user achieve productive outcomes. 
You are an expert in Conscientiology (Waldo Vieira).
Be open‑minded but do not agree with claims that conflict with evidence.
When giving feedback, be clear and corrective without sugarcoating. 
Adapt encouragement based on the user’s context. Deliver criticism with kindness and support.
Ground all claims in the information provided. 
If the input is ambiguous, underspecified, or lacks evidence:
- Call that out explicitly.
- State assumptions clearly, or ask concise clarifying questions.
- Do not guess or fill gaps with fabricated details.
- If you search the web, cite the sources.

Do not fabricate facts, numbers, sources, or citations. 
If you are unsure, say so and explain what additional information is needed.
Don't tell that the information is not based on the conventional science, because Conscientiology is, itself, a new Science.
Do not use emojis. Do not automatically force this personality onto written artifacts; let context and user intent guide style.

Always use clean Markdown to enphasize important words, terms and titles.
Give your responses in the language of the user's query (most likely BrazilianPortuguese), preferably using the terminology from Conscientiology.
`



export interface ExecuteLLMParams {
  messages: ChatMessage[];
  previousResponseId?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  maxOutputTokens?: number;
  gpt5Verbosity?: "low" | "medium" | "high";
  gpt5Effort?: "none" | "low" | "medium" | "high";
  vectorStoreIds?: string[];
  inputFileIds?: string[];
  vectorMaxResults?: number;
  tools?: Array<Record<string, unknown>>;
}

export interface UploadedLlmFile {
  id: string;
  filename: string;
  bytes: number;
  purpose: string;
  mimeType?: string;
}

export interface ExecuteLLMResult {
  content: string;
  meta?: {
    id?: string;
    model?: string;
    status?: string;
    created_at?: number | string;
    temperature_requested?: number;
    max_output_tokens_requested?: number | null;
    gpt5_verbosity_requested?: string | null;
    gpt5_effort_requested?: string | null;
    usage?: Record<string, unknown>;
    rag_references?: string[];
  };
}

export async function executeLLM(params: ExecuteLLMParams): Promise<ExecuteLLMResult> {
  const vectorStoreIds = params.vectorStoreIds?.map((id) => id.trim()).filter(Boolean);
  const inputFileIds = params.inputFileIds?.map((id) => id.trim()).filter(Boolean);
  const tools = params.tools?.filter(Boolean);
  const body: Record<string, unknown> = {
    model: params.model ?? LLM_DEFAULT_MODEL,
    messages: params.messages,
    previousResponseId: params.previousResponseId,
    systemPrompt: params.systemPrompt ?? LLM_DEFAULT_SYSTEM_PROMPT,
    temperature: params.temperature ?? LLM_DEFAULT_TEMPERATURE,
    maxOutputTokens: params.maxOutputTokens,
    gpt5Verbosity: params.gpt5Verbosity ?? LLM_DEFAULT_GPT5_VERBOSITY,
    gpt5Effort: params.gpt5Effort ?? LLM_DEFAULT_GPT5_EFFORT,
    vectorMaxResults: params.vectorMaxResults ?? 5,
  };
  if (vectorStoreIds && vectorStoreIds.length > 0) body.vectorStoreIds = vectorStoreIds;
  if (inputFileIds && inputFileIds.length > 0) body.inputFileIds = inputFileIds;
  if (tools && tools.length > 0) body.tools = tools;

  const res = await fetch(apiUrl("/api/ai/execute"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return { content: data.content ?? "", meta: data.meta ?? undefined };
}

export async function uploadLlmSourceFiles(files: File[]): Promise<UploadedLlmFile[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(apiUrl("/api/ai/files/upload"), {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI file upload error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
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
    "Voce e um especialista em Conscienciologia. Analise o texto fornecido e crie uma única paravra epigrafica que sintetize a ideia central do texto. Dê preferencia a termos da Conscienciologia. A saída deve ser uma única palavra em negrito.";

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
    ? `${systemBase}\n\nContexto terminológico de referência da Conscienciologia (use para padronização terminológica quando aplicável):\n${ragContext}`
    : systemBase;

  return [
    {
      role: "system",
      content: system,
    },
    { role: "user", content: `Traduza para ${targetLanguage}:\n\n${text}` },
  ];
}

export function buildChatPrompt(
  userMessage: string,
  history: ChatMessage[],
  editorPlainTextContext?: string,
  editorContextTruncated = false,
  includeEditorContext = true,
): ChatMessage[] {
  const messages: ChatMessage[] = [...history.slice(-2)];

  if (includeEditorContext && editorPlainTextContext?.trim()) {
    const truncTag = editorContextTruncated ? " [TRUNCADO]" : "";
    messages.push({
      role: "user",
      content:
        `Contexto adicional do documento aberto no editor HTML (texto plano)${truncTag}:\n\n` +
        `<<<EDITOR_HTML_TEXT>>>\n${editorPlainTextContext}\n<<<END_EDITOR_HTML_TEXT>>>`,
    });
  }

  messages.push({ role: "user", content: `Pergunta atual do usuario:\n${userMessage}` });
  return messages;
}

export function buildVerbeteDefinologiaPrompt(
  query: string,
  editorPlainTextContext?: string,
  editorContextTruncated = false,
  includeEditorContext = true,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Voce e um redator especializado em Conscienciologia para escrita de verbetes. 
      Tarefa: escrever uma Definologia objetiva e tecnicamente adequada ao tema solicitado, com base na seção 'Definologia' dos verbetes da Enciclopédia da Conscienciologia.
      Regras:
      1) Forneça **uma definição de um termo** exclusivamente no contexto da Conscienciologia.
      2) Nao invente fontes, citacoes ou fatos nao sustentados pelo contexto.
      3) Use termos e expressões já existentes nos verbetes da Enciclopédia da Conscienciologia.
      4) Se o contexto for insuficiente, explicite a limitacao de forma breve e ainda proponha a melhor Definologia possivel.
      5) Responda em portugues brasileiro.
      6) Entregue apenas o texto final da Definologia, sem metacomentarios.

      Formato final de saída: 
     '**Definologia.** O *{termo}* é ...' para termos masculinos; e '**Definologia.** A *{termo}* é ...' para termos femininos.
      `,
    },
  ];

  if (includeEditorContext && editorPlainTextContext?.trim()) {
    const truncTag = editorContextTruncated ? " [TRUNCADO]" : "";
    messages.push({
      role: "user",
      content:
        `Contexto do documento aberto no editor HTML (texto plano)${truncTag}:\n\n` +
        `<<<EDITOR_HTML_TEXT>>>\n${editorPlainTextContext}\n<<<END_EDITOR_HTML_TEXT>>>`,
    });
  }

  messages.push({ role: "user", content: query });
  return messages;
}

export function buildVerbeteSinonimologiaPrompt(
  query: string,
  editorPlainTextContext?: string,
  editorContextTruncated = false,
  includeEditorContext = true,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Voce e um redator especializado em Conscienciologia para escrita de verbetes. 
      Tarefa: escrever uma lista de sinônimos objetiva e tecnicamente adequada ao tema solicitado, com base na seção 'Sinonimologia' dos verbetes da Enciclopédia da Conscienciologia.
      Regras:
      1) Forneça uma lista de 5 sinônimos exclusivamente no contexto da Conscienciologia.
      2) Nao invente fontes ou fatos nao sustentados pelo contexto.
      3) Use termos e expressões já existentes nos verbetes da Enciclopédia da Conscienciologia.
      4) Se o contexto for insuficiente, explicite a limitacao de forma breve e ainda proponha a melhor Sinonimologia possivel.
      5) Responda em portugues brasileiro.
      6) Entregue apenas o texto final da Sinonimologia, sem metacomentarios.
      7) Use apenas os documentos disponíveis de Conscienciologia como fonte. Caso não haja material suficiente, retorne exatamente: "Não há definição disponível para este termo nos materiais consultados.
      8) A saída deve ser apenas o parágrafo final, em Markdown limpo, sem metainstruções.

      Formato final de saída: 
      Sua resposta deve ser **um único parágrafo**, claro, preciso, objetivo e acadêmico, na forma:
      **Sinonimologia.** 1.  {primeiro iten da lista de sinônimos}. 2.  {segundo iten da lista de sinônimos}. 3.  {terceiro iten da lista de sinônimos}. 4.  {quarto iten da lista de sinônimos}. 5.  {quinto iten da lista de sinônimos}.
      `,
    },
  ];

  if (includeEditorContext && editorPlainTextContext?.trim()) {
    const truncTag = editorContextTruncated ? " [TRUNCADO]" : "";
    messages.push({
      role: "user",
      content:
        `Contexto do documento ${truncTag}:\n\n` +
        `<<<EDITOR_HTML_TEXT>>>\n${editorPlainTextContext}\n<<<END_EDITOR_HTML_TEXT>>>`,
    });
  }

  messages.push({ role: "user", content: query });
  return messages;
}

export function buildVerbeteFatologiaPrompt(
  query: string,
  editorPlainTextContext?: string,
  editorContextTruncated = false,
  includeEditorContext = true,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Voce e um redator especializado em Conscienciologia para escrita de verbetes. 
      Tarefa: escrever uma lista de fatos, exemplos ou ilustrações do tema solicitado, com base na seção 'Fatologia' dos verbetes da Enciclopédia da Conscienciologia.
      Regras:
      1) Forneça uma lista de 10 fatos, exemplos ou ilustrações exclusivamente no contexto da Conscienciologia.
      2) Nao invente fontes ou fatos nao sustentados pelo contexto.
      3) Use termos e expressões já existentes nos verbetes da Enciclopédia da Conscienciologia.
      4) Se o contexto for insuficiente, explicite a limitacao de forma breve e ainda proponha a melhor Fatologia possivel.
      5) Entregue apenas o texto final da Fatologia, sem metacomentarios.
      6) Use apenas os documentos disponíveis de Conscienciologia como fonte. Caso não haja material suficiente, retorne exatamente: "Não há definição disponível para este termo nos materiais consultados.
      7) A saída deve ser apenas o parágrafo final, em Markdown limpo, sem metainstruções.

      Formato final de saída: 
      **Fatologia.** 1. {artigo} {primeiro iten da lista de fatos}; 2. {artigo} {segundo iten da lista de fatos}; ...; 10. {artigo} {decimo iten da lista de fatos}.
      (O 'artigo' deve ser 'o' para masculinos e 'a' para femininos).
      `,
    },
  ];

  if (includeEditorContext && editorPlainTextContext?.trim()) {
    const truncTag = editorContextTruncated ? " [TRUNCADO]" : "";
    messages.push({
      role: "user",
      content:
        `Contexto do documento aberto no editor HTML (texto plano)${truncTag}:\n\n` +
        `<<<EDITOR_HTML_TEXT>>>\n${editorPlainTextContext}\n<<<END_EDITOR_HTML_TEXT>>>`,
    });
  }

  messages.push({ role: "user", content: query });
  return messages;
}

export function buildVerbeteFraseEnfaticaPrompt(
  query: string,
  editorPlainTextContext?: string,
  editorContextTruncated = false,
  includeEditorContext = true,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Voce e um redator especializado em Conscienciologia para escrita de verbetes. 
      Tarefa: escrever uma Frase Enfática objetiva e tecnicamente adequada ao tema solicitado, com a síntese do tema e do texto final do verbete.
      Regras da Frase Enfática:
      1) Exatamente 1 parágrafo breve.
      2) Entre 150 a 170 caracteres (excluindo os espaços).
      3) A frase enfática deve ser clara, sintética, objetiva, criativa e inventiva.
      4) Use termos e expressões já existentes no texto final do verbete.
      5) Entregue apenas o texto final da Frase Enfática, sem metacomentarios.
      6) Realce as palavras-chave da Frase Enfática com *itálico, **negrito** e ***negrito e itálico***.
      `,
    },
  ];

  if (includeEditorContext && editorPlainTextContext?.trim()) {
    const truncTag = editorContextTruncated ? " [TRUNCADO]" : "";
    messages.push({
      role: "user",
      content:
        `Contexto do documento aberto no editor HTML (texto plano)${truncTag}:\n\n` +
        `<<<EDITOR_HTML_TEXT>>>\n${editorPlainTextContext}\n<<<END_EDITOR_HTML_TEXT>>>`,
    });
  }

  messages.push({ role: "user", content: query });
  return messages;
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
        `Analise a seguinte pensata, segundo a Conscienciologia. Apresente a resposta da analise em apenas 1 paragrafo breve. Apresente tambem um **Exemplo** que ilustra a pensata, de modo prático, claro e didático, também em 1 paragrafo curto.\n\nPensata:\n"${pensata}"`,
    },
  ];
}
