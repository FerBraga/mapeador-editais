## ADDED Requirements

### Requirement: Resolução Determinística de Município
O sistema SHALL resolver nomes de município extraídos pela IA contra o gazetteer real de municípios do Paraná usando lógica de correspondência de texto própria (normalização e similaridade), sem depender de julgamento da IA sobre qual município corresponde a cada nome.

#### Scenario: Nome de município com grafia correta é resolvido
- **WHEN** um nome de município extraído corresponde exatamente (após normalização de caixa e acentuação) a um município cadastrado
- **THEN** a oportunidade é vinculada a esse município via `OpportunityMunicipality`

#### Scenario: Nome de município com pequena variação de acentuação é resolvido
- **WHEN** um nome de município extraído difere de um município cadastrado apenas pela ausência de acentos
- **THEN** a oportunidade ainda é vinculada corretamente a esse município

### Requirement: Detecção de Abrangência Estadual Antes do Casamento Individual
O sistema SHALL verificar se um nome extraído corresponde a uma menção de abrangência estadual (lista curada de frases normalizadas) antes de tentar casar esse nome contra um município individual, marcando `Opportunity.coversEntireState` quando aplicável.

#### Scenario: Menção ao estado não é tratada como município específico
- **WHEN** um nome extraído corresponde a uma referência ao estado do Paraná como um todo (ex.: "Paraná", "Estado do Paraná")
- **THEN** a oportunidade é marcada com `coversEntireState = true`, e nenhuma tentativa de casamento contra um município específico é feita para esse nome

### Requirement: Limiar Mínimo de Confiança para Correspondência Aproximada
Quando não houver correspondência exata, o sistema SHALL usar similaridade de texto para encontrar o município mais provável, mas SHALL aceitar o resultado apenas quando a similaridade atingir um limiar mínimo configurado, rejeitando correspondências de baixa confiança.

#### Scenario: Correspondência aproximada válida é aceita
- **WHEN** um nome extraído tem uma pequena variação (ex.: typo) em relação a um município real, e a similaridade calculada atinge o limiar mínimo
- **THEN** a oportunidade é vinculada a esse município

#### Scenario: Correspondência de baixa confiança é rejeitada
- **WHEN** a maior similaridade encontrada para um nome extraído está abaixo do limiar mínimo configurado
- **THEN** nenhum município é vinculado para esse nome, e a ausência de correspondência é registrada como aviso, sem interromper a resolução dos demais nomes

### Requirement: Resolução a Partir de Todas as Análises Completas da Oportunidade
Ao resolver a geografia de uma `Opportunity`, o sistema SHALL considerar os municípios mencionados em todas as `AIAnalysis` com `status = COMPLETED` daquela oportunidade, não apenas a análise que disparou a resolução.

#### Scenario: Municípios de análises anteriores são preservados na resolução
- **WHEN** uma oportunidade possui duas `AIAnalysis` `COMPLETED`, cada uma mencionando municípios diferentes, e uma nova resolução é disparada
- **THEN** o resultado da resolução inclui os municípios mencionados em ambas as análises

### Requirement: Substituição Completa do Resultado a Cada Resolução
O sistema SHALL substituir completamente o conjunto de `OpportunityMunicipality` de uma oportunidade a cada execução da resolução geográfica, recalculando o resultado a partir do zero, em vez de acumular incrementalmente.

#### Scenario: Resolução repetida não duplica vínculos
- **WHEN** a resolução geográfica de uma oportunidade é executada mais de uma vez com os mesmos dados de entrada
- **THEN** o conjunto final de `OpportunityMunicipality` para essa oportunidade permanece o mesmo, sem registros duplicados

### Requirement: Disparo Automático Pós-Análise de IA
O sistema SHALL enfileirar automaticamente a resolução geográfica de uma `Opportunity` sempre que uma `AIAnalysis` para essa oportunidade for persistida com `status = COMPLETED`, processando de forma assíncrona em fila e worker dedicados.

#### Scenario: Análise de IA concluída dispara resolução geográfica
- **WHEN** uma `AIAnalysis` é persistida com `status = COMPLETED`
- **THEN** um job de resolução geográfica para a `Opportunity` correspondente é enfileirado automaticamente, sem bloquear o processamento da análise de IA

### Requirement: Reprocessamento Manual da Resolução Geográfica
O sistema SHALL permitir disparar manualmente a resolução geográfica de uma oportunidade específica via um endpoint HTTP, processando de forma assíncrona sem bloquear a requisição.

#### Scenario: Reprocessamento manual não bloqueia a requisição
- **WHEN** o endpoint de reprocessamento geográfico é chamado para uma oportunidade existente
- **THEN** a requisição retorna imediatamente e a resolução é processada de forma assíncrona por um worker separado
