## Purpose

Estrutura de monorepo, configuração de ambiente, tooling e scripts de desenvolvimento para o backend (NestJS) e o frontend (React/Vite) do MVP Mapa Inteligente de Editais do Paraná.

## Requirements

### Requirement: Monorepo Structure
O sistema SHALL ser organizado como um monorepo com dois workspaces principais, `backend` e `frontend`, cada um com seu próprio `package.json`, de forma que possam ser instalados, construídos e executados de forma independente.

#### Scenario: Instalação das dependências
- **WHEN** o desenvolvedor executa a instalação de dependências na raiz do repositório
- **THEN** as dependências de `backend` e `frontend` são instaladas corretamente, cada workspace com seu próprio conjunto de pacotes

#### Scenario: Build independente de cada workspace
- **WHEN** o desenvolvedor executa o comando de build do workspace `backend`
- **THEN** o build conclui sem erros, sem exigir que o workspace `frontend` esteja presente ou buildado

### Requirement: Backend Stack Base
O backend SHALL ser inicializado com NestJS e TypeScript, expondo documentação OpenAPI/Swagger e um endpoint de health-check, de forma que a aplicação possa ser iniciada e verificada antes de qualquer lógica de negócio existir.

#### Scenario: Aplicação backend inicia com sucesso
- **WHEN** o comando de start do backend é executado em ambiente de desenvolvimento
- **THEN** o processo inicia sem erros e passa a escutar na porta configurada

#### Scenario: Health-check disponível
- **WHEN** uma requisição HTTP GET é feita para `/api/v1/health`
- **THEN** a resposta retorna status HTTP 200 confirmando que a aplicação e a conexão com o banco de dados estão operacionais

#### Scenario: Documentação Swagger disponível
- **WHEN** o navegador acessa a rota de documentação da API (`/docs` ou equivalente)
- **THEN** a interface Swagger/OpenAPI é exibida listando os endpoints registrados

### Requirement: Frontend Stack Base
O frontend SHALL ser inicializado com React, TypeScript e Vite, incluindo Tailwind CSS, shadcn/ui, React Router e TanStack Query configurados, exibindo uma página inicial mínima que confirma que a aplicação builda e roda.

#### Scenario: Frontend builda para produção
- **WHEN** o comando de build do frontend é executado
- **THEN** o build conclui sem erros e gera os artefatos estáticos de produção

#### Scenario: Frontend roda em modo de desenvolvimento
- **WHEN** o servidor de desenvolvimento do Vite é iniciado
- **THEN** a página inicial é servida e renderiza sem erros no navegador

### Requirement: Ambiente de Desenvolvimento via Docker Compose
O sistema SHALL fornecer um `docker-compose` (ou script equivalente) que inicializa PostgreSQL com a extensão PostGIS habilitada e uma instância Redis, para uso em ambiente de desenvolvimento local.

#### Scenario: Subida do ambiente de desenvolvimento
- **WHEN** o desenvolvedor executa o comando de subida dos serviços de infraestrutura
- **THEN** um container PostgreSQL com PostGIS habilitado e um container Redis ficam acessíveis nas portas configuradas

#### Scenario: Extensão PostGIS habilitada
- **WHEN** uma conexão é feita ao banco PostgreSQL provisionado
- **THEN** a extensão `postgis` está instalada e disponível para uso em queries geográficas

### Requirement: Configuração via Variáveis de Ambiente
O backend SHALL carregar sua configuração (conexão com banco de dados, Redis, portas, chaves de serviços externos) a partir de variáveis de ambiente, validadas na inicialização da aplicação.

#### Scenario: Variável de ambiente obrigatória ausente
- **WHEN** a aplicação backend é iniciada sem uma variável de ambiente obrigatória definida
- **THEN** a inicialização falha com uma mensagem de erro indicando qual variável está ausente, em vez de falhar silenciosamente ou mais adiante em tempo de execução

### Requirement: Validação Global de Entradas
O backend SHALL aplicar um `ValidationPipe` global que rejeita automaticamente requisições cujo corpo não corresponda ao DTO esperado, removendo (whitelist) propriedades não declaradas, desde a fundação do projeto — não apenas quando endpoints de negócio forem implementados.

#### Scenario: Payload com campo não declarado
- **WHEN** uma requisição HTTP envia um campo que não existe no DTO do endpoint
- **THEN** a aplicação rejeita a requisição com erro de validação, sem repassar o campo extra para a camada de negócio

### Requirement: Hardening HTTP Básico
O backend SHALL restringir CORS às origens configuradas via variável de ambiente e aplicar cabeçalhos de segurança HTTP básicos, desde a inicialização da aplicação.

#### Scenario: Origem não autorizada
- **WHEN** uma requisição cross-origin é feita a partir de uma origem que não está na lista de origens permitidas
- **THEN** a resposta não inclui os cabeçalhos CORS necessários para que o navegador aceite a resposta
