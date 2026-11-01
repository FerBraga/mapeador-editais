## ADDED Requirements

### Requirement: Download Seguro de Anexos
O sistema SHALL baixar o conteúdo de um anexo a partir da `sourceUrl` de um `Document`, validando que o esquema é `http` ou `https` e que o IP resolvido do host não pertence a faixas privadas, de loopback, link-local ou multicast, rejeitando a requisição antes de qualquer conexão caso essa validação falhe.

#### Scenario: URL apontando para rede interna é rejeitada
- **WHEN** a `sourceUrl` de um documento resolve para um IP de faixa privada, loopback ou link-local
- **THEN** o download não é realizado, e o documento é marcado com `extractionStatus = FAILED` e uma mensagem de erro indicando o bloqueio

#### Scenario: URL pública válida é baixada
- **WHEN** a `sourceUrl` de um documento resolve para um IP público
- **THEN** o conteúdo é baixado normalmente

### Requirement: Limite de Tamanho e Timeout no Download
O sistema SHALL abortar o download de um anexo caso o tamanho acumulado do corpo exceda um limite configurável ou caso o tempo total de download exceda um timeout configurável, sem carregar o arquivo inteiro em memória antes dessa verificação.

#### Scenario: Arquivo maior que o limite configurado
- **WHEN** o corpo da resposta de download excede o limite de tamanho configurado antes de terminar
- **THEN** o download é abortado e o documento é marcado com `extractionStatus = FAILED` e mensagem de erro indicando o motivo

#### Scenario: Download mais lento que o timeout configurado
- **WHEN** o download de um anexo não termina dentro do timeout configurado
- **THEN** a requisição é abortada e o documento é marcado com `extractionStatus = FAILED`

### Requirement: Identificação do Tipo Real do Arquivo
O sistema SHALL identificar o tipo real de um arquivo baixado pelos seus bytes mágicos (assinatura binária), não apenas pela extensão da URL ou pelo `Content-Type` declarado pelo servidor de origem, e SHALL registrar esse tipo real no documento.

#### Scenario: Arquivo com extensão enganosa na URL
- **WHEN** a `sourceUrl` de um anexo sugere um formato (pela extensão) diferente do tipo real detectado pelos bytes do arquivo baixado
- **THEN** o documento é processado conforme o tipo real detectado, não conforme a extensão da URL

### Requirement: Armazenamento via Abstração de Storage
O sistema SHALL armazenar o conteúdo baixado através de uma abstração de armazenamento (`StorageService`), persistindo a chave de armazenamento retornada no campo `storageKey` do documento, de forma que a implementação de armazenamento (sistema de arquivos local ou, futuramente, um serviço compatível com S3) possa ser substituída sem alterar o restante do pipeline.

#### Scenario: Armazenamento local em ambiente de desenvolvimento
- **WHEN** um anexo é baixado com sucesso em ambiente de desenvolvimento
- **THEN** seu conteúdo é persistido no sistema de arquivos local através da implementação configurada de `StorageService`, e a `storageKey` retornada é salva no documento

### Requirement: Extração de Texto de PDFs com Contagem de Páginas
Para arquivos cujo tipo real detectado é PDF, o sistema SHALL extrair o texto do documento e preservar a contagem de páginas, persistindo ambos no registro do documento.

#### Scenario: PDF com texto extraível
- **WHEN** um PDF baixado contém texto digital extraível
- **THEN** o texto extraído e a contagem de páginas são persistidos, e `extractionStatus` é marcado como `COMPLETED`

### Requirement: Identificação de Documentos Sem Texto Extraível
O sistema SHALL identificar PDFs cujo texto extraído seja inexistente ou insuficiente (indicando uma provável digitalização/scan), marcando-os com `needsOcr = true`, sem tratar essa condição como uma falha de processamento.

#### Scenario: PDF digitalizado sem texto extraível
- **WHEN** um PDF é baixado e processado com sucesso, mas o texto extraído é inexistente ou insuficiente
- **THEN** o documento é marcado com `extractionStatus = COMPLETED`, `needsOcr = true`, e não é tratado como erro

### Requirement: Arquivos Não-PDF São Armazenados Sem Extração
Para arquivos cujo tipo real detectado não é PDF (ex.: DOCX genuíno), o sistema SHALL armazenar o conteúdo normalmente, sem tentar extrair texto, mantendo `extractedText` nulo e registrando o tipo real detectado no documento.

#### Scenario: Anexo DOCX genuíno
- **WHEN** um anexo baixado é identificado pelos bytes mágicos como um arquivo DOCX genuíno (não um PDF renomeado)
- **THEN** ele é armazenado normalmente, com `extractionStatus = COMPLETED`, `extractedText` nulo, e o tipo real registrado no documento

### Requirement: Processamento Assíncrono em Worker Dedicado
O processamento de documentos (download e extração) SHALL ocorrer em uma fila e worker dedicados, nunca de forma síncrona dentro de uma requisição HTTP da API.

#### Scenario: Disparo via API não bloqueia a resposta
- **WHEN** um documento é marcado para processamento (automaticamente pelo scraper ou via reprocessamento manual)
- **THEN** a tarefa é enfileirada e processada de forma assíncrona por um worker separado, sem que a API aguarde a conclusão do download/extração

### Requirement: Reprocessamento Manual de Documentos com Falha
O sistema SHALL permitir disparar manualmente o reprocessamento de um documento específico, sem criar um novo registro duplicado, atualizando o mesmo documento existente.

#### Scenario: Reprocessamento de documento que falhou anteriormente
- **WHEN** o reprocessamento manual de um documento com `extractionStatus = FAILED` é solicitado
- **THEN** o mesmo registro de documento é atualizado com o resultado da nova tentativa, sem criar um registro duplicado
