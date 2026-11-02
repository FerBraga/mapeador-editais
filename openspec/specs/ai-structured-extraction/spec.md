## Purpose

Extração estruturada de dados de editais via IA a partir do texto de um `Document`, com abstração de provedor trocável, prompt versionado, defesa contra conteúdo instrutivo no documento, persistência auditável em `AIAnalysis`/`RequiredDocument`, preenchimento condicional de `Opportunity` (nunca sobrescrevendo dado oficial), e disparo manual via fila dedicada.

## Requirements

### Requirement: Abstração de Provedor de IA
O sistema SHALL definir uma interface comum (`AiProvider`) para extração estruturada de dados, de forma que o provedor de IA configurado (ex.: Gemini, OpenAI) possa ser substituído por configuração, sem alterar as regras de negócio que consomem o resultado da extração.

#### Scenario: Troca de provedor sem alterar regra de negócio
- **WHEN** a configuração de provedor (`AI_PROVIDER`) é alterada de um provedor para outro
- **THEN** o serviço de análise continua funcionando sem necessidade de alterar o código que processa, valida ou persiste o resultado da extração

### Requirement: Extração Estruturada de Dados do Edital
O sistema SHALL extrair, a partir do `extractedText` de um `Document`, um conjunto estruturado de dados do edital: título, órgão responsável, objeto, resumo, público-alvo, municípios contemplados (como texto bruto), faixa de valores (mínimo/máximo), datas de inscrição, critérios de elegibilidade, restrições, etapas de inscrição, lista de documentos exigidos e ambiguidades detectadas.

#### Scenario: Extração de edital real com dados completos
- **WHEN** a análise de IA é disparada para um `Document` cujo `extractedText` contém um edital com valores, datas e critérios de elegibilidade claramente descritos
- **THEN** o resultado estruturado contém esses campos preenchidos corretamente, sem valores inventados

#### Scenario: Campo ausente no texto retorna nulo, não inventado
- **WHEN** o texto do documento não contém informação suficiente para preencher um campo (ex.: datas de inscrição não mencionadas)
- **THEN** o campo correspondente é retornado como `null` (ou lista vazia, conforme o tipo), nunca com um valor inferido especulativamente

#### Scenario: Ambiguidade identificada é sinalizada
- **WHEN** o texto do documento contém informação conflitante ou pouco clara sobre algum aspecto do edital
- **THEN** essa ambiguidade é registrada no campo `ambiguidadesDetectadas` do resultado estruturado

### Requirement: Validação do Resultado Antes da Persistência
O sistema SHALL validar a resposta do provedor de IA contra um schema definido antes de persistir qualquer dado, rejeitando e registrando como falha qualquer resposta que não esteja em conformidade, sem persistir resultado parcial ou inválido como se fosse válido.

#### Scenario: Resposta do provedor não segue o schema esperado
- **WHEN** o provedor de IA retorna uma resposta que falha na validação contra o schema esperado
- **THEN** nenhum registro de `AIAnalysis` ou `RequiredDocument` é criado a partir dessa resposta, e a falha é registrada de forma explícita

### Requirement: Checklist de Documentos Exigidos com Evidência
Para cada documento exigido identificado no texto do edital, o sistema SHALL criar um registro em `RequiredDocument` contendo nome, categoria, indicação de obrigatoriedade, e o trecho original do texto (`evidence`) que fundamenta a exigência, preservando rastreabilidade.

#### Scenario: Documento exigido identificado com evidência textual
- **WHEN** o texto do edital descreve uma exigência documental (ex.: "anexar certidão negativa de débitos")
- **THEN** um registro `RequiredDocument` é criado com o nome da exigência, a categoria mais adequada, se é obrigatória ou recomendada, e o trecho original do texto que a fundamenta

#### Scenario: Distinção entre exigência obrigatória e recomendada
- **WHEN** o texto do edital indica claramente que um documento é facultativo ou recomendado, e não obrigatório
- **THEN** o registro `RequiredDocument` correspondente é marcado como não obrigatório

