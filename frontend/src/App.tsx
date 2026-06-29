import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Bell,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Columns3,
  FileSpreadsheet,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Video,
  X,
  GripVertical,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

// ============================================================
// TYPES
// ============================================================

type Theme = 'dark' | 'light';
type ActiveView = 'painel' | 'quadros';

type Role = {
  id: string;
  code: string;
  name: string;
  hierarchy_level: number;
  permissions: Record<string, boolean>;
  is_system: boolean;
  is_active: boolean;
};

type AuthUser = {
  id: string;
  company_id: string | null;
  role_id: string;
  role: Role;
  name: string;
  username: string;
  email: string;
  avatar_url: string | null;
  must_change_password: boolean;
  is_active: boolean;
  created_at: string;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

type NavItem = {
  label: string;
  icon: LucideIcon;
  view?: ActiveView;
};

type Metric = {
  label: string;
  value: string;
  caption: string;
};

type Module = {
  code: string;
  title: string;
  description: string;
};

// API types
type ApiBoard = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  company_id: string | null;
  created_at: string;
  updated_at: string;
};

type ApiTaskAssignee = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
};

type ApiTask = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: string;
  position: number;
  due_at: string | null;
  completed_at: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  assignees: ApiTaskAssignee[];
};

type ApiColumn = {
  id: string;
  board_id: string;
  name: string;
  color: string;
  position: number;
  is_done_column: boolean;
  tasks: ApiTask[];
};

type ApiBoardWithColumns = ApiBoard & { columns: ApiColumn[] };

// ============================================================
// CONSTANTS
// ============================================================

const API_BASE_URL = 'http://localhost:8000/api';
const TOKEN_STORAGE_KEY = 'tasksapp-token';

const navItems: NavItem[] = [
  { label: 'Painel', icon: LayoutDashboard, view: 'painel' },
  { label: 'Quadros', icon: Columns3, view: 'quadros' },
  { label: 'Documentos', icon: FileText },
  { label: 'Reembolsos', icon: ReceiptText },
  { label: 'Chat', icon: MessageSquare },
  { label: 'Reunioes', icon: Video },
  { label: 'Relatorios', icon: FileSpreadsheet },
  { label: 'Empresas', icon: Building2 },
  { label: 'Usuarios', icon: Users },
  { label: 'Configuracoes', icon: Settings },
];

const metrics: Metric[] = [
  { label: 'Tarefas abertas', value: '42', caption: 'Manutencao, zeladoria e obras' },
  { label: 'Documentos', value: '128', caption: 'Planilhas, fotos, contratos e notas' },
  { label: 'Reembolsos', value: '17', caption: '6 aguardando aprovacao' },
  { label: 'Relatorios Excel', value: '9', caption: 'Gerados neste mes' },
];

const modules: Module[] = [
  { code: 'DOC', title: 'Arquivos', description: 'Troca de documentos por tarefa, contrato, empresa ou medicao.' },
  { code: 'MED', title: 'Medicoes', description: 'Planilhas de obras, custos, periodos e evidencias de campo.' },
  { code: 'REB', title: 'Reembolsos', description: 'Solicitacoes com anexos, aprovacao e historico financeiro.' },
  { code: 'MSG', title: 'Chat', description: 'Conversas por tarefa, equipe, contrato ou usuario.' },
  { code: 'ON', title: 'Reunioes', description: 'Links para reunioes online e integracao futura com Teams.' },
  { code: 'XLS', title: 'Relatorios', description: 'Exportacao Excel para orgaos publicos, custos e produtividade.' },
];

const roleFallback: Role[] = [
  roleOption('master', 'Master', 100),
  roleOption('diretor', 'Diretor', 90),
  roleOption('gerente', 'Gerente', 80),
  roleOption('engenharia', 'Engenharia', 70),
  roleOption('analista', 'Analista', 60),
  roleOption('assistente', 'Assistente', 50),
  roleOption('producao', 'Producao', 40),
];

const PRIORITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

const PRIORITY_COLORS: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-600',
  normal: 'bg-blue-100 text-blue-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

// ============================================================
// HELPERS
// ============================================================

function roleOption(code: string, name: string, hierarchyLevel: number): Role {
  return { id: code, code, name, hierarchy_level: hierarchyLevel, permissions: {}, is_system: true, is_active: true };
}

function useLocalClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);
  return useMemo(() => ({
    date: now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
    time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }), [now]);
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || 'Nao foi possivel concluir a operacao.';
  } catch {
    return 'Nao foi possivel concluir a operacao.';
  }
}

function apiFetch(token: string) {
  return async function<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!response.ok) throw new Error(await readApiError(response));
    return response.json() as Promise<T>;
  };
}

// ============================================================
// APP ROOT
// ============================================================

