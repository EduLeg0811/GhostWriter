# Parapreceptor (Clean Rebuild)

Aplicacao web com 3 colunas:
- esquerda: upload, estatisticas e acoes LLM
- centro: ONLYOFFICE embutido
- direita: historico de respostas

## Requisitos

- Node.js 18+
- Python 3 (FastAPI backend)
- ONLYOFFICE Document Server em Docker

## Configuracao

Copie `.env.example` para `.env` e ajuste:
- `BACKEND_ONLYOFFICE_URL` (acessivel pelo container onlyoffice)
- `BACKEND_BROWSER_URL` e `ONLYOFFICE_PLUGIN_PUBLIC_URL` (acessiveis pelo navegador)
- `ONLYOFFICE_DOCUMENT_SERVER_URL`
- `ONLYOFFICE_JWT_SECRET`
- `OPENAI_API_KEY`
- `VITE_OPENAI_VECTOR_STORES`
- `VITE_OPENAI_VECTOR_STORE_LO`

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

Passos:
1. No Render, escolha **New +** -> **Blueprint** e conecte este repositorio.
2. Crie os servicos sugeridos pelo `render.yaml`.
3. Configure as variaveis obrigatorias:
- Backend: `BACKEND_ONLYOFFICE_URL`, `BACKEND_BROWSER_URL`, `ONLYOFFICE_PLUGIN_PUBLIC_URL`, `ONLYOFFICE_DOCUMENT_SERVER_URL`, `ONLYOFFICE_JWT_SECRET`, `OPENAI_API_KEY`
- Frontend: `VITE_API_BASE_URL`, `VITE_OPENAI_VECTOR_STORES`, `VITE_OPENAI_VECTOR_STORE_LO`, `VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG`
4. Use a URL publica do backend para:
- `BACKEND_ONLYOFFICE_URL`
- `BACKEND_BROWSER_URL`
- `ONLYOFFICE_PLUGIN_PUBLIC_URL`
- `VITE_API_BASE_URL` (no frontend)

## Fluxo funcional

1. Upload de DOCX/DOC/RTF/ODT/PDF.
2. PDF e convertido para DOCX com `pdf2docx`.
3. Documento abre no ONLYOFFICE (coluna central).
4. Trecho selecionado pode ser trazido para a caixa de entrada (coluna esquerda).
5. Acoes LLM: Definir, Sinonimia, Pensatas LO, Reescrever, Resumir.
6. Highlight aplica marcacao no DOCX e recarrega o editor.
7. Respostas aparecem na coluna direita.

## Checklist de validacao manual

1. Upload DOCX e abrir no editor.
2. Upload PDF, converter e abrir.
3. Selecionar trecho e usar `Obter selecao`.
4. Executar Definir, Sinonimia, Pensatas LO, Reescrever e Resumir.
5. Executar Highlight e confirmar marcacao.
6. Confirmar estatisticas atualizando apos abrir/salvar/refresh.
7. Confirmar historico no painel direito.
