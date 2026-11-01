## Context

O `scraper-framework` e as três fontes de scraping já criam registros `Document` com `extractionStatus = PENDING`, mas nada os processa. Existem hoje 254 documentos reais em `PENDING` no banco de desenvolvimento (de execuções manuais das changes anteriores). O `shared/storage` existe apenas como módulo placeholder vazio desde `foundation-setup`. Esta change implementa o pipeline completo de download + extração, seguindo o mesmo padrão arquitetural já validado para scraping: fila BullMQ dedicada, processor isolado em worker próprio, API apenas enfileira.

## Goals / Non-Goals

**Goals:**
- Pipeline funcional de download + extração de texto para anexos em PDF, com segurança (SSRF, limite de tamanho, timeout, validação de tipo real do arquivo).
- Abstração de storage local, substituível por S3 sem alterar o resto do pipeline.
- Processamento assíncrono em worker dedicado, nunca bloqueando a API.
- Identificação de PDFs sem texto extraível (candidatos a OCR futuro), sem tratar isso como erro.
- Reprocessamento manual de documentos que falharam.
- Validação contra os 254 documentos reais já existentes.

**Non-Goals:**
- OCR em si (apenas identificação de necessidade).
- Extração de texto de DOCX genuínos.
- Análise por IA do conteúdo extraído.
- Armazenamento em S3 real (fica para change de deploy).
- Reprocessamento automático quando o anexo de origem mudar de conteúdo (o `scraper-framework` já cria um novo `Document` apenas quando a URL do anexo é nova; mudança de conteúdo no mesmo URL não é detectada nesta change).

## Decisions

**`StorageService` como interface abstrata com implementação local em sistema de arquivos para o MVP.** Define `upload(key, buffer, contentType): Promise<string>` (retorna a `storageKey` persistida) e `getBuffer(storageKey): Promise<Buffer>`. A implementação `LocalFilesystemStorageService` grava em um diretório configurável via `STORAGE_LOCAL_DIR` (padrão: `backend/uploads/`, fora do controle de versão). Alternativa considerada: implementar diretamente contra S3 desde já — rejeitada porque este ambiente de desenvolvimento não tem credenciais AWS configuradas, e a interface já isola essa troca para uma change de deploy futura sem retrabalho no pipeline.

**Extração de texto apenas para PDFs, via `pdf-parse`.** O planejamento cita "PDF.js ou pdf-parse"; `pdf-parse` tem API mais simples para uso server-side. Arquivos cujo tipo real (detectado pelos bytes mágicos, não pela extensão) não é PDF são armazenados normalmente, mas sem tentativa de extração — `extractedText` permanece `null` e `documentType` reflete o tipo real detectado. **Nota de implementação**: a versão instalada do `pdf-parse` (2.4.5) tem uma API orientada a classe (`new PDFParse({ data: buffer }); const result = await parser.getText(); result.text / result.total`), diferente da função simples `pdf(buffer)` da v1 — descoberto apenas ao rodar o build, já corrigido no código. Também foi necessário adicionar `NODE_OPTIONS=--experimental-vm-modules` aos scripts de teste em `package.json`: o `pdfjs-dist` (dependência do `pdf-parse` v2) tenta configurar um "fake worker" em ambiente Node via `import()` dinâmico, que falha sob o runtime padrão do Jest sem essa flag.

**Detecção do tipo real do arquivo pelos bytes mágicos, não pela extensão da URL ou pelo `Content-Type` declarado pelo servidor remoto.** Os anexos capturados têm nomes de arquivo inconsistentes com o conteúdo real (ex.: `"...anexos.docx_0.pdf"` no Cultura SEEC-PR, onde o arquivo final servido é de fato um PDF apesar do nome). Verificação simples da assinatura binária (`%PDF` para PDF; `PK\x03\x04` para formatos baseados em ZIP, incluindo DOCX) é suficiente para os dois formatos relevantes e evita depender de uma biblioteca externa de detecção de tipo.

**`needsOcr` como campo booleano em `Document`, não um novo valor de `extractionStatus`.** Um PDF digitalizado (sem texto extraível) não é uma falha de processamento — o download e a tentativa de extração funcionaram corretamente, só não há texto digital no arquivo. Por isso, `extractionStatus = COMPLETED` com `extractedText` vazio/curto e `needsOcr = true`, em vez de `FAILED`. `FAILED` é reservado para erros reais: URL inválida/bloqueada por SSRF, tamanho excedido, timeout, tipo de arquivo não suportado além de PDF/DOCX, ou PDF corrompido/não parseável. Critério de "sem texto extraível": texto extraído com menos de 20 caracteres após remoção de espaços.

