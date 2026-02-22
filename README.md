@"
Criar e Associar Deals (HubSpot)

Este script (HubSpot **Custom Code Action**) cria um **Deal de Execução** a partir de um **Deal de origem**, copiando propriedades e replicando associações.

## O que ele faz
- Busca o Deal de origem (HubSpot CRM API v3)
- Copia propriedades configuradas em `PROPERTIES_TO_COPY`
- Cria um novo Deal no **pipeline** e **etapa** definidos
- Associa **Deal ↔ Deal**
- Replica associações com **Contatos** e **Empresa** (se existir)

## Configuração no HubSpot
1. Automação → Workflows (baseado em **Deals**)
2. Adicione ação: **Custom code**
3. Cole o conteúdo do arquivo `main.js`
4. Crie um **Secret** no workflow:
   - `token_triagem` (Private App Token)
5. Ajuste no código:
   - `PIPELINE_DESTINO`
   - `STAGE_DESTINO`
   - `PROPERTIES_TO_COPY`
   - IDs de associação (se necessário)

## Requisitos
- Token de **Private App** com permissões de CRM para Deals/Contacts/Companies
- Node.js (no ambiente do HubSpot)

## Observações
- O token **não** fica no código (usa `process.env.token_triagem`)
- Se houver muitos contatos associados, considere paginação e controle de rate limit

---
Autor: Luan
"@ | Out-File -Encoding utf8 README.md
