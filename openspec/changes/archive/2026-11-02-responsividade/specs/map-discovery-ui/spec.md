## ADDED Requirements

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
