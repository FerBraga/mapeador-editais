## ADDED Requirements

### Requirement: Interface Padronizada de Scraper
O sistema SHALL definir uma interface comum (`NoticeScraper`) que toda implementação de scraper de fonte deve seguir, expondo no mínimo um identificador de fonte (`sourceKey`), um método para listar oportunidades disponíveis e um método para obter os detalhes completos de uma oportunidade a partir de seu identificador externo.

#### Scenario: Nova implementação de scraper segue o contrato
- **WHEN** uma nova implementação de scraper é registrada no sistema
- **THEN** ela implementa `fetchOpportunities()` e `fetchOpportunityDetails(externalId)` conforme a interface `NoticeScraper`, sem a necessidade de alterar o código que orquestra a execução dos scrapers

### Requirement: Registro de Execução de Scraper
Toda execução de um scraper SHALL criar um registro em `ScraperExecution` com horário de início, horário de término, quantidade de itens encontrados, criados e atualizados, e, em caso de falha, a mensagem de erro correspondente.

#### Scenario: Execução concluída com sucesso
- **WHEN** uma execução de scraper processa todos os itens encontrados sem erros
- **THEN** o registro de `ScraperExecution` é marcado com status `COMPLETED`, horário de término preenchido, e as contagens de itens encontrados/criados/atualizados refletem o resultado real

#### Scenario: Falha parcial não é reportada como sucesso total
- **WHEN** uma execução de scraper processa com sucesso alguns itens mas falha ao processar outros
- **THEN** o registro de `ScraperExecution` é marcado com status `PARTIALLY_COMPLETED`, preservando a contagem de itens processados com sucesso e registrando a causa da falha nos itens que falharam

### Requirement: Execução Única por Fonte
O sistema SHALL impedir que duas execuções do scraper da mesma fonte ocorram simultaneamente.

#### Scenario: Tentativa de execução concorrente da mesma fonte
- **WHEN** uma nova execução do scraper de uma fonte é solicitada enquanto já existe uma execução `RUNNING` para essa mesma fonte
- **THEN** a nova execução é rejeitada ou colocada em espera, sem iniciar processamento concorrente sobre a mesma fonte

### Requirement: Deduplicação de Oportunidades Capturadas
O sistema SHALL identificar quando uma oportunidade capturada já existe (pela combinação de fonte e identificador externo) e, nesse caso, atualizar o registro existente em vez de criar um novo.

#### Scenario: Oportunidade já existente é atualizada, não duplicada
- **WHEN** o scraper processa uma oportunidade cujo par (`sourceId`, `externalId`) já existe no banco de dados
- **THEN** o registro existente é atualizado com os dados mais recentes, e nenhum novo registro de `Opportunity` é criado

#### Scenario: Conteúdo inalterado não gera atualização desnecessária
- **WHEN** o scraper processa uma oportunidade cujo conteúdo relevante não mudou desde a última captura (mesmo `contentHash`)
- **THEN** o registro existente não é modificado além da atualização do campo `lastScrapedAt`

### Requirement: Agendamento Diário com Execução Manual
O sistema SHALL agendar a execução de cada scraper de fonte para ocorrer automaticamente uma vez por dia via BullMQ, e também SHALL permitir disparar a execução manualmente sob demanda.

#### Scenario: Execução automática diária
- **WHEN** o horário agendado do job repetível é atingido
- **THEN** o scraper da fonte correspondente é executado automaticamente, sem intervenção manual

#### Scenario: Disparo manual de execução
- **WHEN** uma execução manual do scraper de uma fonte é solicitada
- **THEN** o scraper é executado imediatamente, respeitando a regra de execução única por fonte

### Requirement: Registro de Anexos Sem Download Imediato
Ao identificar anexos vinculados a uma oportunidade, o scraper SHALL criar os registros correspondentes em `Document` com status `PENDING` e a URL de origem preservada, sem realizar o download do conteúdo do arquivo nesta etapa.

#### Scenario: Edital com anexos identificados
- **WHEN** o scraper processa uma oportunidade que possui links para arquivos PDF/DOCX
- **THEN** um registro `Document` com `extractionStatus = PENDING` é criado para cada anexo identificado, sem que o conteúdo do arquivo seja baixado ou armazenado nesta etapa
