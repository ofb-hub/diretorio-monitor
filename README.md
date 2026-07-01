# Diretório Open Finance BR — Consulta & Monitoramento

SPA (React + Vite + TypeScript + Tailwind v4) para consulta e monitoramento do
**Diretório de Participantes do Open Finance Brasil**.

**🌐 Acesso:** https://ofb-hub.github.io/diretorio-monitor/

Os dados vêm ao vivo do diretório central (o mesmo JSON que alimenta a página
pública), consumido direto no navegador — o endpoint libera CORS (`Access-Control-Allow-Origin: *`).

**Fonte:** https://data.directory.openbankingbrasil.org.br/participants

## Funcionalidades

- **Dashboard** — KPIs (organizações, servers, APIs, certificações válidas/expirando/expiradas),
  top famílias de API e distribuição por role.
- **Participantes** — busca por nome/CNPJ, filtro por role, cards com resumo.
- **Detalhe do participante** — dados cadastrais, endereço, roles, e os
  Authorisation Servers com suas APIs, certificações e endpoints de descoberta.
- **APIs** — tabela pesquisável/filtrável de todas as APIs declaradas.
- **Certificações** — visão de compliance: expiradas primeiro, com filtros e busca.

Os dados são cacheados no `localStorage` por 15 min (mesmo TTL do servidor);
o botão **Atualizar dados** força uma nova busca.

## Rodar localmente

Requer Node.js (LTS) instalado.

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros scripts:

```bash
npm run build    # type-check (tsc -b) + build de produção
npm run preview  # serve o build
npm run lint     # oxlint
```

## Estrutura

```
src/
  types.ts                  # modelo de dados do diretório
  lib/
    directory.ts            # fetch + cache + normalização + estatísticas
    DirectoryContext.tsx    # provider React que carrega e compartilha os dados
  components/
    Layout.tsx              # sidebar + topo (atualizar / última atualização)
    ui.tsx                  # Badge, Card, KpiCard, Spinner, etc.
  pages/
    Dashboard.tsx
    Participants.tsx
    ParticipantDetail.tsx
    Apis.tsx
    Certifications.tsx
```

## Deploy (CI/CD)

O deploy é automático via **GitHub Actions** → **GitHub Pages**. A cada push na
branch `main`, o workflow em [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
faz build e publica em https://ofb-hub.github.io/diretorio-monitor/.

Detalhes:
- `vite.config.ts` usa `base: '/diretorio-monitor/'` só em produção (dev roda na raiz).
- O `BrowserRouter` usa `basename` derivado de `import.meta.env.BASE_URL`.
- O workflow copia `index.html` para `404.html` para que deep links (ex.:
  `/participantes/:id`) funcionem no Pages.

## Notas

- A aplicação é **somente consulta** — não faz polling ativo dos endpoints
  `discovery/status` e `discovery/outages` de cada instituição. Esses endpoints
  estão mapeados nos dados e são o caminho natural para uma futura versão com
  monitoramento de disponibilidade em tempo real.
