## ADDED Requirements

### Requirement: Consumo da API Pública de Consulta do PNCP
O sistema SHALL obter dados de licitações/compras públicas do estado do Paraná consumindo a API pública de consulta do PNCP (`GET https://pncp.gov.br/api/consulta/v1/contratacoes/publicacao`), filtrada por `uf=PR`, em vez de realizar scraping do sistema estadual GMS (inviável por exigir captcha) ou do Portal da Transparência do Paraná (bloqueado por `robots.txt` no caminho relevante).

#### Scenario: Consulta filtrada por Paraná
- **WHEN** a fonte PNCP/PR é executada
- **THEN** todas as requisições à API do PNCP incluem o parâmetro `uf=PR`, e nenhuma requisição é feita ao domínio `gms.pr.gov.br` ou ao caminho `/pte` de `transparencia.pr.gov.br`

### Requirement: Restrição a Órgãos Estaduais
Como o parâmetro `uf=PR` da API retorna licitações de todos os entes do estado (governo estadual e os 399 municípios), o scraper SHALL descartar, após a paginação, os registros cujo órgão não seja de esfera estadual (`orgaoEntidade.esferaId` diferente de `"E"`), mantendo o escopo equivalente ao do sistema GMS original (licitações do governo do estado do Paraná).

#### Scenario: Registro de órgão municipal é descartado
- **WHEN** a API retorna um registro cujo `orgaoEntidade.esferaId` é `"M"` (municipal)
- **THEN** esse registro não é incluído no resultado de `fetchOpportunities()`

#### Scenario: Registro de órgão estadual é mantido
- **WHEN** a API retorna um registro cujo `orgaoEntidade.esferaId` é `"E"` (estadual)
- **THEN** esse registro é incluído no resultado de `fetchOpportunities()`

### Requirement: Cobertura das Modalidades de Contratação Conhecidas
Como o parâmetro `codigoModalidadeContratacao` é obrigatório na API do PNCP e não aceita um valor "todos", o scraper SHALL iterar sobre uma tabela conhecida de códigos de modalidade de contratação para cobrir as licitações relevantes em cada execução.

#### Scenario: Execução cobre múltiplas modalidades
- **WHEN** a fonte PNCP/PR é executada
- **THEN** são feitas requisições separadas para cada código de modalidade da tabela conhecida, e os resultados de todas as modalidades são combinados no retorno de `fetchOpportunities()`

### Requirement: Paginação Completa dos Resultados
O scraper SHALL paginar as requisições à API do PNCP até obter todos os registros disponíveis para o período e modalidade consultados, respeitando o tamanho máximo de página documentado pela API.

#### Scenario: Resultado com múltiplas páginas
- **WHEN** uma consulta a uma modalidade retorna mais registros do que cabem em uma página
- **THEN** o scraper continua requisitando as páginas subsequentes até esgotar o total de registros, sem perder nem duplicar itens

#### Scenario: Modalidade sem nenhum resultado no período
- **WHEN** a API responde com HTTP 204 e corpo vazio para uma combinação de modalidade/período sem resultados
- **THEN** o scraper trata isso como uma lista vazia para aquela modalidade, sem lançar erro de parsing e sem interromper a verificação das demais modalidades

### Requirement: Identificador Externo Estável via Número de Controle PNCP
O scraper SHALL utilizar o campo `numeroControlePNCP`, retornado pela API, como `externalId` de cada oportunidade, garantindo estabilidade de identificação entre execuções sem depender de URLs derivadas.

#### Scenario: Mesma contratação em execuções sucessivas
- **WHEN** a mesma contratação é retornada pela API em duas execuções consecutivas
- **THEN** o `externalId` (`numeroControlePNCP`) é idêntico nas duas execuções, permitindo deduplicação correta

### Requirement: Ausência de Anexos Não Bloqueia a Captura
Como a API de consulta utilizada não expõe uma lista de documentos/anexos da contratação, o scraper SHALL registrar a oportunidade normalmente, sem anexos, preservando o campo `linkProcessoEletronico` (quando presente) nos dados brutos para referência futura.

#### Scenario: Contratação sem anexos disponíveis via API
- **WHEN** uma contratação retornada pela API não possui informação de documentos associados
- **THEN** a oportunidade é criada normalmente, sem registros `Document` associados, sem que isso seja tratado como falha de extração

### Requirement: Testes Independentes de Rede
A suíte de testes automatizados da fonte PNCP/PR SHALL utilizar respostas de API simuladas (fixtures JSON), sem realizar requisições reais a `pncp.gov.br` durante a execução dos testes.

#### Scenario: Execução da suíte de testes
- **WHEN** a suíte de testes da fonte PNCP/PR é executada
- **THEN** nenhuma requisição de rede é feita ao domínio `pncp.gov.br`, e os casos de teste utilizam respostas JSON de fixture armazenadas no repositório
