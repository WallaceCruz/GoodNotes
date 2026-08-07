import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, FileText, Folder, Layers } from "lucide-react";
import { useState } from "react";
import { AppSidebar } from "@/components/kanban/AppSidebar";
import { InboxList } from "@/components/kanban/InboxList";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { NoteEditorPanel } from "@/components/kanban/NoteEditorPanel";
import { useBoardStore } from "@/hooks/useBoardStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sticky Flow - Kanban de notas autoadesivas" },
      {
        name: "description",
        content:
          "Organize projetos, arquivos e notas autoadesivas em um kanban com inbox, colunas editáveis e subnotas coloridas.",
      },
      { property: "og:title", content: "Sticky Flow - Kanban de notas autoadesivas" },
      {
        property: "og:description",
        content:
          "Quadro kanban com notas adesivas, inbox de notas, projetos e arquivos, tudo salvo no navegador.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const store = useBoardStore();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const inboxNotes = (store.project?.files ?? [])
    .flatMap((f) => f.notes)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const activeNote =
    (store.project?.files ?? []).flatMap((f) => f.notes).find((n) => n.id === activeNoteId) ?? null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {!store.hydrated ? null : (
        <>
      <AppSidebar store={store} />


      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-sm">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Meu Workspace</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{store.project?.name ?? "-"}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h1 className="font-semibold">{store.file?.name ?? "Sem arquivo"}</h1>
        </header>

        <div className="flex min-h-0 flex-1">
          <InboxList notes={inboxNotes} activeId={activeNoteId} onSelect={setActiveNoteId} />
          <KanbanBoard store={store} activeNoteId={activeNoteId} onOpenNote={setActiveNoteId} />
          {activeNote && (
            <NoteEditorPanel
              note={activeNote}
              onClose={() => setActiveNoteId(null)}
              onChange={(patch) => store.updateNote(activeNote.id, patch)}
              onAddSubnote={(text, color) => store.addSubnote(activeNote.id, text, color)}
              onUpdateSubnote={(subId, text) => store.updateSubnote(activeNote.id, subId, text)}
              onRemoveSubnote={(subId) => store.removeSubnote(activeNote.id, subId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
