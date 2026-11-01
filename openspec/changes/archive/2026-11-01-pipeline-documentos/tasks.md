## 1. Schema

- [x] 1.1 Adicionar `pageCount Int?` e `needsOcr Boolean @default(false)` ao modelo `Document` no schema Prisma
- [x] 1.2 Criar e aplicar a migration incremental (`prisma migrate dev`), validando que os documentos existentes (162) não são afetados pela adição dos novos campos — **bug real descoberto e corrigido**: o shadow database do Prisma recria o schema `public` do zero a cada execução, removendo o PostGIS herdado via `template1`; a extensão precisa ser criada dentro da própria migration SQL (`CREATE EXTENSION IF NOT EXISTS postgis;` adicionada à migration `init`, com o checksum em `_prisma_migrations` corrigido manualmente para não exigir reset do banco de dev)

## 2. Abstração de Storage

- [x] 2.1 Definir a interface/classe abstrata `StorageService` (`upload(key, buffer, contentType): Promise<string>`, `getBuffer(storageKey): Promise<Buffer>`) em `shared/storage`
- [x] 2.2 Implementar `LocalFilesystemStorageService`, gravando em diretório configurável via `STORAGE_LOCAL_DIR` (padrão `uploads`, resolvido a partir do cwd do processo — `backend/uploads/` em execução normal)
- [x] 2.3 Registrar `LocalFilesystemStorageService` como implementação de `StorageService` no `StorageModule` (substituindo o placeholder vazio)
- [x] 2.4 Adicionar `backend/uploads/` ao `.gitignore` (já estava presente desde `foundation-setup`)

## 3. Download Seguro

- [x] 3.1 Implementar validação de esquema (apenas `http`/`https`) e resolução de hostname via `dns.lookup`, rejeitando IPs de faixas privadas/loopback/link-local/multicast (IPv4 e IPv6) antes de qualquer requisição
- [x] 3.2 Implementar download com streaming, limite de tamanho configurável (padrão 25 MB, variável de ambiente) e timeout configurável (padrão 30s, via `AbortController`)
- [x] 3.3 Implementar cálculo de checksum (sha256) durante o streaming do download
- [x] 3.4 Implementar detecção do tipo real do arquivo pelos bytes mágicos (`%PDF` para PDF; `PK\x03\x04` para formatos ZIP/DOCX)

## 4. Extração de Texto

- [x] 4.1 Instalar `pdf-parse` — **desvio do plano**: a versão instalada (2.4.5) tem API totalmente diferente da v1 assumida no design (`new PDFParse({ data: buffer })` + `parser.getText()`, não mais `pdf(buffer)` direto); corrigido após o build falhar
- [x] 4.2 Implementar extração de texto e contagem de páginas para arquivos identificados como PDF reais (`result.text`, `result.total`)
- [x] 4.3 Implementar critério de "sem texto extraível" (menos de 20 caracteres após remoção de espaços) marcando `needsOcr = true`, sem tratar como falha
- [x] 4.4 Para arquivos não-PDF (ex.: DOCX genuíno), armazenar sem tentar extração, com `extractedText` nulo e `documentType` refletindo o tipo real; tipo verdadeiramente desconhecido (nem PDF nem DOCX) é tratado como `FAILED`, não `COMPLETED`

## 5. Serviço, Fila, Processor e Worker

- [x] 5.1 Implementar `DocumentsService.processDocument(documentId)`: busca o documento, valida se já está `COMPLETED` (evita reprocessamento duplicado fora do fluxo manual), marca `PROCESSING`, executa download → detecção de tipo → armazenamento → extração (se PDF), persiste resultado final (`COMPLETED`/`FAILED`, `storageKey`, `checksum`, `fileSize`, `mimeType`, `extractedText`, `pageCount`, `needsOcr`, `errorMessage` em caso de falha)
- [x] 5.2 Adicionar `errorMessage String?` ao modelo `Document` (migration) para registrar a causa de falhas de download/extração
- [x] 5.3 Criar `documents.constants.ts` (nome da fila `documents`, nome do job `process-document`)
- [x] 5.4 Registrar a fila `documents` em `DocumentsModule` (API apenas enfileira)
- [x] 5.5 Implementar `DocumentQueueProcessor` (`@Processor('documents')`) e `DocumentProcessorModule`, seguindo o padrão de `ScraperQueueProcessor`/`ScraperProcessorModule`
- [x] 5.6 Atualizar `document.worker.ts` para usar um `DocumentWorkerModule` dedicado (`AppModule` + `DocumentProcessorModule`), substituindo o stub da change `foundation-setup`

