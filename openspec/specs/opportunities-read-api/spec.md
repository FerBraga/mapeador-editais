## Purpose

API HTTP de leitura/busca de oportunidades, categorias, fontes e municípios do Paraná, com paginação, filtros geográficos (incluindo abrangência estadual), financeiros, de disponibilidade best-effort e busca textual — consumida pelo frontend do mapa de descoberta de editais.

## Requirements

### Requirement: Listagem Paginada de Oportunidades
O sistema SHALL expor um endpoint HTTP que retorna uma página de oportunidades, com metadados de paginação (página atual, tamanho de página, total de registros).

#### Scenario: Listagem padrão sem filtros
- **WHEN** o endpoint de listagem é chamado sem nenhum filtro
- **THEN** a primeira página de oportunidades é retornada, ordenada por data de encerramento de inscrição (as sem data definida aparecem por último), junto com o total de registros disponíveis

#### Scenario: Parâmetros de paginação inválidos são rejeitados
- **WHEN** o endpoint de listagem é chamado com um tamanho de página fora do limite permitido
- **THEN** a requisição é rejeitada com um erro de validação claro, antes de qualquer consulta ao banco

### Requirement: Filtro Geográfico Considera Abrangência Estadual
Ao filtrar oportunidades por município, o sistema SHALL incluir tanto as oportunidades explicitamente vinculadas a esse município quanto as marcadas como abrangendo todo o estado.

#### Scenario: Município específico retorna também editais estaduais
- **WHEN** a listagem é filtrada por um município específico
- **THEN** o resultado inclui oportunidades vinculadas diretamente a esse município e também oportunidades marcadas com `coversEntireState = true`, mesmo sem vínculo direto

### Requirement: Filtro de Disponibilidade Best-Effort
O sistema SHALL permitir filtrar oportunidades por um critério de disponibilidade computado a partir das datas de inscrição, sem depender exclusivamente do campo de status armazenado.

#### Scenario: Filtro de disponibilidade inclui oportunidades sem status definido
- **WHEN** o filtro de disponibilidade é aplicado
- **THEN** oportunidades cujo status armazenado é desconhecido mas cuja data de encerramento de inscrição não passou (ou não está definida) são incluídas no resultado

#### Scenario: Filtro de disponibilidade exclui oportunidades com status terminal
- **WHEN** o filtro de disponibilidade é aplicado
- **THEN** oportunidades com status armazenado indicando encerramento, cancelamento ou suspensão são excluídas do resultado, independentemente das datas

### Requirement: Filtro por Faixa de Valores
O sistema SHALL permitir filtrar oportunidades por faixa de valor de financiamento, considerando sobreposição de faixas e excluindo oportunidades sem valor conhecido quando o filtro é aplicado.

#### Scenario: Oportunidade sem valor conhecido é excluída ao filtrar por valor
- **WHEN** um filtro de valor mínimo ou máximo é aplicado
- **THEN** oportunidades cujo campo de valor correspondente é desconhecido não aparecem no resultado

### Requirement: Busca Textual Livre
O sistema SHALL permitir buscar oportunidades por um termo livre, correspondendo de forma case-insensitive ao título, descrição ou objeto da oportunidade.

#### Scenario: Busca por termo presente no título
- **WHEN** um termo de busca livre corresponde a parte do título de uma oportunidade, independentemente de caixa
- **THEN** essa oportunidade aparece no resultado

### Requirement: Detalhe Completo de Oportunidade
O sistema SHALL expor um endpoint HTTP que retorna o detalhe completo de uma oportunidade, incluindo categoria, fonte, municípios vinculados com coordenadas, indicação de abrangência estadual, lista de documentos exigidos, e o resultado da análise de IA mais recente concluída.

#### Scenario: Detalhe inclui municípios vinculados com coordenadas
- **WHEN** o detalhe de uma oportunidade vinculada a um ou mais municípios é solicitado
- **THEN** a resposta inclui esses municípios com suas coordenadas geográficas

#### Scenario: Detalhe sem análise de IA concluída retorna análise nula
- **WHEN** o detalhe de uma oportunidade sem nenhuma `AIAnalysis` com status concluído é solicitado
- **THEN** a resposta indica a ausência de análise, sem erro

#### Scenario: Detalhe usa a análise de IA mais recente concluída
- **WHEN** uma oportunidade possui múltiplas análises de IA concluídas em momentos diferentes
- **THEN** o detalhe retorna os dados da análise mais recente, ignorando as anteriores e qualquer análise com falha

#### Scenario: Oportunidade inexistente retorna erro claro
- **WHEN** o detalhe de uma oportunidade com identificador inexistente é solicitado
- **THEN** a resposta indica que o recurso não foi encontrado

### Requirement: Listagem de Categorias e Fontes
O sistema SHALL expor endpoints HTTP que retornam as categorias e fontes ativas cadastradas, para uso em filtros da interface.

#### Scenario: Listagem de categorias retorna apenas ativas por padrão
- **WHEN** o endpoint de listagem de categorias é chamado sem parâmetros adicionais
- **THEN** apenas categorias marcadas como ativas são retornadas

### Requirement: Listagem de Municípios com Indicador de Volume
O sistema SHALL expor um endpoint HTTP que retorna todos os municípios do Paraná com suas coordenadas geográficas e a quantidade de oportunidades atualmente vinculadas a cada um.

#### Scenario: Município sem oportunidades vinculadas aparece com contagem zero
- **WHEN** a listagem de municípios é solicitada
- **THEN** municípios sem nenhuma oportunidade vinculada aparecem no resultado com contagem igual a zero, não são omitidos
