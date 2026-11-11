## ADDED Requirements

### Requirement: Contorno da Página de Aviso do Túnel Gratuito
O frontend SHALL incluir, em toda requisição feita à API, um cabeçalho que instrua o provedor de túnel gratuito a não interceptar a requisição com uma página de aviso, garantindo que a resposta recebida seja sempre o JSON esperado da API, não uma página HTML intermediária.

#### Scenario: Requisição à API através do túnel retorna JSON, não uma página de aviso
- **WHEN** o frontend publicado faz uma requisição a qualquer endpoint da API através do túnel público
- **THEN** a resposta recebida é processável como JSON pela função de requisição central do cliente HTTP, sem falha de interpretação por conteúdo HTML inesperado

### Requirement: URL Pública do Backend Estável Entre Reinícios
O processo de expor o backend publicamente SHALL usar um domínio fixo reservado para a conta de túnel, de forma que a URL pública não mude a cada reinício do túnel, evitando a necessidade de reconfigurar o frontend publicado a cada vez que o backend local é reiniciado.

#### Scenario: Reinício do túnel preserva a mesma URL pública
- **WHEN** o túnel que expõe o backend é reiniciado (ex.: após reiniciar a máquina local)
- **THEN** a URL pública resultante é a mesma configurada previamente no frontend publicado, sem exigir atualização da variável de ambiente de produção

### Requirement: Inicialização Simplificada do Backend Completo
O sistema SHALL fornecer um único comando que inicializa, na ordem correta, toda a stack necessária para o backend ficar publicamente acessível: banco de dados e fila (via Docker Compose), a API, os workers de processamento assíncrono, e o túnel de exposição pública.

#### Scenario: Comando único sobe a stack completa na ordem correta
- **WHEN** o comando de inicialização é executado em uma máquina com Docker e as dependências já instaladas
- **THEN** o banco de dados e o Redis sobem e ficam saudáveis antes da API e dos workers serem iniciados, e o túnel só é iniciado depois que a API está pronta para receber requisições

### Requirement: Múltiplas Origens de CORS para Ambiente de Produção
O backend SHALL continuar aceitando uma lista de origens de CORS configurável por ambiente, permitindo que o domínio de produção do frontend publicado seja adicionado sem alteração de código.

#### Scenario: Domínio de produção do frontend é aceito pelo CORS
- **WHEN** uma requisição chega à API com origem igual a um domínio incluído na configuração de origens permitidas em produção
- **THEN** a requisição é aceita normalmente pelas regras de CORS, sem exigir alteração de código para cada novo domínio adicionado
