## ADDED Requirements

### Requirement: Descoberta de Chamadas Públicas na Listagem Única
O scraper da fonte Fundação Araucária SHALL descobrir as chamadas públicas a partir da listagem única em `https://www.fappr.pr.gov.br/Programas-Abertos`, sem depender de autenticação, paginação ou páginas de detalhe próprias por item.

#### Scenario: Listagem com múltiplas chamadas
- **WHEN** o scraper acessa a página `/Programas-Abertos`
- **THEN** ele identifica cada chamada pública listada, extraindo código de identificação, texto descritivo, datas de inscrição informadas e links de anexos, sem necessidade de login

### Requirement: Filtragem de Chamadas com Inscrição Vencida
O scraper SHALL descartar da lista de oportunidades retornadas as chamadas cuja data final de inscrição, quando identificável no texto, já tenha passado em relação à data da execução.

#### Scenario: Chamada com data de inscrição no passado
- **WHEN** uma chamada da listagem tem data final de inscrição anterior à data atual
- **THEN** ela não é incluída no resultado de `fetchOpportunities()`

#### Scenario: Chamada sem data de inscrição identificável
- **WHEN** uma chamada não possui uma data final de inscrição reconhecível no texto (ex.: "fluxo contínuo")
- **THEN** ela é considerada aberta por padrão e incluída no resultado

### Requirement: Identificador Externo Derivado do Código da Chamada
O scraper SHALL derivar o `externalId` de cada chamada a partir do código de identificação textual presente na listagem (ex.: "CP 20/26"), normalizado de forma consistente entre execuções, já que o site não oferece URLs de detalhe por chamada.

#### Scenario: Mesmo código em execuções sucessivas
- **WHEN** a mesma chamada aparece em duas execuções consecutivas do scraper
- **THEN** o `externalId` derivado é idêntico nas duas execuções, permitindo deduplicação correta

### Requirement: Detalhe Obtido a partir da Própria Listagem
O método `fetchOpportunityDetails(externalId)` SHALL retornar os dados já capturados durante a leitura da listagem, sem realizar uma segunda requisição HTTP ao site, já que não existe página de detalhe própria por chamada.

#### Scenario: Obtenção de detalhes após a listagem
- **WHEN** `fetchOpportunityDetails` é chamado com o `externalId` de uma chamada previamente listada
- **THEN** os dados retornados (título, anexos, texto) correspondem exatamente ao que foi extraído da listagem, sem nova chamada de rede
