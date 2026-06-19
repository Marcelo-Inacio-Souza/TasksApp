import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type Theme = 'dark' | 'light';

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
  active?: boolean;
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

type Task = {
  title: string;
  context: string;
  due: string;
  tag: string;
  priority: string;
};

type Column = {
  title: string;
  color: string;
  tasks: Task[];
};

const API_BASE_URL = 'http://127.0.0.1:8000/api';
const TOKEN_STORAGE_KEY = 'tasksapp-token';

const navItems: NavItem[] = [
  { label: 'Painel', icon: LayoutDashboard, active: true },
  { label: 'Quadros', icon: Columns3 },
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
  {
    code: 'DOC',
    title: 'Arquivos',
    description: 'Troca de documentos por tarefa, contrato, empresa ou medicao.',
  },
  {
    code: 'MED',
    title: 'Medicoes',
    description: 'Planilhas de obras, custos, periodos e evidencias de campo.',
  },
  {
    code: 'REB',
    title: 'Reembolsos',
    description: 'Solicitacoes com anexos, aprovacao e historico financeiro.',
  },
  {
    code: 'MSG',
    title: 'Chat',
    description: 'Conversas por tarefa, equipe, contrato ou usuario.',
  },
  {
    code: 'ON',
    title: 'Reunioes',
    description: 'Links para reunioes online e integracao futura com Teams.',
  },
  {
    code: 'XLS',
    title: 'Relatorios',
    description: 'Exportacao Excel para orgaos publicos, custos e produtividade.',
  },
];

const columns: Column[] = [
  {
    title: 'Entrada',
    color: 'bg-sky-400',
    tasks: [
      {
        title: 'Conferir medicao de rocagem em escola municipal',
        context: 'Contrato publico - Zeladoria',
        due: 'Hoje',
        tag: 'XLS',
        priority: 'Alta',
      },
      {
        title: 'Anexar notas para reembolso de equipe de campo',
        context: 'Empresa 04 - Obras',
        due: 'Amanha',
        tag: 'PDF',
        priority: 'Normal',
      },
    ],
  },
  {
    title: 'Em analise',
    color: 'bg-amber-400',
    tasks: [
      {
        title: 'Validar custos de reflorestamento por talhao',
        context: 'Empresa 02 - Reflorestamento',
        due: '21/05',
        tag: 'XLS',
        priority: 'Normal',
      },
    ],
  },
  {
    title: 'Aguardando retorno',
    color: 'bg-violet-400',
    tasks: [
      {
        title: 'Aguardar retorno do fiscal do contrato',
        context: 'Orgao publico - Cemiterios',
        due: '23/05',
        tag: 'Chat',
        priority: 'Media',
      },
    ],
  },
  {
    title: 'Concluido',
    color: 'bg-emerald-400',
    tasks: [
      {
        title: 'Exportar relatorio mensal de manutencao',
        context: 'Empresa 03 - Areas verdes',
        due: 'Ontem',
        tag: 'Excel',
        priority: 'Baixa',
      },
    ],
  },
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

function roleOption(code: string, name: string, hierarchyLevel: number): Role {
  return {
    id: code,
    code,
    name,
    hierarchy_level: hierarchyLevel,
    permissions: {},
    is_system: true,
    is_active: true,
  };
}

function useLocalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return useMemo(
    () => ({
      date: now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      time: now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }),
    [now],
  );
}

async function readApiError(response: Response) {
  try {
    const data = await response.json();
    return data.detail || 'Nao foi possivel concluir a operacao.';
  } catch {
    return 'Nao foi possivel concluir a operacao.';
  }
}