**Disparo do processamento via extensão do `scraper-framework`, não via um sweep/poller periódico.** Ao criar um novo `Document` (não ao atualizar um já existente — `createPendingDocuments` já tem essa distinção), `ScrapersService` agora também enfileira um job na fila `documents` com o id do documento. Isso é uma extensão pequena e direta, documentada como `MODIFIED` na capability `scraper-framework`, e evita construir um mecanismo de varredura periódica separado só para descobrir documentos `PENDING` — mais simples e com menor superfície para esta fase do MVP. Para os 254 documentos já existentes no banco (criados antes desta change existir), um script/execução manual de backfill enfileira os jobs retroativamente durante a validação.

**Proteção contra SSRF: resolver o hostname e validar o IP antes de qualquer requisição.** Apenas esquemas `http`/`https` são aceitos; o hostname é resolvido via `dns.lookup` e o IP resultante é verificado contra faixas privadas/loopback/link-local/multicast (IPv4 e IPv6) antes do `fetch`. Requisições para esses destinos são rejeitadas com `FAILED` e mensagem de erro clara, sem nunca completar a conexão.

**Limite de tamanho e timeout no download, com streaming.** Download via `fetch` com leitura incremental do corpo (`ReadableStream`), abortando (via `AbortController`) se o tamanho acumulado exceder um limite configurável (padrão: 25 MB — suficiente para editais e anexos típicos, generoso o bastante para não rejeitar documentos legítimos) ou se o tempo total exceder um timeout configurável (padrão: 30s). Evita carregar arquivos muito grandes inteiramente em memória antes de decidir se são aceitáveis.

**Fila/worker dedicados (`documents`), seguindo exatamente o padrão de `scrapers`.** `DocumentsModule` registra a fila; `DocumentProcessorModule` (importado apenas pelo `document.worker.ts`) registra o `@Processor`, para que a API nunca processe documentos dentro do próprio processo — mesma decisão já validada para scraping.

## Risks / Trade-offs

- [Detecção de tipo por bytes mágicos cobre apenas PDF e DOCX; outros formatos eventualmente capturados por fontes futuras cairiam em "tipo não suportado" → `FAILED`] → Aceitável no MVP; a mensagem de erro deixa claro o motivo, e novos formatos podem ser adicionados à função de detecção sem alterar o resto do pipeline.
- [Critério de "sem texto extraível" (menos de 20 caracteres) é uma heurística simples, pode classificar incorretamente PDFs com pouquíssimo texto real como `needsOcr`] → Aceitável para o MVP; revisável com dados reais na change de testes/homologação (seção 17 do planejamento, golden set de editais de referência).
- [Enfileirar o processamento diretamente do `scraper-framework` cria uma dependência de módulo (`scrapers` → `documents`)] → Aceitável: é uma dependência unidirecional (documents não depende de scrapers), e mais simples que um poller periódico separado para esta fase do MVP.
- [Limite de 25 MB pode rejeitar algum anexo legítimo incomum] → Configurável via variável de ambiente; ajustável sem mudança de código se necessário.
- [Armazenamento local em disco não é adequado para produção multi-instância] → Documentado como decisão explícita de MVP; a interface `StorageService` isola essa troca para a change de deploy.
- [**Descoberto durante a implementação**: o shadow database do Prisma (usado por `migrate dev` para detecção de drift) recria o schema `public` do zero a cada execução, removendo qualquer extensão herdada via `template1` — a migration `init` precisou declarar `CREATE EXTENSION IF NOT EXISTS postgis;` explicitamente] → Corrigido sem perda de dados: checksum da migration já aplicada atualizado manualmente em `_prisma_migrations` no banco de dev real, evitando `migrate reset`. Relevante para qualquer projeto Prisma + PostGIS.

## Migration Plan

1. Adicionar `pageCount` e `needsOcr` ao schema Prisma (migration incremental, campos opcionais/com default — não quebra dados existentes).
2. Implementar `StorageService` + `LocalFilesystemStorageService`.
3. Implementar `DocumentsService` (download, detecção de tipo, extração, persistência).
4. Implementar fila, processor e worker dedicado.
5. Conectar `ScrapersService` ao enfileiramento automático para novos documentos.
6. Backfill: enfileirar manualmente os 254 documentos `PENDING` já existentes e validar o resultado.

Rollback: como não há dados de produção, reverter a migration e descartar os registros processados em ambiente de desenvolvimento é suficiente.

## Open Questions

- Se um anexo real for maior que 25 MB com frequência (ex.: editais muito longos com imagens), reavaliar o limite com dados reais de uso.
- Avaliar, em change futura, se vale a pena reprocessar um `Document` quando o `scraper-framework` detecta que o conteúdo da oportunidade mudou (hoje isso não dispara reprocessamento de anexos já existentes com a mesma URL).
