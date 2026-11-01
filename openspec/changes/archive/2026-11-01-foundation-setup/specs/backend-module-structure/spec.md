## ADDED Requirements

### Requirement: Organização Modular por Domínio
O backend SHALL ser organizado em módulos NestJS independentes por domínio de negócio — `auth`, `users`, `sources`, `scrapers`, `opportunities`, `documents`, `ai-analysis`, `geolocation`, `categories`, `alerts` e `notifications` — cada um registrado no módulo raiz da aplicação, de forma que a lógica de negócio de cada domínio possa ser desenvolvida isoladamente nas próximas changes sem reorganização estrutural.

#### Scenario: Todos os módulos de domínio são registrados
- **WHEN** a aplicação NestJS é inicializada
- **THEN** todos os módulos de domínio (`auth`, `users`, `sources`, `scrapers`, `opportunities`, `documents`, `ai-analysis`, `geolocation`, `categories`, `alerts`, `notifications`) são carregados sem erros de dependência circular ou de injeção

#### Scenario: Módulo de domínio isolado
- **WHEN** um módulo de domínio é inspecionado individualmente
- **THEN** ele não contém lógica de negócio de outro domínio, apenas sua própria estrutura (`module`, `controller`, `service`) ainda que vazia ou mínima

### Requirement: Camada Compartilhada de Infraestrutura
O backend SHALL possuir uma camada `shared/` com módulos de infraestrutura reutilizáveis entre domínios — `database`, `queue`, `storage`, `logger`, `exceptions`, `config` e `validators` — de forma que módulos de domínio futuros consumam essa infraestrutura em vez de reimplementá-la.

#### Scenario: Módulo de domínio consome conexão de banco compartilhada
- **WHEN** um módulo de domínio precisa acessar o banco de dados
- **THEN** ele importa o módulo `shared/database` em vez de instanciar sua própria conexão com o Prisma Client

#### Scenario: Exceções tratadas de forma centralizada
- **WHEN** uma exceção não tratada ocorre em qualquer módulo de domínio
- **THEN** o filtro de exceções compartilhado em `shared/exceptions` captura o erro e retorna uma resposta HTTP padronizada

### Requirement: Workers como Processos Independentes
O sistema SHALL fornecer pontos de entrada separados para workers (`workers/scraper.worker.ts`, `workers/document.worker.ts`, `workers/ai-analysis.worker.ts`, `workers/geolocation.worker.ts`, `workers/notification.worker.ts`), executáveis como processos Node independentes do processo da API, reaproveitando os módulos e serviços do backend.

#### Scenario: Worker inicia sem depender do processo da API
- **WHEN** um dos arquivos de entrada de worker é executado isoladamente
- **THEN** o processo inicializa sua conexão com a fila (Redis/BullMQ) com sucesso, sem necessidade de o processo da API estar em execução

#### Scenario: Worker reaproveita módulos do backend
- **WHEN** um worker precisa acessar um serviço de domínio (ex.: para persistir dados)
- **THEN** ele obtém esse serviço a partir do contexto de aplicação Nest compartilhado, em vez de duplicar a lógica de acesso a dados

### Requirement: Conexão com Fila Configurada sem Processadores de Negócio
O backend e os workers SHALL compartilhar uma configuração única de conexão com Redis/BullMQ através do módulo `shared/queue`, sem registrar ainda nenhuma fila ou processor de negócio.

#### Scenario: Conexão com Redis estabelecida na inicialização
- **WHEN** a aplicação backend ou qualquer worker é iniciado com as variáveis de ambiente de Redis configuradas corretamente
- **THEN** a conexão com o Redis é estabelecida com sucesso durante a inicialização

#### Scenario: Nenhuma fila de negócio registrada prematuramente
- **WHEN** o módulo `shared/queue` é inspecionado nesta change
- **THEN** ele expõe apenas a configuração de conexão, sem filas ou processors de scraping, documentos, IA ou notificações ainda implementados
