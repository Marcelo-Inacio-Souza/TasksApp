# TasksApp

Sistema interno de gestao de tarefas, documentos e fluxos empresariais para um grupo com multiplas empresas.

## Stack inicial

- Backend: FastAPI
- Banco: Supabase PostgreSQL via SQLAlchemy
- Frontend: React + TypeScript + Tailwind
- Autenticacao: propria no backend
- Documentos: armazenamento local no servidor da aplicacao

## Desenvolvimento local

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
npm install
npm run dev
```
