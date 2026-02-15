export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// LLM CONFIG
// Ajuste centralizado dos parametros de inferencia usados em TODAS as consultas.
export const LLM_MODEL = "gpt-4.1-mini";
export const LLM_TEMPERATURE = 0.7;
export const LLM_TOP_P = 1;
export const LLM_MAX_TOKENS: number | undefined = undefined;
export const LLM_PRESENCE_PENALTY = 0;
export const LLM_FREQUENCY_PENALTY = 0;

export async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: LLM_TEMPERATURE,
      top_p: LLM_TOP_P,
      max_tokens: LLM_MAX_TOKENS,
      presence_penalty: LLM_PRESENCE_PENALTY,
      frequency_penalty: LLM_FREQUENCY_PENALTY,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.content ?? "";
}

export async function searchVectorStore(vectorStoreId: string, query: string): Promise<string[]> {
  const res = await fetch("/api/ai/vector-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ vectorStoreId, query, maxNumResults: 5 }),
  });

  if (!res.ok) {
    console.warn(`Vector store search failed (${res.status})`);
    return [];
  }

  const data = await res.json();
  return data.chunks ?? [];
}

export function buildDefinePrompt(text: string, ragContext?: string): ChatMessage[] {
  const systemBase =
    "Voce e um dicionario especializado em Conscienciologia. Busque nos textos da Conscienciologia fornecidos se ha uma Definologia ou Definicao ja pronta para o termo ou expressao. Caso haja, copie ipsis litteris. Caso nao haja, forneca a definicao clara e concisa. O formato de saida deve ser: <strong>Definologia.</strong> {artigo definido O, Os ou A, As dependendo do genero e do numero do termo de entrada} <em>{termo de entrada}</em> e {definologia ou definicao do termo}.";

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
    "Voce e um especialista em Conscienciologia. Forneca exatamente 10 sinonimos em portugues brasileiro para o termo dado. De preferencia a termos que tenham relacao direta com a Conscienciologia. Liste-os numerados.";

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
