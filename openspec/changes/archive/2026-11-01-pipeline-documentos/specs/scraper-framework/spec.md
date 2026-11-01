## MODIFIED Requirements

### Requirement: Registro de Anexos Sem Download Imediato
Ao identificar anexos vinculados a uma oportunidade, o scraper SHALL criar os registros correspondentes em `Document` com status `PENDING` e a URL de origem preservada, sem realizar o download do conteúdo do arquivo nesta etapa. Ao criar um novo registro `Document` (não ao atualizar um já existente), o sistema SHALL enfileirar automaticamente um job de processamento assíncrono (download e extração), para que o documento não permaneça `PENDING` indefinidamente até uma ação externa.

#### Scenario: Edital com anexos identificados
- **WHEN** o scraper processa uma oportunidade que possui links para arquivos PDF/DOCX
- **THEN** um registro `Document` com `extractionStatus = PENDING` é criado para cada anexo identificado, sem que o conteúdo do arquivo seja baixado ou armazenado nesta etapa

#### Scenario: Novo documento dispara processamento automático
- **WHEN** um novo registro `Document` é criado pela primeira vez (anexo não visto em execuções anteriores)
- **THEN** um job de processamento é enfileirado na fila de documentos imediatamente após a criação do registro, sem que o scraper espere pela conclusão desse processamento

#### Scenario: Documento já existente não é reenfileirado a cada execução
- **WHEN** o scraper identifica novamente, em uma execução posterior, um anexo cuja `sourceUrl` já corresponde a um `Document` existente
- **THEN** nenhum novo job de processamento é enfileirado para esse documento já existente
