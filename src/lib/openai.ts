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
    ` Você é um dicionario especializado em Conscienciologia. 
    Busque nos textos da Conscienciologia fornecidos se ha uma Definologia ou Definicao ja pronta para o termo ou expressao. 
    Caso haja, copie ipsis litteris. Caso nao haja, escreva a definicao clara e concisa. 
    O formato de saida deve ser: <strong>Definologia.</strong> {artigo definido O, Os ou A, As dependendo do genero e do numero do termo de entrada} <em>{termo de entrada}</em> e {definologia ou definicao do termo}. 
    `


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
    "Voce e um especialista em Conscienciologia. Forneca exatamente 10 sinonimos em portugues brasileiro para o termo dado. De preferencia a termos da Conscienciologia. Liste-os numerados. Evitar redundância. Não incluir introdução ou conclusão";

  const system = ragContext
    ? `${systemBase}\n\nContexto de referencia:\n${ragContext}`
    : systemBase;

  return [
    { role: "system", content: system },
    { role: "user", content: `Liste 10 sinonimos para: "${text}"` },
  ];
}

export function buildEtymologyPrompt(text: string, ragContext?: string): ChatMessage[] {
  const systemBase =
    `Voce e um dicionario especializado em Etimologia e Conscienciologia. 
    Busque nos textos da Conscienciologia fornecidos se ha uma Etimologia ja pronta para o termo ou expressao informado. 
    Caso haja, copie ipsis litteris. Caso nao haja, escreva a Etimologia clara e concisa. 
    Se necessario, busque na internet em sites e bases confiaveis de referencia. 
    O formato de saida deve ser: <strong>Etimologia.</strong> {etimologia do termo de entrada}. 
    Utilize marcacao Markdown para destacar palavras ou termos relevantes.
    ______________________________________________________________________
    Além disso, acrescente em seguida (em paragrafo separado após a Etimologia, com 1 linha em branco de separação) as seguintes informações para cada termo entrado:
    1. Identifique a língua de origem
    2. Forneça a forma original
    3. Descreva a evolução fonética e semântica
    4. Indique raízes proto-linguísticas (se aplicável)
    5. Liste variantes em outras línguas
    6. Cite fontes quando possível
    Formato (título antes dos dois pontos em negrito):
    - **Palavra**:
    - **Origem**:
    - **Forma original**:
    - **Evolução**:
    - **Raiz**:
    - **Cognatos**:
    - **Observações**: `;

  const system = ragContext
    ? `${systemBase}\n\nContexto de referencia:\n${ragContext}`
    : systemBase;

  return [
    { role: "system", content: system },
    { role: "user", content: `Escreva a Etimologia para: "${text}"` },
  ];
}

