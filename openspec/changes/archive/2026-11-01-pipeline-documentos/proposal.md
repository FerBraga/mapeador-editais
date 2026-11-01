## Why

As três fontes de scraping já implementadas (`primeiro-scraper`, `expansao-scrapers`) criam registros `Document` com `extractionStatus = PENDING` para cada anexo identificado, mas nenhum download ou extração de texto ocorre de fato — os 254 documentos reais já capturados em ambiente de desenvolvimento permanecem `PENDING` indefinidamente. O planejamento do produto (Etapa 5) prevê o pipeline completo: download dos anexos, cálculo de checksum, extração de texto de PDFs preservando a contagem de páginas, identificação de documentos sem texto extraível (candidatos a OCR futuro) e controle de status que nunca trata um edital incompleto como totalmente processado.

Sem esse pipeline, a próxima change (análise por IA) não teria texto nenhum para analisar — este é um bloqueador direto para a Etapa 6.

## What Changes

- Implementar `shared/storage` (hoje um módulo placeholder vazio, criado na change `foundation-setup`): uma abstração `StorageService` com uma implementação em sistema de arquivos local (`LocalFilesystemStorageService`) para o ambiente de desenvolvimento, projetada para ser substituída por um adaptador S3-compatível em change de deploy futura, sem alterar o restante do pipeline.
- Implementar o módulo `documents` com lógica real: download do anexo (com proteção contra SSRF, limite de tamanho, timeout, streaming), cálculo de checksum (sha256), identificação do tipo real do arquivo pelos bytes mágicos (não apenas pela extensão/Content-Type declarado), armazenamento via `StorageService`, e extração de texto para PDFs via `pdf-parse`, preservando a contagem de páginas.
- Identificar PDFs sem texto extraível (prováveis digitalizações/scans) com uma flag `needsOcr`, sem tratar isso como falha — o OCR em si fica fora de escopo desta change, conforme o planejamento.
- Adicionar os campos `pageCount` e `needsOcr` ao modelo `Document` (migration adicional, sem alterar os campos já existentes).
- Processar cada `Document` em um worker dedicado (fila BullMQ `documents`), nunca dentro da requisição HTTP da API, seguindo o mesmo padrão arquitetural do `scraper-framework` (fila + processor + worker separado).
- Conectar a criação de `Document` pelo `scraper-framework` ao disparo automático do processamento: ao criar um novo `Document` com anexo identificado, um job de processamento é enfileirado automaticamente (pequena extensão documentada como `MODIFIED` na capability `scraper-framework`, sem alterar seu comportamento de não baixar arquivos diretamente).
- Expor endpoint de reprocessamento manual (`POST /api/v1/documents/:id/reprocess`) para documentos que falharam, sem duplicar o registro.
- Processar os 254 documentos reais já existentes no banco (de execuções anteriores dos scrapers) como parte da validação manual desta change.

Fora de escopo nesta change: extração de texto de arquivos DOCX genuínos (apenas PDFs são processados; DOCX reais ficam armazenados sem `extractedText`, com `documentType` refletindo o formato real), OCR em si, análise por IA do texto extraído, e armazenamento em S3 real (fica para change de deploy).

## Capabilities

### New Capabilities
- `document-processing-pipeline`: download seguro de anexos, armazenamento via abstração de storage, extração de texto de PDFs com contagem de páginas, identificação de documentos sem texto extraível, controle de status e reprocessamento manual.

### Modified Capabilities
- `scraper-framework`: ao criar um novo registro `Document` para um anexo identificado, o sistema agora também enfileira automaticamente um job de processamento (download + extração), em vez de deixar o documento `PENDING` indefinidamente até uma ação externa. O comportamento de não baixar o anexo diretamente dentro do próprio scraper permanece inalterado.

## Impact

- **Novo código**: `backend/src/shared/storage/` (interface + implementação local), `backend/src/modules/documents/` (service, controller, processor, módulo de worker dedicado), schema Prisma (migration incremental em `Document`).
- **Dependências novas**: `pdf-parse` para extração de texto de PDFs.
- **Banco de dados**: migration adicional em `Document` (`pageCount`, `needsOcr`); dados existentes (os 254 documentos `PENDING` já no banco) serão processados como parte da validação.
- **Sistemas externos**: requisições HTTP reais aos domínios onde os anexos estão hospedados (`cultura.pr.gov.br`, `fappr.pr.gov.br`); nenhuma requisição ao PNCP, já que a fonte `pncp-pr` não produz anexos nesta etapa do projeto.
- **Risco de segurança**: download de arquivos a partir de URLs capturadas por scraping é uma superfície de SSRF; mitigado por validação de esquema (apenas http/https) e bloqueio de IPs privados/loopback/link-local antes de qualquer requisição, conforme a diretriz de segurança do planejamento (seção 14).
