# Soccer Top (Sem Critério)

MVP multiplayer assíncrono para montar e comparar tops de jogadores de futebol — [Sem Critério](https://semcriterio.vercel.app): *O jogo de quem acha que entende*.

## Como funciona

1. **Criar session** — defina título e rounds (tema, top N, filtros por rodada)
2. **Compartilhar** — envie o link `/s/{code}` para amigos
3. **Montar top** — cada jogador escolhe N jogadores do dataset, no seu tempo
4. **Confirmar e votar** — rounds com votação anônima e pontuação de pódio (5/3/1)
5. **Resultados** — standings acumulados + abas por round

## Setup local

### 1. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha com as URLs do Supabase:

```bash
cp .env.example .env
```

No painel Supabase (**Project Settings → Database**):

- `DATABASE_URL` — Connection pooling (porta `6543`, mode Transaction)
- `DIRECT_URL` — Direct connection (porta `5432`)

### 2. Instalar e popular banco

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel + Supabase)

### O que você precisa fazer

1. **Supabase** — criar projeto e copiar `DATABASE_URL` + `DIRECT_URL`
2. **GitHub** — subir o código (`git push`)
3. **Vercel** — importar o repo e adicionar as mesmas env vars
4. **Seed** — rodar uma vez após o deploy:

```bash
npm run db:seed
```

(com `.env` apontando para o Supabase de produção)

### Como funciona o deploy

- **Vercel** hospeda o Next.js inteiro (páginas + `/api/*`)
- **Supabase** hospeda o Postgres
- O build na Vercel roda só `prisma generate && next build` (sem conectar ao banco)
- Migrações de schema: rode localmente após mudar `prisma/schema.prisma`:

```bash
npm run db:deploy
```

(com `.env` apontando para o Supabase de produção)

**Env vars na Vercel** (Settings → Environment Variables):

- `DATABASE_URL` — pooler, porta **6543** (runtime)
- `DIRECT_URL` — session pooler, porta **5432** (migrações locais). Evite `db.[ref].supabase.co` na Vercel se não tiver IPv4 add-on no Supabase.
- `NEXT_PUBLIC_SITE_URL` — URL canônica do site (ex.: `https://semcriterio.vercel.app`). Usada em metadata, sitemap, Open Graph e links canônicos.

Se o build antigo falhou com `P1001: Can't reach database server`, era o `migrate deploy` tentando abrir Postgres durante o build — isso não acontece mais no script padrão.

## SEO e discoverability

- **Google Search Console**: adicione a propriedade com a URL de produção (`NEXT_PUBLIC_SITE_URL`). Verifique via meta tag `google-site-verification` em `app/layout.tsx` ou registro DNS quando tiver domínio próprio.
- **Sitemap**: gerado em `/sitemap.xml` (rotas públicas estáticas).
- **Robots**: `/robots.txt` bloqueia salas privadas (`/s/*`), API e gameplay solo em andamento.
- **llms.txt**: `/llms.txt` descreve o produto para IAs (ChatGPT, Gemini, Perplexity).
- **Domínio próprio**: atualize `NEXT_PUBLIC_SITE_URL`, configure redirect 301 da URL Vercel e reenvie o sitemap no GSC.

- Supabase free pausa após ~7 dias sem uso (primeiro acesso depois disso demora alguns segundos)
- Sessions locais antigas (`dev.db`) não migram — produção começa zerada

## Stack

- Next.js 16 (App Router)
- Prisma 7 + PostgreSQL (Supabase)
- Tailwind CSS
- @dnd-kit (drag-and-drop)

## Dataset

Jogadores reais de duas fontes:

- **Lendas** (`prisma/seed/legends.json`) — 45 jogadores curados com rankings
- **Planilha** (`prisma/seed/source/top_200_jogadores.xlsx`) — ~1.200 registros das 6 ligas

O dataset final (`prisma/seed/players.json`) combina lendas + jogadores únicos da planilha.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run db:import-players` — importar planilha XLSX
- `npm run db:enrich-players` — enriquecer posição/clubes (Wikidata, com cache)
- `npm run db:merge-players` — gerar `players.json` final
- `npm run db:seed` — popular banco com jogadores
- `npm run db:migrate` — rodar migrations (dev)
- `npm run build` — generate + migrate deploy + build (produção)
