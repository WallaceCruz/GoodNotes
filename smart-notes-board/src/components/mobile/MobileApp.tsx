import { useMemo, useState } from "react";
import { Archive, CalendarDays, Folder, Plus, Search, StickyNote, X } from "lucide-react";
import { boardActions, useActiveFile, useFileColumns, useFileTags } from "@/stores/board";
import { emptyFilters, type Filters } from "@/lib/board/filters";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/app/UserMenu";
import { FiltersMenu } from "@/components/kanban/FiltersMenu";
import { NotificationsMenu } from "@/components/kanban/NotificationsMenu";
import { MobileArchived } from "./MobileArchived";
import { MobileCalendar } from "./MobileCalendar";
import { MobileNoteList } from "./MobileNoteList";
import { MobileNoteScreen } from "./MobileNoteScreen";
import { MobileProjectsSheet } from "./MobileProjectsSheet";

type MobileTab = "notas" | "calendario" | "arquivadas";

const TABS = [
  { id: "notas", label: "Notas", icon: StickyNote },
  { id: "calendario", label: "Calendário", icon: CalendarDays },
  { id: "arquivadas", label: "Arquivadas", icon: Archive },
] as const satisfies ReadonlyArray<{ id: MobileTab; label: string; icon: typeof StickyNote }>;

/**
 * O app no celular.
 *
 * Não é o quadro espremido: colunas lado a lado exigem largura que o telefone
 * não tem, e arrastar cards entre elas com o polegar é impreciso. Aqui as notas
 * viram uma agenda de tarefas, agrupada por prazo, com um calendário ao lado —
 * o fluxo do kanban continua acessível pelo campo "Coluna" na tela da nota.
 */
export function MobileApp() {
  const [tab, setTab] = useState<MobileTab>("notas");
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  const activeFile = useActiveFile();
  const columns = useFileColumns();
  const fileTags = useFileTags();

  const notes = useMemo(() => activeFile?.notes ?? [], [activeFile]);

  const allTags = useMemo(
    () =>
      Array.from(
        new Set([...fileTags.map((tag) => tag.name), ...notes.flatMap((note) => note.tags)]),
      ).sort(),
    [fileTags, notes],
  );
  const openNote = notes.find((note) => note.id === openNoteId) ?? null;

  const createNote = () => {
    const columnId = columns[0]?.id;
    if (!columnId) return;
    setOpenNoteId(boardActions.addNote(columnId));
  };

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          {/* A busca ocupa a linha: e' o controle mais usado, e no polegar um
              campo largo erra menos que um icone. Sino e avatar ficam ao lado,
              como alvos redondos de tamanho confortavel. */}
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-muted px-3.5 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
              placeholder="Buscar nas notas"
              aria-label="Buscar nas notas"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
            />
            {filters.query && (
              <button
                onClick={() => setFilters({ ...filters, query: "" })}
                aria-label="Limpar busca"
                className="shrink-0"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Os tres ocupam o mesmo alvo de 40px e dividem o mesmo eixo, para
              a faixa nao ficar com controles de alturas diferentes. */}
          <FiltersMenu filters={filters} allTags={allTags} compact onChange={setFilters} />
          <NotificationsMenu notes={notes} withInbox compact onSelect={setOpenNoteId} />
          <UserMenu size="lg" />
        </div>
      </header>

      {tab === "notas" && (
        <MobileNoteList
          notes={notes}
          columns={columns}
          filters={filters}
          onOpenNote={setOpenNoteId}
        />
      )}
      {tab === "calendario" && (
        <MobileCalendar
          notes={notes}
          columns={columns}
          filters={filters}
          onOpenNote={setOpenNoteId}
        />
      )}
      {tab === "arquivadas" && (
        <MobileArchived notes={notes} filters={filters} onOpenNote={setOpenNoteId} />
      )}

      {/*
        Barra flutuante: solta do rodapé, ela deixa a lista correr por baixo em
        vez de terminar numa borda dura, e o polegar alcança as ações sem
        esticar até o fim da tela. O respiro embaixo respeita a área segura do
        aparelho.
      */}
      {/*
        Criar nota e' a acao principal e nao pertence a barra de navegacao: la
        ela competiria por espaco com os destinos e teria o mesmo tamanho deles.
        Solta e acima, ganha alvo maior e fica no canto onde o polegar alcanca
        sem atravessar a tela. A altura vem da barra (2.5rem de botao + 0.75rem
        de moldura) mais o respiro entre as duas.
      */}
      <button
        onClick={createNote}
        aria-label="Nova nota"
        title="Nova nota"
        className="absolute bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4rem)] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-popover/90 p-1.5 shadow-lg backdrop-blur-md">
          <button
            onClick={() => setProjectsOpen(true)}
            aria-label="Projetos"
            title="Projetos"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <Folder className="h-[18px] w-[18px]" />
          </button>

          {/* Só ícones: seis rótulos não caberiam em 375px sem espremer os
              alvos de toque. O nome da visão ativa fica no cabeçalho. */}
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-label={label}
              title={label}
              aria-pressed={tab === id}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}
        </div>
      </nav>

      {projectsOpen && <MobileProjectsSheet onClose={() => setProjectsOpen(false)} />}

      {openNote && <MobileNoteScreen note={openNote} onClose={() => setOpenNoteId(null)} />}
    </div>
  );
}
