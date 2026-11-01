## Context

A change `foundation-setup` entrega o esqueleto do backend, o schema Prisma e a fila Redis/BullMQ configurada, mas sem filas ou processors de negócio. Esta change é a primeira a colocar lógica de negócio real nos módulos `scrapers` e no worker `scraper.worker.ts`. O portal escolhido (`www.cultura.pr.gov.br`) foi validado via levantamento técnico: HTML estático, sem autenticação, sem paginação central — a descoberta de editais abertos depende de parsear o submenu "Editais e Licitações > Editais Abertos" presente em todas as páginas do site, não de uma listagem dedicada com paginação.

## Goals / Non-Goals

**Goals:**
- Interface `NoticeScraper` genérica, reutilizável pelas próximas fontes (Fundação Araucária, Compras Paraná).
- Scraper funcional da fonte Cultura SEEC-PR, capaz de descobrir editais abertos, extrair seus dados e identificar anexos, sem depender de login ou captcha.
- Deduplicação robusta: uma segunda execução sobre o mesmo conteúdo não duplica registros.
- Execução agendada diária via BullMQ, com possibilidade de disparo manual, registrando início/fim/erros em `ScraperExecution`.
- Testes que não dependem de rede (fixtures HTML locais).

**Non-Goals:**
- Download real de PDFs ou extração de texto (fica para a change de pipeline de documentos).
- Qualquer análise por IA do conteúdo capturado.
- Geocodificação do município do edital.
- Exposição via API REST das oportunidades capturadas (consumo nesta change é direto no banco, para fins de verificação).
- Scraper de Fundação Araucária ou Compras Paraná.

## Decisions

**Cheerio em vez de Playwright para esta fonte.** O levantamento técnico confirmou que `www.cultura.pr.gov.br` é renderizado server-side (Drupal), sem necessidade de JavaScript para ver o conteúdo. Cheerio é suficiente e mais barato em recursos que um navegador headless. Playwright fica reservado para fontes que exijam JS (a avaliar nas próximas fontes).

**Descoberta de editais via parsing do menu, não de uma "listagia" dedicada.** Como o site não tem uma página central paginada de editais abertos, o scraper obtém a lista de URLs de editais abertos a partir do submenu presente no HTML de qualquer página do site (ex.: a própria home). Isso é modelado como `fetchOpportunities()` retornando uma lista de referências mínimas (URL + título), e `fetchOpportunityDetails(externalId)` busca a página `/Pagina/<slug>` para extrair os dados completos. Alternativa considerada: crawlear todo o site em busca de padrões de URL `/Pagina/Edital-*` — rejeitada por ser mais frágil e mais pesada para o servidor do que seguir o menu de navegação oficial.

**`externalId` derivado do slug da URL (`/Pagina/<slug>`), não de um ID numérico do portal.** O site não expõe um identificador numérico estável por edital; o slug da URL é o identificador mais estável disponível. `officialUrl` é a URL completa normalizada (sem parâmetros de tracking, se houver).

**Deduplicação em duas camadas.** Camada 1: restrição de unicidade (`sourceId`, `externalId`) já definida no schema da change `foundation-setup` — garante que o mesmo slug nunca gera duas linhas em `Opportunity`. Camada 2: `contentHash` (hash do conteúdo relevante extraído da página) para detectar que o conteúdo de um edital já capturado mudou, disparando uma atualização em vez de um no-op. Alternativa considerada: comparar campo a campo — rejeitada por ser mais custosa e mais sensível a mudanças irrelevantes de formatação do HTML.

**Download de anexos não ocorre nesta change — apenas o registro.** Ao identificar os links de PDF/DOCX na página do edital, o scraper cria registros `Document` com `status = PENDING` e a URL de origem preservada em metadado (no `rawData` da oportunidade ou em campo de observação), mas não baixa o arquivo. Isso respeita a separação de responsabilidades definida no planejamento (download é de um worker/change separado) e evita acoplar esta change ao armazenamento (S3/storage), que ainda não foi implementado.

**Agendamento via BullMQ repeatable job, execução diária, com lock por fonte.** Usa o `shared/queue` já configurado na change anterior para registrar um job repetível (`every: 24h` ou `cron` diário) que dispara o processor do scraper da fonte Cultura SEEC-PR. Um lock (ex.: campo de controle em `ScraperExecution` com status `RUNNING` para a fonte) previne execuções concorrentes da mesma fonte, conforme exigido na seção 6.3 do planejamento.

**Tratamento de falha de rede/parsing não aborta a execução inteira.** Se a extração de um edital específico falhar (ex.: mudança de layout em uma página), a execução registra a falha naquele item, segue processando os demais, e marca `ScraperExecution.status = PARTIALLY_COMPLETED` ao final, nunca mascarando falhas parciais como sucesso total.

## Risks / Trade-offs

- [Site não tem contrato estável (sem API); mudanças de HTML quebram o scraper sem aviso] → Mitigar com testes de fixture que falham visivelmente quando a estrutura esperada não é encontrada, e logs claros indicando qual seletor falhou, para detecção rápida.
- [Descoberta via menu pode não listar editais "abertos" que não estejam destacados no menu, ou pode perder itens se o menu mudar de nome/estrutura] → Documentar essa limitação explicitamente; se necessário, uma change futura pode adicionar crawling complementar por padrão de URL como fallback.
- [`externalId` baseado em slug pode mudar se o portal reorganizar URLs, gerando falsa duplicata] → Aceitável no MVP; mitigado por `officialUrl` como segundo identificador de correlação, e monitorável via logs de `ScraperExecution` quando o número de itens "novos" for anormalmente alto.
- [Ausência de rate limiting ao portal externo pode ser interpretada como abuso] → Aplicar um intervalo mínimo entre requisições (ex.: 1-2s) e um `User-Agent` identificável, conforme a diretriz de segurança do planejamento (seção 14) sobre respeitar políticas de acesso de terceiros.
- [Testes acoplados a fixtures podem ficar defasados se o site mudar e ninguém atualizar os fixtures] → Aceitar como trade-off do MVP; mitigação futura (fora de escopo) seria um job periódico de smoke-test contra o site real em homologação.

## Migration Plan

1. Implementar `scraper-framework` (interface, normalização, dedup, registro de execução) sem nenhuma fonte concreta ainda.
2. Implementar `cultura-pr-scraper` sobre o framework.
3. Criar o registro `Source` da fonte Cultura SEEC-PR via seed ou migration de dados (não via UI, que não existe ainda).
4. Rodar o scraper manualmente (endpoint/admin ou script) contra o site real em ambiente de desenvolvimento, validar que editais reais são persistidos corretamente.
5. Registrar o job agendado (diário) via BullMQ.
6. Validar reexecução sem duplicar e com atualização correta de conteúdo alterado.

Rollback: como não há dados de produção, remover o job agendado e os registros de `Opportunity`/`Document`/`ScraperExecution` da fonte em ambiente de desenvolvimento é suficiente.

## Open Questions

- O portal pode alterar a estrutura do menu "Editais Abertos" sem aviso — se isso ocorrer com frequência, vale revisitar a estratégia de descoberta (ex.: crawling por padrão de URL) em uma change futura, não nesta.
- Falta confirmar, durante a implementação, se os PDFs em `arquivos_restritos` permanecem acessíveis sem cookies/sessão em todos os casos (o levantamento técnico sugere que sim, mas não foi exaustivamente testado) — isso só impacta a change de pipeline de documentos, mas o registro do `Document` nesta change deve preservar a URL completa para essa verificação futura.