export function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('tasksapp-theme') as Theme) || 'dark');
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'bootstrap'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loadingSession, setLoadingSession] = useState(Boolean(token));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('painel');
  const clock = useLocalClock();
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('tasksapp-theme', theme);
  }, [theme, isDark]);

  useEffect(() => {
    if (!token) { setLoadingSession(false); return; }
    fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<AuthUser>; })
      .then(setUser)
      .catch(() => { setToken(''); setUser(null); localStorage.removeItem(TOKEN_STORAGE_KEY); })
      .finally(() => setLoadingSession(false));
  }, [token]);

  function storeSession(data: TokenResponse) {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setAuthError('');
    setAuthSuccess('');
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken('');
    setUser(null);
    setAuthMode('login');
  }

  async function handleLogin(username: string, password: string) {
    setAuthError('');
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) throw new Error(await readApiError(response));
    storeSession((await response.json()) as TokenResponse);
  }

  async function handleBootstrap(name: string, email: string, password: string) {
    setAuthError('');
    const response = await fetch(`${API_BASE_URL}/auth/bootstrap-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) throw new Error(await readApiError(response));
    storeSession((await response.json()) as TokenResponse);
  }

  if (loadingSession) return (
    <AuthShell>
      <div className="grid min-h-screen place-items-center text-slate-400">Carregando...</div>
    </AuthShell>
  );

  if (!user) return (
    <AuthScreen authMode={authMode} authError={authError} authSuccess={authSuccess} isDark={isDark}
      setAuthMode={setAuthMode} setAuthError={setAuthError} onLogin={handleLogin} onBootstrap={handleBootstrap}
      onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')} theme={theme} />
  );

  if (user.must_change_password) return (
    <PasswordChangeScreen isDark={isDark} user={user} token={token} onLogout={logout}
      onChanged={setUser} onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')} theme={theme} />
  );

  const activeNavLabel = activeView === 'painel' ? 'Painel' : 'Quadros';

  return (
    <ShellBackground isDark={isDark}>
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className={clsx(
          'relative hidden border-r px-3 py-5 backdrop-blur-xl lg:flex lg:flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-72',
          isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white/85',
        )}>
          <div className={clsx('flex items-center gap-3 px-1 overflow-hidden', sidebarCollapsed ? 'justify-center' : 'justify-between')}>
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo-sangra.png" alt="Sangra D'Água"
                className={clsx('object-contain flex-shrink-0', sidebarCollapsed ? 'h-8 w-8' : 'h-9 w-auto')} />
              {!sidebarCollapsed && <h1 className="text-lg font-semibold tracking-normal">TasksApp</h1>}
            </div>
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
              className={clsx('grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border transition',
                isDark ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-cyan-400'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-cyan-500')}>
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon, view }) => (
              <div key={label} className="relative group">
                <button
                  onClick={() => view && setActiveView(view)}
                  className={clsx(
                    'flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                    sidebarCollapsed && 'justify-center px-0',
                    label === activeNavLabel
                      ? isDark ? 'bg-white text-slate-950' : 'bg-slate-950 text-white'
                      : isDark ? 'text-slate-300 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100',
                  )}>
                  <Icon size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>
                {sidebarCollapsed && (
                  <div className={clsx(
                    'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                    isDark ? 'bg-slate-700 text-slate-100' : 'bg-slate-800 text-white',
                  )}>
                    {label}
                    <span className={clsx('absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent',
                      isDark ? 'border-r-slate-700' : 'border-r-slate-800')} />
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          {/* HEADER */}
          <header className={clsx(
            'flex min-h-20 items-center justify-between gap-4 border-b px-5 backdrop-blur-xl',
            isDark ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/85',
          )}>
            <div className="min-w-0">
              <p className={clsx('flex items-center gap-2 text-sm capitalize', isDark ? 'text-slate-400' : 'text-slate-500')}>
                <CalendarClock size={16} /> {clock.date}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl font-semibold tracking-normal">
                  {activeView === 'painel' ? 'Painel de Gerenciamento' : 'Quadros Kanban'}
                </h2>
                <span className={clsx('rounded-md border px-2 py-1 text-sm',
                  isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-500')}>
                  {clock.time}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={clsx('hidden h-10 w-80 items-center gap-2 rounded-md border px-3 md:flex',
                isDark ? 'border-white/10 bg-slate-900 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500')}>
                <Search size={17} />
                <span className="text-sm">Pesquisar tarefas, medicoes, contratos ou documentos</span>
              </div>
              <IconButton isDark={isDark} title="Notificacoes"><Bell size={18} /></IconButton>
              <IconButton isDark={isDark} title="Alternar tema" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <button className={clsx('flex h-10 items-center gap-3 rounded-md border px-3 text-left transition',
                isDark ? 'border-white/10 bg-slate-900 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-100')}>
                <span className="grid h-7 w-7 place-items-center rounded-md bg-cyan-500 text-xs font-bold text-white">
                  {user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
              </button>
              <IconButton isDark={isDark} title="Sair" onClick={logout}><LogOut size={18} /></IconButton>
            </div>
          </header>

          {/* CONTENT */}
          {activeView === 'painel' ? (
            <PainelView isDark={isDark} user={user} token={token} />
          ) : (
            <QuadrosView isDark={isDark} token={token} />
          )}
        </main>
      </div>
    </ShellBackground>
  );
}

// ============================================================
// PAINEL VIEW
// ============================================================

function PainelView({ isDark, user, token }: { isDark: boolean; user: AuthUser; token: string }) {
  return (
    <>
      <section className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Panel key={metric.label} isDark={isDark}>
            <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-normal">{metric.value}</p>
            <p className={clsx('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{metric.caption}</p>
          </Panel>
        ))}
      </section>

      {user.role.code === 'master' && <UserAdminPanel isDark={isDark} token={token} />}

      <section className="grid gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-6">
        {modules.map((module) => (
          <Panel key={module.code} isDark={isDark}>
            <span className={clsx('grid h-8 w-10 place-items-center rounded-md bg-cyan-500/10 text-xs font-black',
              isDark ? 'text-cyan-300' : 'text-cyan-500')}>{module.code}</span>
            <h3 className="mt-3 font-semibold">{module.title}</h3>
            <p className={clsx('mt-2 text-sm leading-5', isDark ? 'text-slate-400' : 'text-slate-500')}>{module.description}</p>
          </Panel>
        ))}
      </section>
    </>
  );
}

// ============================================================
// QUADROS VIEW
// ============================================================

function QuadrosView({ isDark, token }: { isDark: boolean; token: string }) {
  const [boards, setBoards] = useState<ApiBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<ApiBoardWithColumns | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);
  const api = apiFetch(token);

  useEffect(() => {
    void loadBoards();
  }, []);

  async function loadBoards() {
    setLoading(true);
    try {
      const data = await api<ApiBoard[]>('/boards');
      setBoards(data);
      if (data.length > 0) {
        await loadBoard(data[0].id);
      } else {
        setLoading(false);
      }
    } catch {
      setError('Nao foi possivel carregar os quadros.');
      setLoading(false);
    }
  }

  async function loadBoard(boardId: string) {
    setLoading(true);
    try {
      const data = await api<ApiBoardWithColumns>(`/boards/${boardId}`);
      setSelectedBoard(data);
    } catch {
      setError('Nao foi possivel carregar o quadro.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoard() {
    if (!newBoardName.trim()) return;
    setCreating(true);
    try {
      const board = await api<ApiBoard>('/boards', { method: 'POST', body: JSON.stringify({ name: newBoardName.trim() }) });
      setBoards((prev) => [...prev, board]);
      setNewBoardName('');
      setShowNewBoard(false);
      await loadBoard(board.id);
    } catch {
      setError('Nao foi possivel criar o quadro.');
    } finally {
      setCreating(false);
    }
  }

  async function handleTaskCreated() {
  if (selectedBoard) {
    const boardId = selectedBoard.id;
    setSelectedBoard(null);
    await loadBoard(boardId);
  }
}  

  async function handleTaskMoved(taskId: string, targetColumnId: string, position: number) {
    try {
      await api(`/boards/tasks/${taskId}/move`, { method: 'POST', body: JSON.stringify({ column_id: targetColumnId, position }) });
      if (selectedBoard) await loadBoard(selectedBoard.id);
    } catch {
      setError('Nao foi possivel mover a tarefa.');
    }
  }

  if (loading) return (
    <div className="flex flex-1 items-center justify-center p-10">
      <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>Carregando quadros...</p>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col px-5 py-5 gap-4">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="flex items-center gap-3 flex-wrap">
        {boards.map((board) => (
          <button key={board.id}
            onClick={() => void loadBoard(board.id)}
            className={clsx('rounded-md px-4 py-2 text-sm font-medium border transition',
              selectedBoard?.id === board.id
                ? 'bg-cyan-500 text-white border-cyan-500'
                : isDark ? 'border-white/10 text-slate-300 hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100',
            )}>
            {board.name}
          </button>
        ))}

        {showNewBoard ? (
          <div className="flex items-center gap-2">
            <input value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)}
              placeholder="Nome do quadro"
              onKeyDown={(e) => e.key === 'Enter' && void handleCreateBoard()}
              className={clsx('h-9 rounded-md border px-3 text-sm outline-none focus:border-cyan-400',
                isDark ? 'border-white/10 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-950')} />
            <button onClick={() => void handleCreateBoard()} disabled={creating}
              className="h-9 rounded-md bg-cyan-500 px-3 text-sm font-medium text-white hover:bg-cyan-400 disabled:opacity-60">
              {creating ? '...' : 'Criar'}
            </button>
            <button onClick={() => setShowNewBoard(false)}
              className={clsx('h-9 rounded-md border px-3 text-sm transition',
                isDark ? 'border-white/10 text-slate-400 hover:bg-white/10' : 'border-slate-200 text-slate-500 hover:bg-slate-100')}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowNewBoard(true)}
            className={clsx('flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition',
              isDark ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-cyan-400'
                : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-cyan-500')}>
            <Plus size={14} /> Novo quadro
          </button>
        )}
      </div>

      {selectedBoard ? (
        <KanbanBoard board={selectedBoard} isDark={isDark} token={token}
          onTaskCreated={handleTaskCreated} onTaskMoved={handleTaskMoved} />
      ) : (
        <div className={clsx('flex flex-1 items-center justify-center rounded-lg border',
          isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500')}>
          <div className="text-center">
            <Columns3 size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum quadro encontrado.</p>
            <p className="text-xs mt-1 opacity-70">Crie um novo quadro para comecar.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// KANBAN BOARD
// ============================================================

function KanbanBoard({ board, isDark, token, onTaskCreated, onTaskMoved }: {
  board: ApiBoardWithColumns;
  isDark: boolean;
  token: string;
  onTaskCreated: () => Promise<void>;
  onTaskMoved: (taskId: string, columnId: string, position: number) => Promise<void>;
}) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('normal');
  const [creating, setCreating] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const api = apiFetch(token);

  const sortedColumns = [...board.columns].sort((a, b) => a.position - b.position);

  async function handleCreateTask() {
    if (!newTaskTitle.trim() || !newTaskColumnId) return;
    setCreating(true);
    try {
      await api(`/boards/${board.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title: newTaskTitle.trim(), column_id: newTaskColumnId, priority: newTaskPriority }),
      });
      setNewTaskTitle('');
      setNewTaskPriority('normal');
      setShowNewTask(false);
      await onTaskCreated();
    } catch {
      // silently fail
    } finally {
      setCreating(false);
    }
  }

  function handleDragStart(taskId: string) {
    setDragTaskId(taskId);
  }

  function handleDrop(e: React.DragEvent, columnId: string, position: number) {
    e.preventDefault();
    if (!dragTaskId) return;
    void onTaskMoved(dragTaskId, columnId, position);
    setDragTaskId(null);
  }

  return (
    <div className="flex flex-col flex-1 gap-4 min-h-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{board.name}</h3>
          {board.description && (
            <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{board.description}</p>
          )}
        </div>
        <button
          onClick={() => { setShowNewTask(true); setNewTaskColumnId(sortedColumns[0]?.id ?? ''); }}
          className="flex h-10 items-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition">
          <Plus size={18} /> Nova tarefa
        </button>
      </div>

      {showNewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className={clsx('w-full max-w-md rounded-xl border p-6 shadow-2xl',
            isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Nova tarefa</h3>
              <button onClick={() => setShowNewTask(false)}
                className={clsx('grid h-8 w-8 place-items-center rounded-md transition',
                  isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-100')}>
                <X size={16} />
              </button>
            </div>
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Titulo</span>
                <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                  autoFocus placeholder="Descreva a tarefa..."
                  onKeyDown={(e) => e.key === 'Enter' && void handleCreateTask()}
                  className={clsx('h-10 rounded-md border px-3 outline-none focus:border-cyan-400',
                    isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Coluna</span>
                <select value={newTaskColumnId} onChange={(e) => setNewTaskColumnId(e.target.value)}
                  className={clsx('h-10 rounded-md border px-3 outline-none focus:border-cyan-400',
                    isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}>
                  {sortedColumns.map((col) => <option key={col.id} value={col.id}>{col.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Prioridade</span>
                <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}
                  className={clsx('h-10 rounded-md border px-3 outline-none focus:border-cyan-400',
                    isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}>
                  {Object.entries(PRIORITY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </label>
              <div className="flex gap-2 mt-2">
                <button onClick={() => void handleCreateTask()} disabled={creating || !newTaskTitle.trim()}
                  className="flex-1 h-10 rounded-md bg-cyan-500 text-sm font-semibold text-white hover:bg-cyan-400 disabled:opacity-60 transition">
                  {creating ? 'Criando...' : 'Criar tarefa'}
                </button>
                <button onClick={() => setShowNewTask(false)}
                  className={clsx('h-10 rounded-md border px-4 text-sm transition',
                    isDark ? 'border-white/10 text-slate-300 hover:bg-white/10' : 'border-slate-200 text-slate-600 hover:bg-slate-100')}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {sortedColumns.map((column) => {
          const sortedTasks = [...(column.tasks ?? [])].sort((a, b) => a.position - b.position);
          return (
            <div key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, column.id, sortedTasks.length)}
              className={clsx('flex flex-col min-w-72 w-72 rounded-xl border',
                isDark ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white/80')}>
              <div className="flex items-center justify-between p-3 border-b"
                style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: column.color }} />
                  <h4 className="font-semibold text-sm">{column.name}</h4>
                </div>
                <span className={clsx('rounded-md px-2 py-0.5 text-xs',
                  isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500')}>
                  {(column.tasks ?? []).length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-3 flex-1 overflow-y-auto max-h-[60vh]">
                {sortedTasks.map((task, idx) => (
                  <div key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onDrop={(e) => { e.stopPropagation(); handleDrop(e, column.id, idx); }}
                    onDragOver={(e) => e.preventDefault()}
                    className={clsx(
                      'rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                      isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white',
                    )}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-5 flex-1">{task.title}</p>
                      <GripVertical size={14} className="flex-shrink-0 opacity-30 mt-0.5" />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={clsx('rounded px-1.5 py-0.5 text-xs font-medium',
                        PRIORITY_COLORS[task.priority] ?? 'bg-slate-100 text-slate-600')}>
                        {PRIORITY_LABELS[task.priority] ?? task.priority}
                      </span>
                      {task.due_at && (
                        <span className={clsx('text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                          {new Date(task.due_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {task.assignees.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {task.assignees.map((a) => (
                          <span key={a.id}
                            className={clsx('rounded-full px-2 py-0.5 text-xs',
                              isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-50 text-cyan-700')}>
                            {a.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {sortedTasks.length === 0 && (
                  <div className={clsx('flex flex-1 items-center justify-center rounded-lg border-2 border-dashed py-8',
                    isDark ? 'border-white/10 text-slate-600' : 'border-slate-200 text-slate-300')}>
                    <p className="text-xs">Arraste tarefas aqui</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// SHELL BACKGROUNDS
// ============================================================

// Fundo para o app principal (painel, quadros, etc.)
function ShellBackground({ children, isDark }: { children: ReactNode; isDark: boolean }) {
  return (
    <div className={clsx('min-h-screen transition-colors', isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-950')}>
      {children}
    </div>
  );
}

// Fundo geometrico para telas de autenticacao
function AuthShell({ children, isDark }: { children: ReactNode; isDark: boolean }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradiente adaptativo dark/light */}
      <div className="absolute inset-0" style={{
        background: isDark
          ? 'linear-gradient(135deg, #051a05 0%, #0a2e0a 40%, #062010 70%, #030f03 100%)'
          : 'linear-gradient(135deg, #e8f5e9 0%, #d0ead1 40%, #bbdfbd 70%, #a8d5ab 100%)',
      }} />
      {/* Padrão geométrico */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <polygon points="200,50 400,350 0,350" fill="none"
          stroke={isDark ? '#22c55e' : '#4ade80'} strokeWidth="1" opacity={isDark ? '0.15' : '0.4'} />
        <polygon points="900,100 1150,450 650,450" fill="none"
          stroke={isDark ? '#22c55e' : '#4ade80'} strokeWidth="1" opacity={isDark ? '0.12' : '0.3'} />
        <polygon points="1300,200 1500,500 1100,500" fill="none"
          stroke={isDark ? '#16a34a' : '#22c55e'} strokeWidth="1" opacity={isDark ? '0.15' : '0.35'} />
        <polygon points="100,550 350,850 -150,850" fill="none"
          stroke={isDark ? '#22c55e' : '#4ade80'} strokeWidth="1" opacity={isDark ? '0.1' : '0.25'} />
        <polygon points="1100,500 1350,800 850,800" fill="none"
          stroke={isDark ? '#16a34a' : '#22c55e'} strokeWidth="1" opacity={isDark ? '0.12' : '0.3'} />
        <polygon points="700,80 780,200 620,200"
          fill={isDark ? '#16a34a' : '#86efac'} opacity={isDark ? '0.25' : '0.5'} />
        <polygon points="1200,300 1260,400 1140,400"
          fill={isDark ? '#15803d' : '#4ade80'} opacity={isDark ? '0.2' : '0.4'} />
        <polygon points="300,650 360,750 240,750"
          fill={isDark ? '#16a34a' : '#86efac'} opacity={isDark ? '0.2' : '0.45'} />
        <line x1="0" y1="200" x2="500" y2="700"
          stroke={isDark ? '#22c55e' : '#16a34a'} strokeWidth="0.8" opacity={isDark ? '0.1' : '0.2'} />
        <line x1="200" y1="0" x2="900" y2="900"
          stroke={isDark ? '#16a34a' : '#15803d'} strokeWidth="0.8" opacity={isDark ? '0.08' : '0.15'} />
        <line x1="800" y1="0" x2="1440" y2="600"
          stroke={isDark ? '#22c55e' : '#16a34a'} strokeWidth="0.8" opacity={isDark ? '0.1' : '0.2'} />
        <line x1="1000" y1="0" x2="400" y2="900"
          stroke={isDark ? '#15803d' : '#22c55e'} strokeWidth="0.8" opacity={isDark ? '0.08' : '0.15'} />
        <circle cx="450" cy="150" r="3" fill={isDark ? '#22c55e' : '#16a34a'} opacity={isDark ? '0.3' : '0.5'} />
        <circle cx="900" cy="400" r="2" fill={isDark ? '#22c55e' : '#16a34a'} opacity={isDark ? '0.25' : '0.4'} />
        <circle cx="1300" cy="650" r="3" fill={isDark ? '#16a34a' : '#22c55e'} opacity={isDark ? '0.3' : '0.5'} />
        <circle cx="150" cy="750" r="2" fill={isDark ? '#22c55e' : '#16a34a'} opacity={isDark ? '0.25' : '0.4'} />
        <circle cx="700" cy="600" r="2" fill={isDark ? '#15803d' : '#22c55e'} opacity={isDark ? '0.2' : '0.35'} />
        <path d="M400 300 L500 300 L500 400 L650 400" fill="none"
          stroke={isDark ? '#22c55e' : '#16a34a'} strokeWidth="1" opacity={isDark ? '0.12' : '0.25'} />
        <circle cx="400" cy="300" r="3" fill={isDark ? '#22c55e' : '#16a34a'} opacity={isDark ? '0.2' : '0.35'} />
        <circle cx="650" cy="400" r="3" fill={isDark ? '#22c55e' : '#16a34a'} opacity={isDark ? '0.2' : '0.35'} />
        <path d="M1000 200 L1100 200 L1100 300 L1200 300" fill="none"
          stroke={isDark ? '#16a34a' : '#22c55e'} strokeWidth="1" opacity={isDark ? '0.12' : '0.25'} />
        <circle cx="1000" cy="200" r="3" fill={isDark ? '#16a34a' : '#22c55e'} opacity={isDark ? '0.2' : '0.35'} />
        <circle cx="1200" cy="300" r="3" fill={isDark ? '#16a34a' : '#22c55e'} opacity={isDark ? '0.2' : '0.35'} />
      </svg>
      <div className={clsx('relative z-10', isDark ? 'text-slate-100' : 'text-slate-800')}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// UI COMPONENTS
// ============================================================

function IconButton({ children, isDark, title, onClick }: { children: ReactNode; isDark: boolean; title: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={title}
      className={clsx('grid h-10 w-10 place-items-center rounded-md border transition',
        isDark ? 'border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100')}>
      {children}
    </button>
  );
}

function Panel({ children, isDark, className }: { children: ReactNode; isDark: boolean; className?: string }) {
  return (
    <div className={clsx('rounded-lg border p-4 shadow-sm',
      isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white', className)}>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, isDark, type = 'text', autoComplete }: {
  label: string; value: string; onChange: (v: string) => void;
  isDark: boolean; type?: string; autoComplete?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
      <input value={value} type={type} autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={clsx('h-10 rounded-md border px-3 outline-none transition focus:border-cyan-400',
          isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')} />
    </label>
  );
}

function Alert({ children, tone }: { children: ReactNode; tone: 'error' | 'success' }) {
  return (
    <div className={clsx('rounded-md border px-3 py-2 text-sm',
      tone === 'error' ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
        : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200')}>
      {children}
    </div>
  );
}

// ============================================================
// AUTH SCREENS
// ============================================================

function AuthScreen({ authMode, authError, authSuccess, isDark, setAuthMode, setAuthError, onLogin, onBootstrap, onToggleTheme, theme }: {
  authMode: 'login' | 'bootstrap'; authError: string; authSuccess: string; isDark: boolean;
  setAuthMode: (m: 'login' | 'bootstrap') => void; setAuthError: (e: string) => void;
  onLogin: (u: string, p: string) => Promise<void>;
  onBootstrap: (n: string, e: string, p: string) => Promise<void>;
  onToggleTheme: () => void; theme: Theme;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const clock = useLocalClock();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      authMode === 'bootstrap' ? await onBootstrap(name, email, password) : await onLogin(email, password);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Nao foi possivel acessar.');
    } finally {
      setSubmitting(false);
    }
  }

  // Estilos adaptativos
  const cardBg = isDark
    ? 'bg-white/5 border-white/10 backdrop-blur-md'
    : 'bg-white/90 border-green-200/60 backdrop-blur-sm shadow-xl';
  const inputCls = isDark
    ? 'border-white/10 bg-white/5 text-slate-100 focus:border-green-400'
    : 'border-green-200 bg-white text-slate-800 focus:border-green-500';
  const labelCls = isDark ? 'text-slate-300' : 'text-slate-600';
  const btnSecondary = isDark
    ? 'border-white/10 text-slate-300 hover:bg-white/10'
    : 'border-green-200 text-slate-600 hover:bg-green-50';
  const clockColor = isDark ? 'text-green-400' : 'text-green-600';
  const clockDateColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const subtitleColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const titleColor = isDark ? 'text-white' : 'text-slate-800';
  const iconBg = isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600';
  const btnPrimary = isDark
    ? 'bg-green-600 hover:bg-green-500 shadow-green-900/40 text-white'
    : 'bg-green-600 hover:bg-green-500 shadow-green-200 text-white';
  const themeBtnCls = isDark
    ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
    : 'border-green-200 bg-white/80 text-slate-600 hover:bg-green-50';
  const footerCls = isDark ? 'text-slate-600' : 'text-slate-400';
  const footerHighlight = isDark ? 'text-green-500/80' : 'text-green-600';

  return (
    <AuthShell isDark={isDark}>
      <div className="grid min-h-screen place-items-center px-5 py-8">
        <div className="w-full max-w-md">

          {/* Relogio */}
          <div className="mb-5 text-center">
            <p className={clsx('text-xs capitalize', clockDateColor)}>{clock.date}</p>
            <p className={clsx('text-3xl font-semibold tracking-widest mt-1', clockColor)}>{clock.time}</p>
          </div>

          {/* Header logo */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo-sangra.png" alt="Sangra D'Água" className="h-11 w-auto object-contain" />
              <div>
                <p className={clsx('text-xs leading-tight', subtitleColor)}>Grupo Empresarial Sangra D'Água</p>
                <h1 className={clsx('text-xl font-semibold', titleColor)}>TasksApp</h1>
              </div>
            </div>
            <button onClick={onToggleTheme} title="Alternar tema"
              className={clsx('grid h-10 w-10 place-items-center rounded-md border transition', themeBtnCls)}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Card de login */}
          <div className={clsx('rounded-xl border p-6', cardBg)}>
            <div className="mb-5 flex items-center gap-3">
              <div className={clsx('grid h-10 w-10 place-items-center rounded-md', iconBg)}>
                {authMode === 'bootstrap' ? <ShieldCheck size={20} /> : <KeyRound size={20} />}
              </div>
              <div>
                <h2 className={clsx('text-lg font-semibold', titleColor)}>
                  {authMode === 'bootstrap' ? 'Criar usuario master' : 'Entrar no sistema'}
                </h2>
                <p className={clsx('text-sm', subtitleColor)}>
                  {authMode === 'bootstrap' ? 'Disponivel apenas antes do primeiro usuario.' : 'Use seu nome de usuario e senha.'}
                </p>
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {authMode === 'bootstrap' && (
                <label className="grid gap-1 text-sm">
                  <span className={labelCls}>Nome</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
                    className={clsx('h-10 rounded-md border px-3 outline-none transition', inputCls)} />
                </label>
              )}
              <label className="grid gap-1 text-sm">
                <span className={labelCls}>{authMode === 'login' ? 'Nome de usuario' : 'E-mail'}</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)}
                  type={authMode === 'login' ? 'text' : 'email'}
                  autoComplete={authMode === 'login' ? 'username' : 'email'}
                  className={clsx('h-10 rounded-md border px-3 outline-none transition', inputCls)} />
              </label>
              <label className="grid gap-1 text-sm">
                <span className={labelCls}>Senha</span>
                <input value={password} onChange={(e) => setPassword(e.target.value)}
                  type="password" autoComplete={authMode === 'bootstrap' ? 'new-password' : 'current-password'}
                  className={clsx('h-10 rounded-md border px-3 outline-none transition', inputCls)} />
              </label>

              {authError && <Alert tone="error">{authError}</Alert>}
              {authSuccess && <Alert tone="success">{authSuccess}</Alert>}

              <button disabled={submitting}
                className={clsx('flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60', btnPrimary)}>
                {submitting ? 'Aguarde...' : authMode === 'bootstrap' ? 'Criar master' : 'Entrar'}
              </button>
            </form>

            <button
              className={clsx('mt-4 w-full rounded-md border px-3 py-2 text-sm transition', btnSecondary)}
              onClick={() => { setAuthError(''); setAuthMode(authMode === 'login' ? 'bootstrap' : 'login'); }}>
              {authMode === 'login' ? 'Criar primeiro master' : 'Voltar para login'}
            </button>
          </div>

          {/* Rodapé */}
          <p className={clsx('mt-6 text-center text-xs', footerCls)}>
            © 2026 TasksApp — Todos os direitos reservados
            <br />
            Desenvolvido por <span className={footerHighlight}>MIS Soluções Tecnológicas</span>
          </p>

        </div>
      </div>
    </AuthShell>
  );
}

function PasswordChangeScreen({ isDark, user, token, onLogout, onChanged, onToggleTheme, theme }: {
  isDark: boolean; user: AuthUser; token: string; onLogout: () => void;
  onChanged: (u: AuthUser) => void; onToggleTheme: () => void; theme: Theme;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('A confirmacao da senha nao confere.'); return; }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      onChanged((await response.json()) as AuthUser);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nao foi possivel alterar.');
    } finally {
      setSubmitting(false);
    }
  }

  const cardBg = isDark ? 'bg-white/5 border-white/10 backdrop-blur-md' : 'bg-white/90 border-green-200/60 backdrop-blur-sm shadow-xl';
  const inputCls = isDark ? 'border-white/10 bg-white/5 text-slate-100 focus:border-green-400' : 'border-green-200 bg-white text-slate-800 focus:border-green-500';
  const labelCls = isDark ? 'text-slate-300' : 'text-slate-600';
  const titleColor = isDark ? 'text-white' : 'text-slate-800';
  const subtitleColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const iconBg = isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-600';
  const btnPrimary = isDark ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white';
  const themeBtnCls = isDark ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10' : 'border-green-200 bg-white/80 text-slate-600 hover:bg-green-50';

  return (
    <AuthShell isDark={isDark}>
      <div className="grid min-h-screen place-items-center px-5 py-8">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className={clsx('text-xl font-semibold', titleColor)}>TasksApp</h1>
              <p className={clsx('text-sm', subtitleColor)}>{user.name} - {user.role.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onToggleTheme} title="Alternar tema"
                className={clsx('grid h-10 w-10 place-items-center rounded-md border transition', themeBtnCls)}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button onClick={onLogout} title="Sair"
                className={clsx('grid h-10 w-10 place-items-center rounded-md border transition', themeBtnCls)}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <div className={clsx('rounded-xl border p-6', cardBg)}>
            <div className="mb-5 flex items-center gap-3">
              <div className={clsx('grid h-10 w-10 place-items-center rounded-md', iconBg)}><KeyRound size={20} /></div>
              <div>
                <h2 className={clsx('text-lg font-semibold', titleColor)}>Alterar senha inicial</h2>
                <p className={clsx('text-sm', subtitleColor)}>A senha padrao deve ser substituida antes do uso.</p>
              </div>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              {[
                { label: 'Senha atual', value: currentPassword, onChange: setCurrentPassword },
                { label: 'Nova senha', value: newPassword, onChange: setNewPassword },
                { label: 'Confirmar nova senha', value: confirmPassword, onChange: setConfirmPassword },
              ].map(({ label, value, onChange }) => (
                <label key={label} className="grid gap-1 text-sm">
                  <span className={labelCls}>{label}</span>
                  <input value={value} onChange={(e) => onChange(e.target.value)} type="password"
                    className={clsx('h-10 rounded-md border px-3 outline-none transition', inputCls)} />
                </label>
              ))}
              {error && <Alert tone="error">{error}</Alert>}
              <button disabled={submitting}
                className={clsx('flex h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold shadow-lg transition disabled:opacity-60', btnPrimary)}>
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

// ============================================================
// USER ADMIN PANEL
// ============================================================

function UserAdminPanel({ isDark, token }: { isDark: boolean; token: string }) {
  const [roles, setRoles] = useState<Role[]>(roleFallback);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('analista');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const api = apiFetch(token);

  useEffect(() => { void loadAdminData(); }, []);

  async function loadAdminData() {
    try {
      const [loadedRoles, loadedUsers] = await Promise.all([api<Role[]>('/auth/roles'), api<AuthUser[]>('/auth/users')]);
      setRoles(loadedRoles);
      setUsers(loadedUsers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nao foi possivel carregar dados.');
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setMessage(''); setSubmitting(true);
    try {
      const data = await api<{ user: AuthUser; temporary_password: string }>('/auth/users', {
        method: 'POST', body: JSON.stringify({ name, email, role_code: roleCode }),
      });
      setUsers((prev) => [data.user, ...prev]);
      setName(''); setEmail(''); setRoleCode('analista');
      setMessage(`Usuario criado: @${data.user.username} | Senha: ${data.temporary_password}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nao foi possivel criar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 px-5 pb-5 xl:grid-cols-[minmax(360px,420px)_1fr]">
      <Panel isDark={isDark}>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-500/10 text-cyan-300"><UserPlus size={20} /></div>
          <div>
            <h3 className="font-semibold">Cadastrar usuario</h3>
            <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>Senha inicial gerada automaticamente</p>
          </div>
        </div>
        <form className="grid gap-3" onSubmit={handleCreateUser}>
          <TextField label="Nome" value={name} onChange={setName} isDark={isDark} />
          <TextField label="E-mail" value={email} onChange={setEmail} isDark={isDark} type="email" />
          <label className="grid gap-1 text-sm">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Perfil</span>
            <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)}
              className={clsx('h-10 rounded-md border px-3 outline-none focus:border-cyan-400',
                isDark ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-950')}>
              {roles.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </label>
          {error && <Alert tone="error">{error}</Alert>}
          {message && <Alert tone="success">{message}</Alert>}
          <button disabled={submitting}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:opacity-60">
            <Plus size={18} /> {submitting ? 'Criando...' : 'Criar usuario'}
          </button>
        </form>
      </Panel>

      <Panel isDark={isDark}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Usuarios cadastrados</h3>
            <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>{users.length} registro(s)</p>
          </div>
          <ShieldCheck size={20} className={isDark ? 'text-cyan-300' : 'text-cyan-600'} />
        </div>
        <div className="grid gap-2">
          {users.map((item) => (
            <div key={item.id} className={clsx('flex items-center justify-between gap-3 rounded-md border px-3 py-2',
              isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50')}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className={clsx('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  @{item.username} — {item.email}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span className={clsx('rounded-md px-2 py-1 text-xs',
                  item.role.code === 'master' ? 'bg-cyan-500 text-white'
                    : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700')}>
                  {item.role.name}
                </span>
                {item.must_change_password && <p className="mt-1 text-xs text-amber-300">Troca pendente</p>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
