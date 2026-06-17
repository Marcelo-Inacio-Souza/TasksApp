# TasksApp

Sistema interno de gestao de tarefas, documentos e fluxos empresariais para um grupo com multiplas empresas.

## Escopo funcional planejado

- Gestao de tarefas compartilhadas e individuais, com hierarquia de usuarios.
- Biblioteca local de documentos para troca de arquivos entre usuarios.
- Controle de planilhas de medicoes, custos de obras e solicitacoes de reembolso.
- Chat interno por tarefa, projeto, empresa ou conversa direta.
- Links de reunioes online, com integracao futura para Microsoft Teams ou ferramenta similar.
- Relatorios operacionais e gerenciais, com foco em exportacao Excel.
- Importacao e exportacao de documentos, planilhas e evidencias.
- Fluxos adaptados para contratos de manutencao, areas verdes, reflorestamento, zeladoria, cemiterios e servicos publicos.
- Organizacao por empresas, contratos, clientes, unidades atendidas e orgaos publicos.

## Stack inicial

- Backend: FastAPI
- Banco: Supabase PostgreSQL via SQLAlchemy
- Frontend: React + TypeScript + Tailwind
- Autenticacao: propria no backend
- Documentos: armazenamento local no servidor da aplicacao

## Desenvolvimento local

### Abrir o sistema para testes

Para abrir tudo com um comando no Windows PowerShell:

```powershell
cd "C:\Users\Marcelo\Desktop\MARCELO LOCAL\DESKTOP LOCAL II\__SISTEMAS__\Projetos\tasks_app"
.\scripts\start_dev.ps1
```

O script abre duas janelas:

- Backend FastAPI: `http://127.0.0.1:8000`
- Frontend React: `http://127.0.0.1:5173`

Depois que as duas janelas terminarem de carregar, acesse:

- App: `http://127.0.0.1:5173`
- Documentacao da API: `http://127.0.0.1:8000/docs`
- Teste rapido da API: `http://127.0.0.1:8000/api/health`

Para encerrar, feche as duas janelas abertas pelo script ou pressione `Ctrl+C` em cada uma.

### Autenticacao inicial

O App ja possui o primeiro fluxo funcional de autenticacao:

- Antes do primeiro usuario, use a opcao `Criar primeiro master` na tela de login.
- O usuario master tem permissao total e pode cadastrar novos usuarios.
- Novos usuarios sao criados pelo master com senha padrao `user123`.
- No primeiro acesso, o usuario comum deve trocar a senha antes de entrar no painel.
- Perfis iniciais: master, diretor, gerente, engenharia, analista, assistente e producao.

Se o banco estiver vazio, aplique as migrations antes do primeiro acesso:

```powershell
.venv\Scripts\activate
alembic upgrade head
```

### Passo a passo manual

1. Ative o ambiente virtual:

```powershell
.venv\Scripts\activate
```

2. Instale as dependencias Python:

```powershell
pip install -r requirements.txt
```

3. Copie `.env.example` para `.env` e preencha a senha do banco.

4. Rode o backend:

```powershell
uvicorn backend.app.main:app --reload
```

5. Teste a API:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/health
```

6. Teste a conexao com o banco:

```powershell
python -m scripts.check_db
```

Se a conexao Direct do Supabase falhar por DNS, IPv6 ou timeout no Windows, use a connection string do Session Pooler no `.env`:

```env
DATABASE_URL=postgresql://postgres.project-ref:sua-senha@pooler-host.supabase.com:5432/postgres
```

Quando a conexao estiver funcionando, aplique as migrations:

```powershell
alembic upgrade head
```

7. Instale e rode o frontend:

```powershell
cd frontend
$env:NODE_OPTIONS="--dns-result-order=ipv4first --use-system-ca"
npm install
npm run dev
```

No Windows, a variavel `NODE_OPTIONS` acima ajuda o npm a usar os certificados do sistema e evita erros como `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.
