# TasksApp Product Scope

## Contexto

O TasksApp sera utilizado por um grupo empresarial com seis empresas e cerca de 30 usuarios. O grupo atua em manutencao de areas verdes, reflorestamento, zeladoria de escolas e ambientes publicos, gestao e manutencao de cemiterios e atividades correlatas. Grande parte dos clientes sao orgaos publicos.

## Objetivo do sistema

Centralizar tarefas, documentos, medicoes, custos, reembolsos, comunicacao e relatorios em uma plataforma interna com controle de permissoes e visibilidade por empresa, contrato, cliente e usuario.

## Modulos principais

### Tarefas e fluxos

- Tarefas individuais e compartilhadas.
- Quadros kanban configuraveis por empresa, contrato ou departamento.
- Etapas de fluxo editaveis.
- Prioridade, prazo, responsaveis, comentarios e historico.
- Regras de permissao por perfil e hierarquia.

### Documentos

- Upload e download de arquivos variados.
- Documentos vinculados a tarefas, contratos, medicoes, reembolsos ou empresas.
- Biblioteca geral com filtros por empresa, cliente, contrato, tipo e periodo.
- Controle de usuario que enviou, data, versao e observacoes.
- Armazenamento local no servidor da aplicacao.

### Medicoes, custos e reembolsos

- Importacao de planilhas de medicao.
- Controle de custos de obras e servicos.
- Solicitacao de reembolso com anexos, aprovacao e historico.
- Status por etapa: rascunho, em analise, aprovado, reprovado, pago ou arquivado.
- Exportacao Excel para acompanhamento financeiro e prestacao de contas.

### Comunicacao

- Chat por tarefa, projeto, contrato ou conversa direta.
- Mencoes a usuarios e notificacoes.
- Registro de mensagens relacionado ao contexto operacional.
- Links para reunioes online.
- Integracao futura com Microsoft Teams ou ferramenta similar.

### Relatorios

- Relatorios de tarefas, produtividade, pendencias, documentos, custos e reembolsos.
- Exportacao Excel como formato principal.
- Filtros por empresa, cliente, orgao publico, contrato, periodo, usuario e status.
- Base para dashboards gerenciais futuros.

## Perfis iniciais

- Admin geral.
- Gestor.
- Analista.
- Colaborador.
- Visualizador.

As nomenclaturas devem ser configuraveis para adaptar o sistema ao grupo empresarial sem alterar codigo.

## Premissas tecnicas

- Backend em FastAPI.
- Banco Supabase PostgreSQL.
- Autenticacao propria no backend.
- Frontend React, TypeScript e Tailwind.
- Documentos salvos localmente no servidor.
- Exportacao de relatorios com foco em Excel.