## 6. Conexão com o Scraper-Framework

- [x] 6.1 Modificar `ScrapersService.createPendingDocuments` para enfileirar um job `process-document` na fila `documents` apenas para documentos recém-criados (não para os já existentes/ignorados por já terem a mesma `sourceUrl`) — `ScrapersModule` agora importa `DocumentsModule`
- [x] 6.2 Expor `POST /api/v1/documents/:id/reprocess` em `DocumentsController`: reseta o documento para `PENDING` e enfileira um novo job, sem criar registro duplicado

## 7. Testes

- [x] 7.1 Escrever testes unitários da validação de SSRF (IPv4/IPv6 privadas/loopback/link-local rejeitadas; públicas aceitas; esquemas não-http(s) rejeitados)
- [x] 7.2 Escrever testes unitários da detecção de tipo real por bytes mágicos (PDF, DOCX/ZIP, tipo desconhecido, extensão enganosa ignorada)
- [x] 7.3 Escrever testes unitários da extração de texto usando um PDF de fixture real com texto (gerado programaticamente, com MediaBox largo o suficiente — um `MediaBox` estreito demais faz o `pdf.js` cortar o texto extraído, achado durante a implementação), validando contagem de páginas
- [x] 7.4 Escrever teste do critério de `needsOcr` usando um PDF de fixture sem conteúdo de texto (stream vazio)
- [x] 7.5 Escrever testes de `DocumentsService.processDocument` cobrindo sucesso (PDF com texto), `needsOcr`, DOCX genuíno, tipo desconhecido, falha por SSRF, falha por tamanho excedido, e "já `COMPLETED` não reprocessa" — com mocks de rede e storage, sem acesso real. **Bug corrigido durante os testes**: `jest.mock` automático do módulo de download também substituía a classe `DownloadError` por um mock que não estende `Error`, quebrando `instanceof Error` no serviço; corrigido mantendo a classe real via `jest.requireActual`
- [x] 7.6 Escrever teste confirmando que `ScrapersService` enfileira o job apenas para documentos novos, não para já existentes

**Achado adicional**: os testes de extração de PDF só passam com a flag `NODE_OPTIONS=--experimental-vm-modules` (adicionada aos scripts `test`/`test:watch`/`test:cov` em `package.json`), pois o `pdfjs-dist` (dependência do `pdf-parse` v2) usa `import()` dinâmico para configurar seu "fake worker" em Node, o que falha sob o runtime padrão do Jest.

## 8. Validação Manual Contra os Sistemas Reais

- [x] 8.1 Fazer o backfill: enfileirar manualmente o processamento dos documentos `PENDING` já existentes no banco (162, não 254 — número correto confirmado nesta change; o número citado na proposta vinha de uma lembrança imprecisa de uma sessão anterior) — **162/162 `COMPLETED`**
- [x] 8.2 Confirmar que uma amostra de PDFs reais tem texto extraído corretamente, com contagem de páginas plausível — confirmado (amostra de 10 documentos aleatórios: título/texto reais extraídos corretamente, `pageCount` entre 1 e 34, consistente com o tipo de documento)
- [x] 8.3 Confirmar `needsOcr` — **nenhum dos 162 documentos reais precisou de OCR** (todos são PDFs gerados digitalmente pelos próprios portais, não digitalizações/scans); documentado como observação real, não uma lacuna do critério
- [x] 8.4 Disparar uma nova execução de scraper (`cultura-pr`, `fundacao-araucaria`) e confirmar ausência de regressão — conteúdo não mudou desde a última captura, então 0 documentos novos foram criados (dedup correto); o disparo automático de enfileiramento para documentos *novos* já está coberto pelo teste unitário dedicado de `ScrapersService` (seção 7.6), que verifica diretamente a chamada a `enqueueNewDocument`
- [x] 8.5 Testar o reprocessamento manual de um documento: simulado um `FAILED`, chamado `POST /api/v1/documents/:id/reprocess`, confirmado retorno a `COMPLETED` com o mesmo `id` e contagem total de documentos inalterada (sem duplicata)

## 9. Validação Final

- [x] 9.1 Confirmar que a API nunca bloqueia aguardando o processamento — confirmado: `POST /documents/:id/reprocess` retornou `{"jobId": "163"}` imediatamente, mesmo padrão já validado para scrapers
- [x] 9.2 Atualizar o README com os passos para rodar o `worker:document` com lógica real, a variável `STORAGE_LOCAL_DIR`, `SHADOW_DATABASE_URL` (achado desta change) e o endpoint de reprocessamento
