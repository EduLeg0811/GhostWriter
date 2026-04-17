Os critérios de busca léxica estão implementados em backend/functions/lexical_search_service.py (line 72). O comportamento real é este:

Normalização

Desconsidera acentos: projeção vira projecao para busca (linha 79).
Desconsidera maiúsculas/minúsculas: tudo vira lowercase (linha 81).
Normaliza espaços: quebras de linha, tabs, NBSP e espaços repetidos viram espaço simples (linha 72).
Remove pontuação no match, preservando só letras, números, _, espaços e * (linha 84).
Remove * e ** de markdown do conteúdo antes de comparar, para não poluir o match (linha 89).
Termos separados por espaço

Por padrão, espaço entre termos vira E lógico implícito (&) (linha 147).
Exemplo: energia consciencia significa energia & consciencia.
Isso vale também para:
termo seguido de parêntese: energia (consciencia | lucidez) vira energia & (consciencia | lucidez)
termo seguido de negação: energia !sono vira energia & !sono
Operadores suportados

& = E
| = OU
! = NÃO
Parênteses ( ) para agrupar (linha 15, linha 140).
Precedência:
! maior
& média
| menor (linha 15).
Exemplos:

energia consciencia => energia & consciencia
energia | consciencia => qualquer um dos dois
energia !sono => tem energia e não tem sono
energia (lucidez | consciencia) => energia e mais um dos dois
Busca por termo completo ou parcial

Sem aspas e sem *, a busca é por substring simples, não por palavra inteira (linha 220).
Exemplo: buscar conscien encontra consciencia.
Exemplo: buscar tene encontra tenepes.
Isso significa que, no caso simples, a busca é parcial.
Busca com aspas

"dupla evolutiva" busca a frase, em sequência, com tolerância a um ou mais espaços entre as palavras (linha 183).
Aqui há borda de palavra (\b), então o comportamento é mais próximo de expressão exata por palavras.
Aspas preservam os espaços internos como uma única expressão de busca.
Busca com curinga *

* é suportado como wildcard (linha 177).
O padrão usa borda de palavra no início e no fim (linha 180).
Exemplo:
conscien* casa com palavras que começam com esse prefixo
*logia casa com palavras que terminam com esse sufixo
proj*logia casa com algo no meio também
Diferente do termo simples, com * o match é regex com fronteira de palavra.
Onde ele procura

Junta os campos da linha do Excel em segmentos e procura:
no conteúdo combinado da linha inteira
e também em cada segmento individualmente (linha 415, linha 423).
Se o texto tem |, ele divide em subtrechos para melhorar o match (linha 324).
Tratamento especial do | dentro do texto retornado

Se um parágrafo retornado contém 2 ou mais |, ele mantém o cabeçalho e só devolve os subtrechos que realmente bateram com a busca (linha 289).
Isso afeta a apresentação do resultado, não a semântica da consulta.
Parênteses inválidos

Se os parênteses da consulta estiverem desbalanceados, ele abandona a lógica booleana e cai para uma checagem simples por substring da query inteira normalizada (linha 200).
Resumo prático

Ignora acentos: evolução = evolucao
Ignora caixa: PROJECIOLOGIA = projeciologia
Colapsa espaços, mas não remove tudo: espaço continua separando termos
Espaço entre termos = E implícito
| = OU, ! = exclusão
Sem aspas e sem *: busca parcial por substring
Com aspas: busca frase
Com *: busca com curinga e borda de palavra
Se quiser, eu posso transformar isso numa tabela de exemplos de entrada -> comportamento esperado para você validar rapidamente no frontend/API.


sim

Tabela prática de entrada -> comportamento esperado no motor léxico de backend/functions/lexical_search_service.py (line 192):

Consulta	Interpretação	Comportamento esperado
projecao	termo simples	Encontra projeção, projecao, projecoes, etc., se contiver essa sequência.
PROJEÇÃO	termo simples normalizado	Igual a projecao; ignora caixa e acento.
dupla evolutiva	dupla & evolutiva	Os dois termos precisam aparecer; espaços múltiplos viram um só.
dupla evolutiva	dupla & evolutiva	Espaço entre termos vira E implícito.
dupla & evolutiva	dupla AND evolutiva	Mesmo efeito do caso acima, mas explícito.
`dupla	evolutiva`	dupla OR evolutiva
dupla !evolutiva	dupla AND NOT evolutiva	Precisa ter dupla e não ter evolutiva.
`dupla (evolutiva	consciencial)`	dupla AND (evolutiva OR consciencial)
"dupla evolutiva"	frase exata por palavras	Busca a sequência das palavras juntas, com tolerância a espaços.
"estado vibracional"	frase	Encontra a expressão nessa ordem; não vira AND separado.
conscien*	wildcard	Encontra palavras com prefixo conscien....
*logia	wildcard	Encontra palavras terminadas em ...logia.
proj*logia	wildcard	Encontra palavras com começo proj e final logia.
tene	substring parcial	Encontra tenepes, porque sem aspas e sem * é substring.
conscien	substring parcial	Encontra consciencia, conscienciologia, etc.
a b	a & b	Termos curtos também entram como AND; não há stemming.
"(dupla evolutiva)"	frase com caracteres normalizados	Pontuação extra é removida no match; foco nas palavras.
dupla,evolutiva	termo único normalizado	A vírgula é removida e tende a virar duplaevolutiva, não dois termos separados.
dupla-evolutiva	termo único normalizado	O hífen é removido no match; não equivale a dupla evolutiva.
( dupla evolutiva sem fechar	fallback	Se os parênteses estiverem desbalanceados, cai para busca simples da query inteira normalizada.
Casos importantes:

dupla evolutiva não busca a frase exata; busca os dois termos em qualquer posição da linha/segmento.
Para frase exata, use "dupla evolutiva".
dupla-evolutiva e dupla evolutiva não são equivalentes.
Sem *, o match é parcial por substring.
Com *, o match usa regex com fronteira de palavra.