# pokeprinterbr

SPA em React + Vite + TypeScript para montar folhas de proxies de Pokémon
prontas pra imprimir: busca as cartas, adiciona num carrinho e exporta um
PDF com o layout certo pro corte.

## Funcionalidades

- **Catálogo por coleção**: cartas agrupadas por coleção (Delta Reign,
  Promos, 30th Anniversary Collection), cada grupo com título e contagem.
- **Busca**: por nome, número ou set, com filtro por coleção.
- **Zoom com navegação**: clicar numa carta abre um overlay centralizado
  com a imagem grande; setas laterais, teclado (← → e Esc) e swipe (mobile)
  navegam entre as cartas do resultado atual, com botão de adicionar ao
  carrinho direto no overlay.
- **Carrinho**: estilo "carrinho de compras", com badge de quantidade,
  stepper +/-, persistido em `localStorage` (sobrevive a refresh). No
  desktop fica fixo do lado; no mobile vira um drawer acessível pelo botão
  no header.
- **Exportação em PDF** (client-side, via `jsPDF`, sem backend):
  - Tamanho de carta: 63×88mm (padrão) × 0,97 = **61,11×85,36mm** (proxy
    3% menor que o real).
  - Grade automática por página (A4 ou Carta/Letter), ~9 cartas por
    página, com guias de corte (crop marks) que não passam em cima da
    arte.
  - Respeita as quantidades do carrinho e gera múltiplas páginas.

## Stack

React 19 + TypeScript + Vite. Sem backend — tudo roda no navegador,
incluindo a geração do PDF (`src/lib/pdf.ts`).

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (type-check + vite build)
npm run preview   # serve o build de producao localmente
```

## Pipeline de imagens

As imagens das cartas ficam em `public/cards/<Colecao>/` como `.webp`
(convertidas de PNG/JPG originais, quality 82 — ~37% menor que os PNGs de
origem, sem perda visível). O catálogo (`src/data/cards.json`) é gerado a
partir dos nomes de arquivo (`<setCode>-<numero>-<Nome>.webp`).

### Adicionar uma coleção nova

```
para converter\Nova_Colecao\6b-001-Bulbasaur.png   (coloque as imagens aqui)

npm run convert-images       # gera public/cards/Nova_Colecao/*.webp
npm run generate-manifest    # atualiza src/data/cards.json
```

A pasta `para converter/` fica de propósito no `.gitignore` — guarda os
originais localmente sem inflar o repositório; só o `.webp` final em
`public/cards/` é versionado.

### Scripts relevantes

| Script | O que faz |
| --- | --- |
| `scripts/convert-to-webp.mjs` | Converte `para converter/<Colecao>/*.{png,jpg}` para `public/cards/<Colecao>/*.webp` (via `sharp`, quality 82, effort 6). |
| `scripts/generate-manifest.mjs` | Varre `public/cards/` e gera `src/data/cards.json` (nome, coleção, número, path da imagem). |

Fora deste projeto, `../scrape-images.js` (Node puro, sem dependências) é
o scraper original que baixou o catálogo de imagens de
`pokemonproxies.com` — só precisa rodar de novo se a fonte das cartas for
essa mesma.

## Decisões de implementação (pra lembrar o porquê)

- **PDF em vez de PDF+DOCX**: PDF garante escala exata em mm na
  impressão; Word pode reescalar a página ao imprimir, o que
  distorceria o tamanho das cartas.
- **PNG (nao WEBP) embutido no PDF**: o `jsPDF` lê `.webp` nativamente,
  mas por baixo dos panos decodifica e reconverte pra JPEG, o que perde
  o canal alpha (transparência dos cantos arredondados da carta). Por
  isso `src/lib/pdf.ts` decodifica cada imagem via `<canvas>` no
  navegador e sempre embute como PNG antes de mandar pro `jsPDF`.
- **Ordem do carrinho = ordem de inserção**: `Object.values()` num
  objeto indexado por id de carta preserva a ordem em que as chaves
  foram inseridas; não há sort nenhum aplicado sobre `lines`.

## Próximos passos

### Servir as imagens via backend/API (planejado, não implementado)

Hoje as imagens (~15MB, 97 arquivos) são servidas como assets estáticos
do próprio build do Vite (`public/cards/`) — funciona bem nesse volume e
custa zero em qualquer hosting estático (Vercel/Netlify/Cloudflare
Pages).

A ideia futura é desacoplar as imagens do deploy do frontend, hospedando
num backend próprio, **autenticado** — só pra uso pessoal, sem servir
publicamente:

- **Storage**: Cloudflare R2 (S3-compatível, sem taxa de egress —
  diferente do S3 puro, que cobra por banda de saída). Custo de
  armazenamento é ínfimo nesse volume (~$0,015/GB/mês).
- **Camada de autenticação**: um Cloudflare Worker na frente do bucket
  (privado, não exposto publicamente) validando um token/API key antes
  de servir qualquer imagem ou o catálogo — só o frontend, com a chave
  configurada, consegue puxar os dados. Alternativa: Cloudflare Access
  na frente do Worker, gating por login pessoal (GitHub/Google) em vez
  de token fixo.
- **Catálogo**: o próprio `cards.json` passa a ser gerado/servido pelo
  Worker junto com as imagens, no lugar de ser importado estaticamente
  no bundle do frontend.
- **Frontend**: passa a consumir a API autenticada (fetch com o
  token/sessão) em vez de importar `src/data/cards.json` e usar paths
  relativos de `public/cards/`.

Sem prazo definido — só documentando a direção pra não perder o
contexto da decisão.