export function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('tasksapp-theme') as Theme) || 'dark',
  );
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY) || '');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'bootstrap'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [loadingSession, setLoadingSession] = useState(Boolean(token));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const clock = useLocalClock();
  const isDark = theme === 'dark';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('tasksapp-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!token) {
      setLoadingSession(false);
      return;
    }

    fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response));
        }
        return response.json() as Promise<AuthUser>;
      })
      .then(setUser)
      .catch(() => {
        setToken('');
        setUser(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
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
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    storeSession((await response.json()) as TokenResponse);
  }

  async function handleBootstrap(name: string, email: string, password: string) {
    setAuthError('');
    const response = await fetch(`${API_BASE_URL}/auth/bootstrap-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    storeSession((await response.json()) as TokenResponse);
  }

  if (loadingSession) {
    return <ShellBackground isDark={isDark}>Carregando sessao...</ShellBackground>;
  }

  if (!user) {
    return (
      <AuthScreen
        authMode={authMode}
        authError={authError}
        authSuccess={authSuccess}
        isDark={isDark}
        setAuthMode={setAuthMode}
        setAuthError={setAuthError}
        onLogin={handleLogin}
        onBootstrap={handleBootstrap}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        theme={theme}
      />
    );
  }

  if (user.must_change_password) {
    return (
      <PasswordChangeScreen
        isDark={isDark}
        user={user}
        token={token}
        onLogout={logout}
        onChanged={setUser}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        theme={theme}
      />
    );
  }

  return (
    <ShellBackground isDark={isDark}>
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside
          className={clsx(
            'relative hidden border-r px-3 py-5 backdrop-blur-xl lg:flex lg:flex-col transition-all duration-300',
            sidebarCollapsed ? 'w-16' : 'w-72',
            isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white/85',
          )}
        >
          {/* Logo + botao recolher */}
          <div
            className={clsx(
              'flex items-center gap-3 px-1 overflow-hidden',
              sidebarCollapsed ? 'justify-center' : 'justify-between',
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo-sangra.png"
                alt="Sangra D'Água"
                className={clsx(
                  'object-contain flex-shrink-0',
                  sidebarCollapsed ? 'h-8 w-8' : 'h-9 w-auto',
                )}
              />
              {!sidebarCollapsed && (
                <h1 className="text-lg font-semibold tracking-normal">TasksApp</h1>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
              className={clsx(
                'grid h-7 w-7 flex-shrink-0 place-items-center rounded-md border transition',
                isDark
                  ? 'border-white/10 text-slate-400 hover:bg-white/10 hover:text-cyan-400'
                  : 'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-cyan-500',
              )}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          {/* FIM LOGO */}

          {/* Nav */}
          <nav className="mt-8 flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon, active }) => (
              <div key={label} className="relative group">
                <button
                  className={clsx(
                    'flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                    sidebarCollapsed && 'justify-center px-0',
                    active
                      ? isDark
                        ? 'bg-white text-slate-950'
                        : 'bg-slate-950 text-white'
                      : isDark
                        ? 'text-slate-300 hover:bg-white/10'
                        : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </button>

                {/* Tooltip quando recolhido */}
                {sidebarCollapsed && (
                  <div
                    className={clsx(
                      'pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg',
                      'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
                      isDark
                        ? 'bg-slate-700 text-slate-100'
                        : 'bg-slate-800 text-white',
                    )}
                  >
                    {label}
                    <span
                      className={clsx(
                        'absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent',
                        isDark ? 'border-r-slate-700' : 'border-r-slate-800',
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header
            className={clsx(
              'flex min-h-20 items-center justify-between gap-4 border-b px-5 backdrop-blur-xl',
              isDark ? 'border-white/10 bg-slate-950/95' : 'border-slate-200 bg-white/85',
            )}
          >
            <div className="min-w-0">
              <p
                className={clsx(
                  'flex items-center gap-2 text-sm capitalize',
                  isDark ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                <CalendarClock size={16} /> {clock.date}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl font-semibold tracking-normal">Painel de Gerenciamento</h2>
                <span
                  className={clsx(
                    'rounded-md border px-2 py-1 text-sm',
                    isDark ? 'border-white/10 text-slate-300' : 'border-slate-200 text-slate-500',
                  )}
                >
                  {clock.time}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'hidden h-10 w-80 items-center gap-2 rounded-md border px-3 md:flex',
                  isDark
                    ? 'border-white/10 bg-slate-900 text-slate-400'
                    : 'border-slate-200 bg-slate-50 text-slate-500',
                )}
              >
                <Search size={17} />
                <span className="text-sm">Pesquisar tarefas, medicoes, contratos ou documentos</span>
              </div>
              <IconButton isDark={isDark} title="Notificacoes">
                <Bell size={18} />
              </IconButton>
              <IconButton
                isDark={isDark}
                title="Alternar tema"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <button
                className={clsx(
                  'flex h-10 items-center gap-3 rounded-md border px-3 text-left transition',
                  isDark
                    ? 'border-white/10 bg-slate-900 hover:bg-slate-800'
                    : 'border-slate-200 bg-white hover:bg-slate-100',
                )}
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-cyan-500 text-xs font-bold text-white">
                  {user.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
              </button>
              <IconButton isDark={isDark} title="Sair" onClick={logout}>
                <LogOut size={18} />
              </IconButton>
            </div>
          </header>

          <section className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Panel key={metric.label} isDark={isDark}>
                <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-normal">{metric.value}</p>
                <p className={clsx('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {metric.caption}
                </p>
              </Panel>
            ))}
          </section>

          {user.role.code === 'master' ? (
            <UserAdminPanel isDark={isDark} token={token} />
          ) : null}

          <section className="grid gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-6">
            {modules.map((module) => (
              <Panel key={module.code} isDark={isDark}>
                <span
                  className={clsx(
                    'grid h-8 w-10 place-items-center rounded-md bg-cyan-500/10 text-xs font-black',
                    isDark ? 'text-cyan-300' : 'text-cyan-500',
                  )}
                >
                  {module.code}
                </span>
                <h3 className="mt-3 font-semibold">{module.title}</h3>
                <p
                  className={clsx(
                    'mt-2 text-sm leading-5',
                    isDark ? 'text-slate-400' : 'text-slate-500',
                  )}
                >
                  {module.description}
                </p>
              </Panel>
            ))}
          </section>

          <KanbanPreview isDark={isDark} />
        </main>
      </div>
    </ShellBackground>
  );
}

function ShellBackground({
  children,
  isDark,
}: {
  children: ReactNode;
  isDark: boolean;
}) {
  return (
    <div
      className={clsx(
        'min-h-screen transition-colors',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-950',
      )}
    >
      {children}
    </div>
  );
}

function IconButton({
  children,
  isDark,
  title,
  onClick,
}: {
  children: ReactNode;
  isDark: boolean;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={clsx(
        'grid h-10 w-10 place-items-center rounded-md border transition',
        isDark
          ? 'border-white/10 bg-slate-900 text-slate-200 hover:bg-slate-800'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  );
}

function Panel({
  children,
  isDark,
  className,
}: {
  children: ReactNode;
  isDark: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border p-4 shadow-sm',
        isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white',
        className,
      )}
    >
      {children}
    </div>
  );
}

function AuthScreen({
  authMode,
  authError,
  authSuccess,
  isDark,
  setAuthMode,
  setAuthError,
  onLogin,
  onBootstrap,
  onToggleTheme,
  theme,
}: {
  authMode: 'login' | 'bootstrap';
  authError: string;
  authSuccess: string;
  isDark: boolean;
  setAuthMode: (mode: 'login' | 'bootstrap') => void;
  setAuthError: (error: string) => void;
  onLogin: (username: string, password: string) => Promise<void>;
  onBootstrap: (name: string, email: string, password: string) => Promise<void>;
  onToggleTheme: () => void;
  theme: Theme;
}) {
  const [name, setName] = useState('Marcelo Inacio');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (authMode === 'bootstrap') {
        await onBootstrap(name, email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Nao foi possivel acessar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ShellBackground isDark={isDark}>
      <div className="grid min-h-screen place-items-center px-5 py-8">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/logo-sangra.png"
                alt="Sangra D'Água"
                className="h-11 w-auto object-contain"
              />
              <div>
                <p className={clsx('text-xs leading-tight', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  Grupo Empresarial Sangra D'Água
                </p>
                <h1 className="text-xl font-semibold">TasksApp</h1>
              </div>
            </div>
            <IconButton isDark={isDark} title="Alternar tema" onClick={onToggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </div>

          <Panel isDark={isDark}>
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-500/10 text-cyan-300">
                {authMode === 'bootstrap' ? <ShieldCheck size={20} /> : <KeyRound size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {authMode === 'bootstrap' ? 'Criar usuario master' : 'Entrar no sistema'}
                </h2>
                <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  {authMode === 'bootstrap'
                    ? 'Disponivel apenas antes do primeiro usuario.'
                    : 'Use seu nome de usuario e senha.'}
                </p>
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {authMode === 'bootstrap' ? (
                <TextField
                  label="Nome"
                  value={name}
                  onChange={setName}
                  isDark={isDark}
                  autoComplete="name"
                />
              ) : null}

              {authMode === 'login' ? (
                <TextField
                  label="Nome de usuario"
                  value={email}
                  onChange={setEmail}
                  isDark={isDark}
                  type="text"
                  autoComplete="username"
                />
              ) : (
                <TextField
                  label="E-mail"
                  value={email}
                  onChange={setEmail}
                  isDark={isDark}
                  type="email"
                  autoComplete="email"
                />
              )}

              <TextField
                label="Senha"
                value={password}
                onChange={setPassword}
                isDark={isDark}
                type="password"
                autoComplete={authMode === 'bootstrap' ? 'new-password' : 'current-password'}
              />

              {authError ? <Alert tone="error">{authError}</Alert> : null}
              {authSuccess ? <Alert tone="success">{authSuccess}</Alert> : null}

              <button
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Aguarde...' : authMode === 'bootstrap' ? 'Criar master' : 'Entrar'}
              </button>
            </form>

            <button
              className={clsx(
                'mt-4 w-full rounded-md border px-3 py-2 text-sm transition',
                isDark
                  ? 'border-white/10 text-slate-300 hover:bg-white/10'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100',
              )}
              onClick={() => {
                setAuthError('');
                setAuthMode(authMode === 'login' ? 'bootstrap' : 'login');
              }}
            >
              {authMode === 'login' ? 'Criar primeiro master' : 'Voltar para login'}
            </button>
          </Panel>
        </div>
      </div>
    </ShellBackground>
  );
}

function PasswordChangeScreen({
  isDark,
  user,
  token,
  onLogout,
  onChanged,
  onToggleTheme,
  theme,
}: {
  isDark: boolean;
  user: AuthUser;
  token: string;
  onLogout: () => void;
  onChanged: (user: AuthUser) => void;
  onToggleTheme: () => void;
  theme: Theme;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('A confirmacao da senha nao confere.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
      onChanged((await response.json()) as AuthUser);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Nao foi possivel alterar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ShellBackground isDark={isDark}>
      <div className="grid min-h-screen place-items-center px-5 py-8">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">TasksApp</h1>
              <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {user.name} - {user.role.name}
              </p>
            </div>
            <div className="flex gap-2">
              <IconButton isDark={isDark} title="Alternar tema" onClick={onToggleTheme}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </IconButton>
              <IconButton isDark={isDark} title="Sair" onClick={onLogout}>
                <LogOut size={18} />
              </IconButton>
            </div>
          </div>

          <Panel isDark={isDark}>
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-500/10 text-cyan-300">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Alterar senha inicial</h2>
                <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  A senha padrao deve ser substituida antes do uso.
                </p>
              </div>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <TextField
                label="Senha atual"
                value={currentPassword}
                onChange={setCurrentPassword}
                isDark={isDark}
                type="password"
              />
              <TextField
                label="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
                isDark={isDark}
                type="password"
              />
              <TextField
                label="Confirmar nova senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                isDark={isDark}
                type="password"
              />

              {error ? <Alert tone="error">{error}</Alert> : null}

              <button
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </ShellBackground>
  );
}

function UserAdminPanel({ isDark, token }: { isDark: boolean; token: string }) {
  const [roles, setRoles] = useState<Role[]>(roleFallback);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('analista');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function apiGet<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(await readApiError(response));
    }
    return response.json() as Promise<T>;
  }

  async function loadAdminData() {
    try {
      const [loadedRoles, loadedUsers] = await Promise.all([
        apiGet<Role[]>('/auth/roles'),
        apiGet<AuthUser[]>('/auth/users'),
      ]);
      setRoles(loadedRoles);
      setUsers(loadedUsers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar dados.');
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, role_code: roleCode }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }
      const data = (await response.json()) as { user: AuthUser; temporary_password: string };
      setUsers((current) => [data.user, ...current]);
      setName('');
      setEmail('');
      setRoleCode('analista');
      setMessage(`Usuario criado com nome de usuario "${data.user.username}" e senha padrao ${data.temporary_password}.`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Nao foi possivel criar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="grid gap-4 px-5 pb-5 xl:grid-cols-[minmax(360px,420px)_1fr]">
      <Panel isDark={isDark}>
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-500/10 text-cyan-300">
            <UserPlus size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Cadastrar usuario</h3>
            <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
              Senha inicial gerada automaticamente
            </p>
          </div>
        </div>

        <form className="grid gap-3" onSubmit={handleCreateUser}>
          <TextField label="Nome" value={name} onChange={setName} isDark={isDark} />
          <TextField
            label="E-mail"
            value={email}
            onChange={setEmail}
            isDark={isDark}
            type="email"
          />
          <label className="grid gap-1 text-sm">
            <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Perfil</span>
            <select
              value={roleCode}
              onChange={(event) => setRoleCode(event.target.value)}
              className={clsx(
                'h-10 rounded-md border px-3 outline-none transition focus:border-cyan-400',
                isDark
                  ? 'border-white/10 bg-slate-950 text-slate-100'
                  : 'border-slate-200 bg-white text-slate-950',
              )}
            >
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <Alert tone="error">{error}</Alert> : null}
          {message ? <Alert tone="success">{message}</Alert> : null}

          <button
            disabled={submitting}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={18} /> {submitting ? 'Criando...' : 'Criar usuario'}
          </button>
        </form>
      </Panel>

      <Panel isDark={isDark}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Usuarios cadastrados</h3>
            <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
              {users.length} registro(s)
            </p>
          </div>
          <ShieldCheck size={20} className={isDark ? 'text-cyan-300' : 'text-cyan-600'} />
        </div>

        <div className="grid gap-2">
          {users.map((item) => (
            <div
              key={item.id}
              className={clsx(
                'flex items-center justify-between gap-3 rounded-md border px-3 py-2',
                isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50',
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.name}</p>
                <p className={clsx('truncate text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                  @{item.username} - {item.email}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={clsx(
                    'rounded-md px-2 py-1 text-xs',
                    item.role.code === 'master'
                      ? 'bg-cyan-500 text-white'
                      : isDark
                        ? 'bg-white/10 text-slate-300'
                        : 'bg-slate-200 text-slate-700',
                  )}
                >
                  {item.role.name}
                </span>
                {item.must_change_password ? (
                  <p className="mt-1 text-xs text-amber-300">Troca pendente</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  isDark,
  type = 'text',
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{label}</span>
      <input
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={clsx(
          'h-10 rounded-md border px-3 outline-none transition focus:border-cyan-400',
          isDark
            ? 'border-white/10 bg-slate-950 text-slate-100'
            : 'border-slate-200 bg-white text-slate-950',
        )}
      />
    </label>
  );
}

function Alert({ children, tone }: { children: ReactNode; tone: 'error' | 'success' }) {
  return (
    <div
      className={clsx(
        'rounded-md border px-3 py-2 text-sm',
        tone === 'error'
          ? 'border-rose-400/30 bg-rose-500/10 text-rose-200'
          : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
      )}
    >
      {children}
    </div>
  );
}

function KanbanPreview({ isDark }: { isDark: boolean }) {
  return (
    <section className="min-h-0 flex-1 px-5 pb-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Quadro principal</h3>
          <p className={clsx('text-sm', isDark ? 'text-slate-400' : 'text-slate-500')}>
            Fluxo demonstrativo para contratos publicos, obras e servicos recorrentes.
          </p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400">
          <Plus size={18} /> Nova tarefa
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        {columns.map((column) => (
          <div
            key={column.title}
            className={clsx(
              'min-h-96 rounded-lg border p-3',
              isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white/70',
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={clsx('h-2.5 w-2.5 rounded-full', column.color)} />
                <h4 className="font-semibold">{column.title}</h4>
              </div>
              <span
                className={clsx(
                  'rounded-md px-2 py-1 text-xs',
                  isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-500',
                )}
              >
                {column.tasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {column.tasks.map((task) => (
                <article
                  key={task.title}
                  className={clsx(
                    'rounded-lg border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel',
                    isDark ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h5 className="text-sm font-semibold leading-5">{task.title}</h5>
                    <span
                      className={clsx(
                        'rounded-md border px-2 py-1 text-xs',
                        isDark
                          ? 'border-white/10 text-slate-300'
                          : 'border-slate-200 text-slate-500',
                      )}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p className={clsx('mt-3 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
                    {task.context}
                  </p>
                  <div
                    className={clsx(
                      'mt-3 flex items-center justify-between text-xs',
                      isDark ? 'text-slate-400' : 'text-slate-500',
                    )}
                  >
                    <span>{task.due}</span>
                    <span
                      className={clsx(
                        'rounded-md px-2 py-1',
                        isDark ? 'bg-white/10' : 'bg-slate-100',
                      )}
                    >
                      {task.tag}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}