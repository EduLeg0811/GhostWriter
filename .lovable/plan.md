

## Problema

O parser de PDF atual usa `pdfjs-dist` para extrair texto, mas a detecção de formatacao (negrito, italico, headings) depende de metadados de fonte (`fontName`) que frequentemente sao inconsistentes ou ausentes em muitos PDFs. Isso resulta em texto simples sem formatacao no editor.

## Estrategia

Manter o `pdfjs-dist` (unico parser viavel no browser), mas tornar a deteccao de formatacao significativamente mais robusta com as seguintes melhorias:

### 1. Melhorar deteccao de negrito via peso da fonte

Alem do `fontName`, usar a propriedade `item.fontName` combinada com o acesso ao dicionario de fontes do PDF (`page.commonObjs`) para extrair o peso real da fonte quando disponivel.

### 2. Corrigir bug na logica de quebra de linha

A condicao atual `!item.str && !item.hasEOL` pula itens que sao apenas espacos. Tambem, a deteccao de nova linha com `fontSize * 0.5` e muito sensivel -- usar `fontSize * 0.3` para agrupar melhor linhas proximas.

### 3. Melhorar agrupamento de paragrafos

Dois line-breaks consecutivos devem separar paragrafos, enquanto um unico line-break pode ser apenas uma quebra de linha dentro do mesmo paragrafo (ex: texto justificado em colunas).

### 4. Garantir que o TipTap aceite o HTML gerado

Verificar se as tags `<strong>`, `<em>`, `<h1>`-`<h3>` e `<p>` sao corretamente renderizadas pelo TipTap com as extensoes atuais (StarterKit ja inclui suporte a essas tags).

### 5. Adicionar fallback para deteccao de negrito

Quando o `fontName` nao contem "bold" explicitamente, comparar o nome da fonte com as outras fontes do documento. Se uma fonte aparece em trechos curtos (titulos) e outra em trechos longos (corpo), inferir que a fonte dos trechos curtos pode ser um heading.

## Detalhes Tecnicos

### Arquivo: `src/lib/file-parser.ts`

**Mudancas na funcao `parsePDF`:**

- Ampliar regex de deteccao de bold para incluir padroes como `Bd`, `BD`, `Bol`, `-B`, `_B` (comuns em fontes embutidas)
- Reduzir threshold de quebra de linha de `fontSize * 0.5` para `fontSize * 0.3`
- Agrupar linhas consecutivas no mesmo paragrafo quando a distancia vertical e pequena (mesma "baseline")
- Adicionar deteccao por comparacao de fontes: se o documento tem 2+ fontes, a menos frequente em trechos curtos provavelmente e bold/heading
- Manter os logs de debug para facilitar diagnostico futuro
- Remover a interface `TextItem` duplicada (mover para o topo do arquivo)

**Resultado esperado:** O HTML gerado contera tags `<h1>`, `<h2>`, `<h3>`, `<strong>`, `<em>` e `<p>` que o TipTap renderiza nativamente.

