# Diretório Open Finance BR — Consulta & Monitoramento


**🌐 Acesso:** https://ofb-hub.github.io/diretorio-monitor/

Os dados vêm ao vivo do diretório central (o mesmo JSON que alimenta a página
pública), consumido direto no navegador — o endpoint libera CORS (`Access-Control-Allow-Origin: *`).

**Fonte:** https://data.directory.openbankingbrasil.org.br/participants

## Notas

- A aplicação é **somente consulta** — não faz polling ativo dos endpoints
  `discovery/status` e `discovery/outages` de cada instituição. Esses endpoints
  estão mapeados nos dados e são o caminho natural para uma futura versão com
  monitoramento de disponibilidade em tempo real.
