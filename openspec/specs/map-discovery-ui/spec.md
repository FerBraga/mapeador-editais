## Purpose

Interface web de descoberta geográfica de editais — mapa interativo com marcadores por município, filtros sincronizados com a URL, listagem paginada e página de detalhe com transparência sobre conteúdo gerado por IA — consumindo a API de leitura/busca já existente.

## Requirements

### Requirement: Mapa Interativo de Municípios
O sistema SHALL exibir um mapa do Paraná com um marcador por município, cujo tamanho reflete a quantidade de oportunidades vinculadas a esse município.

#### Scenario: Município com mais oportunidades tem marcador maior
- **WHEN** o mapa é renderizado com a lista de municípios e suas contagens de oportunidades
- **THEN** municípios com contagem maior são exibidos com marcadores visivelmente maiores que municípios com contagem menor ou igual a zero

#### Scenario: Clique em um município filtra a lista de oportunidades
- **WHEN** o usuário clica no marcador de um município
- **THEN** a lista de oportunidades é atualizada para refletir esse município como filtro, incluindo oportunidades vinculadas diretamente e oportunidades de abrangência estadual

### Requirement: Filtros Sincronizados com a URL
O sistema SHALL refletir o estado de todos os filtros de busca (município, categoria, fonte, disponibilidade, faixa de valores, texto livre, página) nos parâmetros da URL, de forma que a busca seja compartilhável e navegável pelo histórico do navegador.

#### Scenario: URL compartilhada reproduz a mesma busca
- **WHEN** uma URL contendo parâmetros de filtro é aberta diretamente
- **THEN** a interface aplica esses filtros automaticamente, sem exigir que o usuário os reconfigure manualmente

#### Scenario: Navegação pelo histórico do navegador preserva filtros anteriores
- **WHEN** o usuário altera um filtro e depois usa o botão "voltar" do navegador
- **THEN** a interface retorna ao estado de filtros anterior

### Requirement: Listagem Paginada de Oportunidades na Interface
O sistema SHALL exibir a lista de oportunidades retornada pela API em cards, com controles de paginação (página anterior/próxima e indicação da página atual e total).

#### Scenario: Navegação entre páginas atualiza a lista e a URL
- **WHEN** o usuário avança para a próxima página da listagem
- **THEN** uma nova busca é feita com a página seguinte, a lista é atualizada, e o parâmetro de página na URL reflete essa mudança

### Requirement: Estados de Carregamento, Erro e Vazio
Toda tela que depende de dados buscados da API SHALL exibir um estado visual distinto durante o carregamento, em caso de erro de comunicação com a API, e quando a busca não retorna nenhum resultado.

#### Scenario: Busca sem resultados exibe mensagem clara
- **WHEN** uma combinação de filtros não retorna nenhuma oportunidade
- **THEN** a interface exibe uma mensagem indicando a ausência de resultados, não uma lista vazia sem explicação

#### Scenario: Falha de comunicação com a API exibe mensagem de erro
- **WHEN** a API não responde ou retorna um erro inesperado
- **THEN** a interface exibe uma mensagem de erro perceptível ao usuário, em vez de permanecer indefinidamente em estado de carregamento ou falhar silenciosamente

### Requirement: Página de Detalhe de Oportunidade
O sistema SHALL exibir, para cada oportunidade, uma página de detalhe com todos os campos retornados pela API, incluindo o checklist de documentos exigidos e, quando disponível, o resumo gerado pela análise de IA.

#### Scenario: Detalhe exibe o checklist de documentos exigidos
- **WHEN** a página de detalhe de uma oportunidade com documentos exigidos cadastrados é exibida
- **THEN** cada documento exigido aparece listado, com indicação se é obrigatório ou recomendado

#### Scenario: Detalhe sem análise de IA disponível não exibe o card de resumo
- **WHEN** a oportunidade exibida não possui nenhuma análise de IA concluída
- **THEN** a página de detalhe não exibe o card de resumo de IA, sem apresentar erro

### Requirement: Transparência Sobre Conteúdo Gerado por IA
Sempre que a interface exibir conteúdo derivado de análise de IA (resumo, documentos exigidos extraídos), o sistema SHALL indicar explicitamente que esse conteúdo foi gerado por IA e pode conter imprecisões, com um link direto para a fonte oficial do edital.

#### Scenario: Card de resumo de IA inclui aviso e link para a fonte oficial
- **WHEN** o card de resumo gerado por IA é exibido na página de detalhe
- **THEN** um aviso visível indica que o conteúdo foi gerado por IA, acompanhado de um link para a URL oficial do edital

### Requirement: Indicação de Abrangência Estadual
O sistema SHALL indicar visivelmente quando uma oportunidade listada ou detalhada abrange todo o estado do Paraná, não apenas os municípios diretamente vinculados a ela.

#### Scenario: Edital estadual exibe indicação visível
- **WHEN** uma oportunidade com `coversEntireState = true` é exibida em um card ou na página de detalhe
- **THEN** uma indicação visível (ex.: selo ou texto) comunica que ela abrange todo o estado

### Requirement: Layout Utilizável em Telas Pequenas
Abaixo do ponto de corte de layout desktop, o sistema SHALL alternar entre a visualização do mapa e a da lista de oportunidades por meio de abas, em vez de exibi-los lado a lado, e SHALL abrir por padrão na visualização de lista.

#### Scenario: Tela estreita abre na lista, não no mapa
- **WHEN** a página inicial é carregada em uma largura de tela abaixo do ponto de corte de layout desktop
- **THEN** a lista de oportunidades é exibida por padrão, com uma forma de alternar para a visualização do mapa

#### Scenario: Alternância entre mapa e lista preserva os filtros aplicados
- **WHEN** o usuário alterna da visualização de lista para a de mapa (ou vice-versa) em uma tela pequena
- **THEN** os filtros atualmente aplicados continuam em vigor na outra visualização

### Requirement: Filtros Colapsáveis em Telas Pequenas
Abaixo do ponto de corte de layout desktop, o sistema SHALL exibir os filtros de busca recolhidos por padrão, com uma forma explícita de expandi-los, para não ocupar a tela inteira antes de qualquer conteúdo útil.

#### Scenario: Filtros ficam ocultos até serem expandidos
- **WHEN** a página inicial é carregada em uma largura de tela abaixo do ponto de corte de layout desktop
- **THEN** os campos de filtro não são exibidos até que o usuário acione explicitamente a opção de expandi-los

### Requirement: Página de Detalhe Legível em Telas Estreitas
O sistema SHALL reorganizar a seção de informações da página de detalhe de oportunidade para uma única coluna em telas estreitas, evitando que o texto fique espremido, e SHALL permitir que o cabeçalho (título e selo de abrangência estadual) quebre linha em vez de forçar sobreposição.

#### Scenario: Informações em coluna única em tela estreita
- **WHEN** a página de detalhe de uma oportunidade é exibida em uma largura de tela estreita (tipo celular)
- **THEN** os campos de faixa de valores, inscrições, municípios contemplados e número do edital são exibidos em uma única coluna, não lado a lado
