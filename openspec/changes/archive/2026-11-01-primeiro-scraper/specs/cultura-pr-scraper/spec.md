## ADDED Requirements

### Requirement: Descoberta de Editais Abertos da Fonte Cultura SEEC-PR
O scraper da fonte Cultura SEEC-PR SHALL descobrir os editais atualmente abertos a partir do submenu "Editais e Licitações > Editais Abertos" presente no HTML das páginas de `www.cultura.pr.gov.br`, sem depender de autenticação ou de uma listagem paginada central.

#### Scenario: Submenu com editais abertos
- **WHEN** o scraper acessa uma página do site `www.cultura.pr.gov.br`
- **THEN** ele extrai do submenu "Editais Abertos" a lista de URLs de editais atualmente abertos, sem necessidade de login

#### Scenario: Nenhum edital aberto no momento
- **WHEN** o submenu "Editais Abertos" não lista nenhum item
- **THEN** a execução do scraper é concluída com sucesso, registrando zero itens encontrados, sem erro

### Requirement: Extração de Dados do Edital a partir da Página de Detalhe
Para cada edital descoberto, o scraper SHALL acessar sua página de detalhe (`/Pagina/<slug>`) e extrair, no mínimo, título, URL oficial e identificador externo derivado do slug da URL.

#### Scenario: Extração bem-sucedida dos campos mínimos
- **WHEN** o scraper acessa a página de detalhe de um edital aberto
- **THEN** título, URL oficial (`officialUrl`) e identificador externo (`externalId`) são extraídos e persistidos na oportunidade correspondente

#### Scenario: Página de detalhe com estrutura inesperada
- **WHEN** a página de detalhe de um edital não contém os elementos HTML esperados pelo scraper
- **THEN** a falha é registrada para aquele item específico, com indicação do que não pôde ser extraído, sem interromper o processamento dos demais editais da execução

### Requirement: Identificação de Anexos em PDF/DOCX
O scraper SHALL identificar todos os links para arquivos PDF ou DOCX presentes na página de detalhe de um edital como anexos daquela oportunidade.

#### Scenario: Página com múltiplos anexos
- **WHEN** a página de detalhe de um edital contém múltiplos links para arquivos PDF e/ou DOCX (edital principal, anexos, avisos de publicação)
- **THEN** cada um desses links é identificado e registrado como um anexo distinto associado à oportunidade

### Requirement: Fonte Cadastrada com Dados Atualizados
O registro `Source` da fonte Cultura SEEC-PR SHALL utilizar `https://www.cultura.pr.gov.br` como `baseUrl`, refletindo que o subdomínio originalmente previsto (`sic.cultura.pr.gov.br`) não está mais acessível, e `sourceType = CULTURE`.

#### Scenario: Consulta ao cadastro da fonte
- **WHEN** o registro `Source` da fonte Cultura SEEC-PR é consultado
- **THEN** seu `baseUrl` corresponde a um domínio que resolve e responde com sucesso (`https://www.cultura.pr.gov.br`), não ao domínio legado inacessível

### Requirement: Respeito a Limites de Acesso ao Portal Externo
O scraper SHALL aplicar um intervalo mínimo entre requisições consecutivas ao portal e identificar-se com um `User-Agent` próprio, evitando sobrecarregar ou ser indistinguível de tráfego malicioso no site de terceiros.

#### Scenario: Múltiplas requisições em uma mesma execução
- **WHEN** o scraper precisa acessar múltiplas páginas de detalhe na mesma execução
- **THEN** as requisições são espaçadas por um intervalo mínimo configurado, em vez de serem disparadas todas simultaneamente

### Requirement: Testes Independentes de Rede
A suíte de testes automatizados do scraper da fonte Cultura SEEC-PR SHALL utilizar fixtures HTML locais, sem realizar requisições reais a `www.cultura.pr.gov.br` durante a execução dos testes.

#### Scenario: Execução da suíte de testes
- **WHEN** a suíte de testes do scraper é executada
- **THEN** nenhuma requisição de rede é feita ao domínio `cultura.pr.gov.br`, e os casos de teste utilizam HTML de fixture armazenado no repositório
