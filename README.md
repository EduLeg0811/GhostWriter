# Parapreceptor (Ghost Writer)

Uma aplicação web para assistência na escrita acadêmica com interface em três colunas, processamento de documentos e integração com IA.

## 🏗️ Arquitetura

- **Coluna Esquerda**: Upload de documentos, estatísticas e ações de IA
- **Coluna Central**: Editor HTML baseado em Tiptap
- **Coluna Direita**: Histórico de respostas e interações

## 📋 Pré-requisitos

- **Node.js** 18+ 
- **Python 3.8+** (FastAPI backend)
- **pnpm** ou **npm** para gerenciamento de pacotes

## 🚀 Instalação e Configuração

### 1. Clonar o repositório
```bash
git clone <repository-url>
cd Ghost_Writer_v1
```

### 2. Configurar variáveis de ambiente
Copie `.env.example` para `.env` e ajuste as variáveis:

```bash
cp .env.example .env
```

Variáveis obrigatórias:
- `VITE_API_BASE_URL` - URL do backend FastAPI
- `OPENAI_API_KEY` - Chave de API da OpenAI
- `VITE_OPENAI_VECTOR_STORES` - ID do vector store principal
- `VITE_OPENAI_VECTOR_STORE_LO` - ID do vector store para Learning Objects
- `VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG` - ID do vector store para tradução RAG

### 3. Instalar dependências
```bash
# Frontend
npm install
# ou
pnpm install

# Backend
pip install -r requirements.txt
```

## 🛠️ Desenvolvimento

### Iniciar ambos os serviços
```bash
npm run dev:all
```

### Iniciar serviços individualmente
```bash
# Backend (FastAPI)
npm run dev:server

# Frontend (Vite + React)
npm run dev
```

### Recalibrar scores dos indices semanticos
Sempre que novas bases semanticas forem geradas, atualize os manifests com o score recomendado por base:

```bash
python backend/python/recalibrate_semantic_manifests.py
```

Para recalibrar apenas uma base:

```bash
python backend/python/recalibrate_semantic_manifests.py lo
```

### Reconstruir indices semanticos com rechunking
Quando quiser reduzir trechos longos ou mistos, reconstrua o indice semantico com rechunking e novos embeddings:

```bash
python backend/python/rebuild_semantic_index.py lo
```

Para reconstruir todas as bases:

```bash
python backend/python/rebuild_semantic_index.py
```

Tambem e possivel ajustar o tamanho dos chunks:

```bash
python backend/python/rebuild_semantic_index.py lo --target-chars 260 --max-chars 380 --min-chars 90
```

### Endpoints locais
- **Frontend**: `http://localhost:5173`
- **Backend**: `http://localhost:8787`
- **Documentação API**: `http://localhost:8787/docs`

## 📦 Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** como bundler
- **TailwindCSS** para estilização
- **shadcn/ui** componentes
- **Tiptap** editor de rich text
- **React Query** para gerenciamento de estado
- **React Router** para navegação

### Backend
- **FastAPI** framework web
- **Uvicorn** servidor ASGI
- **OpenAI** API para integração com IA
- **pdf2docx** conversão de PDF para DOCX
- **Mammoth** processamento de DOCX
- **Pandas** e **NumPy** para manipulação de dados

## 🔄 Fluxo Funcional

1. **Upload**: Carregar documentos DOCX/PDF
2. **Conversão**: PDF automaticamente convertido para DOCX
3. **Edição**: Documento abre no editor HTML central
4. **Seleção**: Trechos podem ser selecionados e enviados para a caixa de entrada
5. **Ações IA**: 
   - Definir termos
   - Sinonímia
   - Pensatas LO (Learning Objects)
   - Reescrever
   - Resumir
   - Traduzir
6. **Macros Locais**: Highlight e Lista Numerada
7. **Histórico**: Respostas aparecem na coluna direita

## 🚀 Deploy no Render

O projeto está configurado para deploy via Blueprint (`render.yaml`) com 2 serviços:

### Serviços
- `ghost-writer-backend` (FastAPI)
- `ghost-writer-frontend` (Static Site)

### Variáveis de Ambiente Obrigatórias
**Backend**:
- `OPENAI_API_KEY`

**Frontend**:
- `VITE_API_BASE_URL`
- `VITE_OPENAI_VECTOR_STORES`
- `VITE_OPENAI_VECTOR_STORE_LO`
- `VITE_OPENAI_VECTOR_STORE_TRANSLATE_RAG`

## ✅ Checklist de Validação Manual

1. **Upload de Documentos**
   - [ ] Upload DOCX e editar no centro
   - [ ] Upload PDF, converter e abrir

2. **Funcionalidades do Editor**
   - [ ] Selecionar trecho e usar `Obter seleção`
   - [ ] Executar Highlight e Lista Numerada

3. **Ações de IA**
   - [ ] Executar Definir
   - [ ] Executar Sinonimia
   - [ ] Executar Pensatas LO
   - [ ] Executar Reescrever
   - [ ] Executar Resumir
   - [ ] Executar Traduzir

4. **Interface e Estatísticas**
   - [ ] Confirmar estatísticas atualizando
   - [ ] Confirmar histórico no painel direito

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar apenas frontend
npm run dev:server       # Iniciar apenas backend
npm run dev:all          # Iniciar ambos os serviços

# Build
npm run build            # Build para produção
npm run build:dev        # Build para desenvolvimento

# Testes e Qualidade
npm run test             # Executar testes
npm run test:watch       # Executar testes em modo watch
npm run lint             # Verificar linting
npm run preview          # Preview do build
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Consulte o arquivo LICENSE para mais detalhes.
























Implementei os dois próximos passos no backend.

A expansão semântica da query entrou em semantic_search_service.py (line 1) com apoio de semantic_query_expansion.py (line 1). Agora a busca gera variantes da consulta para siglas e termos do domínio, como recin, invexis, tenepes, gescon, proexis, compléxis, e combina os embeddings dessas variantes em um vetor final ponderado. Isso melhora recall sem virar busca híbrida.

Para chunking/indexação, criei semantic_chunking.py (line 1), semantic_index_builder.py (line 1) e o script rebuild_semantic_index.py (line 1). O rebuild agora rechunka trechos longos e mistos por fronteiras estruturais e sentenças, adiciona metadados de chunk (chunk_index, chunk_total, source_row), regenera embeddings, recalibra recommended_min_score e grava tudo no índice. Documentei os comandos no README.md (line 1).

Também adicionei testes novos em test_semantic_query_expansion.py (line 1) e test_semantic_chunking.py (line 1), além de manter os testes do serviço semântico atualizados.

Validação executada:

python -m unittest backend.tests.test_semantic_overview_service backend.tests.test_semantic_index_calibration backend.tests.test_semantic_query_expansion backend.tests.test_semantic_chunking
python -m py_compile backend\functions\semantic_search_service.py backend\functions\semantic_query_expansion.py backend\functions\semantic_chunking.py backend\functions\semantic_index_builder.py backend\python\rebuild_semantic_index.py
Não rodei o rebuild real das bases neste passo, porque isso regenera embeddings via OpenAI e altera todos os índices. Para aplicar nas bases, o comando é:

python backend/python/rebuild_semantic_index.py lo
ou, para todas:

python backend/python/rebuild_semantic_index.py