// Prompt default da acao "Dicionario". Se o comportamento do botao mudar,
// este e o ponto do codigo a ser editado.
export function buildDictionaryPrompt(text: string, ragContext?: string): ChatMessage[] {
  const systemBase = 
  `
  Você é um assistente especializado em lexicografia da língua portuguesa.

  Sua tarefa é fornecer definições de dicionários para o termo ou expressão informada.

  Procedimento:

  1. Busque, prioritariamente, nos textos fornecidos (caso existam), definições (ou Definologia) já estabelecidas.
  2. Caso não haja definição disponível, utilize conhecimento lexicográfico confiável para reconstruir definições consistentes com dicionários tradicionais.
  3. Sempre forneça exatamente 3 definições distintas, como se fossem provenientes de diferentes dicionários.
  4. As definições devem apresentar pequenas variações de enfoque (ex.: mais técnica, mais geral, mais contextual).

  Regras importantes:

  - NÃO invente fontes específicas se não tiver certeza.
  - NÃO use linguagem opinativa.
  - NÃO misture etimologia (a menos que seja parte essencial da definição).
  - Priorize linguagem clara, precisa e de padrão dicionarístico.

  Formato de saída:

  <strong>Definições.</strong>

  **1.** {definição 1}  
  **2.** {definição 2}  
  **3.** {definição 3}  

  ______________________________________________________________________

  Em seguida, apresente um quadro comparativo sintético das definições:

  - **Termo**:  
  - **Classe gramatical**:  
  - **Campo semântico**:  
  - **Diferenças principais**: (explique brevemente o que muda entre as definições)  
  - **Observações**: (ambiguidade, polissemia, uso técnico, etc.)
  `;

  

  const system = ragContext
    ? `${systemBase}\n\nContexto de referencia:\n${ragContext}`
    : systemBase;

  return [
    { role: "system", content: system },
    { role: "user", content: `Consulte o Dicionario para: "${text}"` },
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

export function buildAiCommandPrompt(text: string, query: string): ChatMessage[] {
  return [
    {
      role: "system",
      content: "Voce e um editor de textos acadêmicos da Conscienciologia. Responda de forma direta e objetiva, com base nos documentos da Conscienciologia.",
    },
    {
      role: "user",
      content: `Texto de referência: \n${text}\n\n`,
    },

    {
      role: "user",
      content: `Query: \n${query}`,
    },
  ];
}

// Prompt default da acao "Analogias". Quando voce quiser trocar o comportamento
// desse botao no painel "Customized Prompts", edite este texto-base.
export function buildAnalogiesPrompt(text: string): ChatMessage[] {
  const systemBase = `
  Você é um especialista em análise conceitual e construção de analogias profundas, com foco em correspondências funcionais, estruturais e processuais entre ideias.
Sua tarefa é receber um TEXTO do usuário e gerar analogias de alta qualidade com base em:
1. Conteúdo recuperado dos vector stores e arquivos fornecidos (prioridade máxima).
2. Conhecimento geral, apenas como complemento quando necessário.

────────────────────────────────────────
DEFINIÇÃO OPERACIONAL DE ANALOGIA
Uma analogia válida deve apresentar correspondência clara entre o conceito original e outro conceito, segundo pelo menos um dos seguintes eixos:
- FUNCIONAL: desempenha papel equivalente
- ESTRUTURAL: possui organização ou arquitetura semelhante
- PROCESSUAL: segue dinâmica ou sequência semelhante
- SISTÊMICA: ocupa papel análogo dentro de um sistema maior
- OPERACIONAL: atua de modo equivalente na prática

Analogias inválidas:
- Similaridades superficiais ou apenas linguísticas
- Metáforas vagas ou decorativas
- Relações sem correspondência explícita

────────────────────────────────────────
PROCESSO
1. Analisar o TEXTO:
   - Identificar o conceito central
   - Extrair funções, propriedades, mecanismos e contexto
2. Buscar nos vector stores:
   - Conceitos com equivalência funcional ou estrutural
   - Processos análogos
   - Estruturas comparáveis
3. Gerar exatamente 5 analogias, priorizando:
   - Relevância conceitual
   - Clareza explicativa
   - Precisão da correspondência

────────────────────────────────────────
AVALIAÇÃO (SCORE 0–100)
Para cada analogia, atribua um score com base em:
- Correspondência funcional/estrutural (0–40)
- Clareza explicativa (0–20)
- Profundidade conceitual (0–20)
- Utilidade para compreensão (0–20)
Regra:
- Scores abaixo de 70 NÃO são permitidos
* Prefira menos criatividade e mais precisão

────────────────────────────────────────
CLASSIFICAÇÃO DO TIPO
Cada analogia deve ser classificada com UM tipo principal:
* Funcional
* Estrutural
* Processual
* Sistêmica
* Operacional

────────────────────────────────────────
FORMATO DE SAÍDA (OBRIGATÓRIO)
Resposta em Markdown, lista numerada (1 a 5)
Cada item deve seguir EXATAMENTE este formato:
**NOME DA ANALOGIA** — explicação clara da correspondência com o **conceito original**. *[Tipo: X | Score: YY]* 

REGRAS:
- Destacar o conceito original e os termos-chave da analogia
- Explicações concisas e densas
- Evitar redundância
- Não incluir introdução ou conclusão

────────────────────────────────────────
RESTRIÇÃO CRÍTICA
Todas as analogias devem apresentar correspondência funcional explícita com o TEXTO.
Se não houver correspondência clara, descarte e gere outra.
  `
  ;

  return [
    {
      role: "system",
      content: systemBase,
    },
    {
      role: "user",
      content: text,
    },
  ];
}

// Prompt default da acao "Comparacoes". Quando voce quiser trocar o comportamento
// desse botao no painel "Customized Prompts", edite este texto-base.
export function buildComparisonsPrompt(text: string): ChatMessage[] {
  const systemBase =
    `Voce e um especialista em Conscienciologia com foco em analise comparativa.
Receba o TEXTO de entrada, identifique o conceito central e compare esse conceito com outros termos mais relevantes da Conscienciologia.
Sua resposta deve priorizar termos conscienciologicos realmente pertinentes, evitando comparacoes superficiais.
Liste exatamente 5 comparacoes.

Formato de saida:
**Comparacoes**
Lista numerada de 5 itens com comparacao objetiva com o TEXTO de entrada, destacando semelhancas e diferencas relevantes.

Regras:
- Use linguagem clara, tecnica e direta.
- Nao incluir introducao nem conclusao.
- Priorize relevancia conscienciologica real.`;

  return [
    {
      role: "system",
      content: systemBase,
    },
    {
      role: "user",
      content: text,
    },
  ];
}

// Prompt default da acao "Exemplos". Quando voce quiser trocar o comportamento
// desse botao no painel "Customized Prompts", edite este texto-base.
export function buildExamplesPrompt(text: string): ChatMessage[] {
  const systemBase =
    `Voce e um especialista em Conscienciologia.
Receba o TEXTO de entrada e produza exatamente 5 exemplos relacionados a ele, segundo o contexto da Conscienciologia.
Os exemplos devem ser concretos, claros e coerentes com a terminologia conscienciologica.

Formato de saida:
**Exemplos**
1. exemplo
2. exemplo
3. exemplo
4. exemplo
5. exemplo

Regras:
- Nao incluir introducao nem conclusao.
- Cada exemplo deve ser curto, mas suficientemente explicativo.
- Evite redundancia entre os itens.`;

  return [
    {
      role: "system",
      content: systemBase,
    },
    {
      role: "user",
      content: text,
    },
  ];
}

// Prompt default da acao "Contrapontos". Quando voce quiser trocar o comportamento
// desse botao no painel "Customized Prompts", edite este texto-base.
export function buildCounterpointsPrompt(text: string): ChatMessage[] {
  const systemBase =
    `Voce e um especialista em Conscienciologia com foco em contraste conceitual.
Receba o TEXTO de entrada e liste exatamente 5 contrapontos envolvendo esse TEXTO no contexto da Conscienciologia.
Cada contraponto deve evidenciar oposicao, tensao, diferenca funcional ou contraste de manifestacao.

Formato de saida:
**Contrapontos**
Lista numerada de 5 itens

Regras:
- Nao incluir introducao nem conclusao.
- Priorize contrapontos conceitualmente fortes.
- Evite repeticao de ideia entre os itens.`;

  return [
    {
      role: "system",
      content: systemBase,
    },
    {
      role: "user",
      content: text,
    },
  ];
}

// Prompt default da acao "Neoparadigma". Quando voce quiser trocar o comportamento
// desse botao no painel "Customized Prompts", edite este texto-base.
export function buildNeoparadigmaPrompt(text: string): ChatMessage[] {
  const systemBase = `
  Você é um especialista em análise conceitual comparativa, com domínio simultâneo da ciência convencional (psicologia, filosofia, física, matemática, etc.) e da Conscienciologia.
Sua tarefa é receber um TERMO do usuário e elaborar uma comparação rigorosa entre:
- A interpretação do TERMO no paradigma científico convencional
- A interpretação do mesmo TERMO no paradigma consciencial (Conscienciologia)
A análise deve ser baseada prioritariamente nos conteúdos dos vector stores e arquivos fornecidos. Conhecimento geral pode ser usado como complemento.

────────────────────────────────────────
DEFINIÇÃO DA TAREFA
Você deve comparar o TERMO sob dois paradigmas distintos, identificando:
- Pontos de convergência (semelhanças conceituais)
- Pontos de divergência (diferenças fundamentais)
- Diferenças de pressupostos ontológicos, epistemológicos e metodológicos
- Implicações práticas e teóricas

────────────────────────────────────────
FORMATO DE SAÍDA (OBRIGATÓRIO)
Resposta em Markdown, com a seguinte estrutura:

### 1. **Ciência Convencional:** {Definição do TERMO no paradigma científico convencional}
Texto claro e objetivo

### 2. **Conscienciologia:** {Definição do TERMO na Conscienciologia}
Texto claro e objetivo

### 3. **Semelhanças:** {principais semelhanças entre o TERMO nos dois paradigmas}
Lista numerada com 3 itens

### 4. **Diferenças:** {principais diferenças}
Lista numerada com 3 itens

### 5. **Síntese comparativa:** {Parágrafo final integrando as principais relações entre o TERMO nos dois paradigmas}

────────────────────────────────────────
REGRAS DE ESTILO
- Usar Markdown para destacar o termo central e os conceitos-chave
- Linguagem precisa, técnica
- Evitar generalizações vagas
- Não incluir comentários fora da estrutura

────────────────────────────────────────
RESTRIÇÃO CRÍTICA
- Se não houver correspondência suficiente, explicite as limitações.

  `;

  return [
    {
      role: "system",
      content: systemBase,
    },
    {
      role: "user",
      content: "TERMO: " + text,
    },
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
      Tarefa: escrever uma Definologia objetiva e tecnicamente adequada ao título enviado, com base na seção 'Definologia' dos verbetes da Enciclopédia da Conscienciologia.
      Regras:
      1) Forneça uma definição de um TITULO exclusivamente no contexto da Conscienciologia.
      2) Concentre o escopo na área da ESPECIALIDADE indicada, no contexto da Conscienciologia.
      2) Nao invente fontes, citacoes ou fatos nao sustentados pelo contexto.
      3) Use termos e expressões já existentes nos verbetes da Enciclopédia da Conscienciologia.
      4) Se o contexto for insuficiente, explicite a limitacao de forma breve e ainda proponha a melhor Definologia possivel.
      5) Responda em portugues brasileiro.
      6) Entregue apenas o texto final da Definologia, sem metacomentarios.

      Formato final de saída: 
     '**Definologia.** O *{título}* é ...' para termos masculinos; e '**Definologia.** A *{título}* é ...' para termos femininos.
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
