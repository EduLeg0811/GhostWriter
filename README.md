# Parapreceptor (Ghost Writer)

Aplicacao web com 3 colunas:
- esquerda: upload, estatisticas e acoes LLM
- centro: editor HTML (Tiptap)
- direita: historico de respostas

## Requisitos

- Node.js 18+
- Python 3 (FastAPI backend)

## Configuracao

Copie `.env.example` para `.env` e ajuste:
- `VITE_API_BASE_URL`
- `OPENAI_API_KEY`
- `VITE_OPENAI_VECTOR_STORES`
- `VITE_OPENAI_VECTOR_STORE_LO`
- `VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG`

## Desenvolvimento

```bash
npm install
pip install -r requirements.txt
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8787`

## Deploy no Render

Este projeto esta pronto para deploy via Blueprint (`render.yaml`) com 2 servicos:
- `ghost-writer-backend` (FastAPI)
- `ghost-writer-frontend` (Static Site)

Variaveis obrigatorias:
- Backend: `OPENAI_API_KEY`
- Frontend: `VITE_API_BASE_URL`, `VITE_OPENAI_VECTOR_STORES`, `VITE_OPENAI_VECTOR_STORE_LO`, `VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG`

## Fluxo funcional

1. Upload de DOCX/PDF.
2. PDF e convertido para DOCX com `pdf2docx`.
3. Documento abre no editor HTML (coluna central).
4. Trecho selecionado pode ser trazido para a caixa de entrada (coluna esquerda).
5. Acoes LLM: Definir, Sinonimia, Pensatas LO, Reescrever, Resumir e Traduzir.
6. Macros locais: Highlight e Lista Numerada.
7. Respostas aparecem na coluna direita.

## Checklist de validacao manual

1. Upload DOCX e editar no centro.
2. Upload PDF, converter e abrir.
3. Selecionar trecho e usar `Obter selecao`.
4. Executar Definir, Sinonimia, Pensatas LO, Reescrever, Resumir e Traduzir.
5. Executar Highlight e Lista Numerada.
6. Confirmar estatisticas atualizando.
7. Confirmar historico no painel direito.
