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
