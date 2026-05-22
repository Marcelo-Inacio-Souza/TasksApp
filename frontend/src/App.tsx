import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarClock,
  CheckCircle2,
  Columns3,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Plus,
  ReceiptText,
  Search,
  Settings,
  Sun,
  Users,
  Video,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type Theme = 'dark' | 'light';

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

export function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('tasksapp-theme') as Theme) || 'dark',
  );
  const clock = useLocalClock();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('tasksapp-theme', theme);
  }, [theme]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 transition-colors dark:bg-[#080b12] dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-slate-200 bg-white/85 px-4 py-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 lg:block">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-500 text-sm font-black text-white shadow-lg shadow-cyan-500/25">
              TA
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Grupo empresarial</p>
              <h1 className="text-lg font-semibold tracking-normal">TasksApp</h1>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                key={label}
                className={clsx(
                  'flex h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                  active
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm capitalize text-slate-500 dark:text-slate-400">
                <CalendarClock size={16} /> {clock.date}
              </p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl font-semibold tracking-normal">Painel operacional</h2>
                <span className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-500 dark:border-white/10 dark:text-slate-300">
                  {clock.time}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden h-10 w-80 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-400 md:flex">
                <Search size={17} />
                <span className="text-sm">Pesquisar tarefas, medicoes, contratos ou documentos</span>
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10">
                <Bell size={18} />
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-200 dark:hover:bg-white/10"
                title="Alternar tema"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="flex h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-left transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/10">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-cyan-500 text-xs font-bold text-white">
                  MI
                </span>
                <span className="hidden text-sm font-medium sm:inline">Marcelo Inacio</span>
              </button>
            </div>
          </header>

          <section className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.06]"
              >
                <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-normal">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.caption}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-3 px-5 pb-5 md:grid-cols-2 xl:grid-cols-6">
            {modules.map((module) => (
              <div
                key={module.code}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.05]"
              >
                <span className="grid h-8 w-10 place-items-center rounded-md bg-cyan-500/10 text-xs font-black text-cyan-500 dark:text-cyan-300">
                  {module.code}
                </span>
                <h3 className="mt-3 font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {module.description}
                </p>
              </div>
            ))}
          </section>

          <section className="min-h-0 flex-1 px-5 pb-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Quadro principal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
                  className="min-h-96 rounded-lg border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.05]"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={clsx('h-2.5 w-2.5 rounded-full', column.color)} />
                      <h4 className="font-semibold">{column.title}</h4>
                    </div>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-300">
                      {column.tasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {column.tasks.map((task) => (
                      <article
                        key={task.title}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-panel dark:border-white/10 dark:bg-slate-950/70"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h5 className="text-sm font-semibold leading-5">{task.title}</h5>
                          <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 dark:border-white/10 dark:text-slate-300">
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          {task.context}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{task.due}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-white/10">
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
        </main>
      </div>
    </div>
  );
}