### Requirement: Defesa Contra Conteúdo Instrutivo no Documento
O sistema SHALL tratar o texto extraído do documento exclusivamente como dado a ser analisado, nunca como instrução, mesmo que o conteúdo do documento contenha trechos formatados como comandos ou tentativas de alterar o comportamento do provedor de IA.

#### Scenario: Documento contém trecho que se assemelha a uma instrução
- **WHEN** o texto extraído de um documento contém um trecho que se assemelha a uma instrução direcionada ao sistema de IA (ex.: pedindo para ignorar regras ou alterar o formato de resposta)
- **THEN** esse trecho é tratado apenas como conteúdo do documento a ser analisado, e a extração estruturada segue o schema e as regras definidas, sem alteração de comportamento

### Requirement: Preenchimento Condicional de Dados da Oportunidade
Ao persistir uma análise de IA, o sistema SHALL atualizar os campos de descrição, faixa de valores e datas de inscrição da `Opportunity` correspondente apenas quando esses campos estiverem atualmente nulos, nunca sobrescrevendo um valor já existente, seja ele proveniente do scraper oficial ou de uma análise de IA anterior.

#### Scenario: Campo vazio é preenchido pela análise de IA
- **WHEN** uma `Opportunity` possui o campo `description` nulo e uma análise de IA extrai um objeto/resumo para o edital correspondente
- **THEN** o campo `description` da `Opportunity` é preenchido com o dado extraído

#### Scenario: Campo já preenchido não é sobrescrito
- **WHEN** uma `Opportunity` já possui um valor não nulo em `fundingMin` ou `fundingMax`
- **THEN** uma nova análise de IA para essa oportunidade não altera esses campos, independentemente do valor que a IA tenha extraído

### Requirement: Registro Completo e Auditável da Análise
Toda chamada de extração estruturada bem-sucedida SHALL gerar um registro em `AIAnalysis` contendo o resultado estruturado completo, o modelo utilizado, a versão do prompt, e a contagem de tokens de entrada e saída reportada pelo provedor.

#### Scenario: Análise bem-sucedida gera registro completo
- **WHEN** uma extração estruturada é concluída com sucesso
- **THEN** um registro `AIAnalysis` é criado com o resultado estruturado, o identificador do modelo usado, a versão do prompt aplicada, e os tokens de entrada/saída informados pela chamada ao provedor

### Requirement: Histórico de Análises Preservado
O sistema SHALL preservar o histórico de todas as análises realizadas para um mesmo documento ou oportunidade, sem sobrescrever ou deduplicar registros anteriores de `AIAnalysis`.

#### Scenario: Reprocessamento manual de um documento já analisado
- **WHEN** a análise de um `Document` que já possui uma `AIAnalysis` anterior é disparada novamente manualmente
- **THEN** um novo registro `AIAnalysis` é criado, preservando o registro da análise anterior sem alteração

### Requirement: Disparo Manual via Fila Dedicada
O sistema SHALL permitir disparar manualmente a análise de IA de um `Document` específico via um endpoint HTTP, processando a extração de forma assíncrona em uma fila e worker dedicados, sem bloquear a requisição HTTP nem exigir disparo automático a cada novo documento.

#### Scenario: Disparo manual não bloqueia a requisição
- **WHEN** o endpoint de análise manual é chamado para um `Document` com texto extraído disponível
- **THEN** a requisição retorna imediatamente (202 Accepted) e a extração é processada de forma assíncrona por um worker separado

#### Scenario: Documento sem texto extraível não pode ser analisado
- **WHEN** o endpoint de análise manual é chamado para um `Document` cujo `extractedText` é nulo (ex.: `needsOcr = true` ou arquivo não-PDF)
- **THEN** a requisição é rejeitada com um erro indicando que não há texto extraído disponível para análise

### Requirement: Limite Configurável de Tamanho de Entrada
O sistema SHALL truncar o texto enviado ao provedor de IA em um limite configurável de caracteres, de forma a controlar o custo e respeitar limites de contexto do modelo utilizado.

#### Scenario: Texto do documento excede o limite configurado
- **WHEN** o `extractedText` de um documento excede o limite configurado de caracteres de entrada
- **THEN** apenas a porção até o limite configurado é enviada ao provedor de IA, e a análise prossegue normalmente com esse texto truncado
