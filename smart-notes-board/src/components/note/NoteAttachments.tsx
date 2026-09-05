import { useRef, useState } from "react";
import { Download, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { boardActions } from "@/stores/board";
import { formatBytes } from "@/lib/board/attachments";
import { MAX_ATTACHMENT_BYTES, deleteFile, downloadFile, putFile } from "@/lib/attachment-files";
import { uid } from "@/lib/id";
import { cn } from "@/lib/utils";
import type { NoteAttachment } from "@/lib/board/model";

function AttachmentRow({
  attachment,
  onRemove,
}: {
  attachment: NoteAttachment;
  onRemove: () => void;
}) {
  return (
    <li className="group/anexo flex items-center gap-2 px-3 py-2">
      <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium">{attachment.name}</p>
        <p className="text-[10px] text-muted-foreground">{formatBytes(attachment.size)}</p>
      </div>
      <button
        onClick={() => {
          void downloadFile(attachment.id, attachment.name).then((ok) => {
            if (!ok) toast.error("Arquivo não encontrado neste navegador");
          });
        }}
        aria-label={`Baixar ${attachment.name}`}
        title="Baixar"
        className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onRemove}
        aria-label={`Remover ${attachment.name}`}
        title="Remover"
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover/anexo:opacity-100"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/**
 * Anexos de uma nota.
 *
 * O arquivo vai para o IndexedDB e a nota guarda só o registro dele — ver
 * `lib/attachment-files.ts` para o porquê.
 */
export function NoteAttachments({
  noteId,
  attachments,
  compact = false,
}: {
  noteId: string;
  attachments: NoteAttachment[];
  /** Versão reduzida, para o rodapé do card. */
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  const anexar = async (files: FileList | null) => {
    if (!files?.length) return;
    setEnviando(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          toast.error(`"${file.name}" passa de ${formatBytes(MAX_ATTACHMENT_BYTES)}`);
          continue;
        }
        const id = uid();
        await putFile(id, file);
        boardActions.addAttachment(noteId, {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          addedAt: Date.now(),
        });
      }
    } catch {
      toast.error("Não foi possível guardar o anexo neste navegador");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remover = (attachment: NoteAttachment) => {
    boardActions.removeAttachment(noteId, attachment.id);
    void deleteFile(attachment.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={attachments.length ? `Anexos (${attachments.length})` : "Anexar arquivo"}
          title={attachments.length ? `${attachments.length} anexo(s)` : "Anexar arquivo"}
          // O card é arrastável: sem barrar o pointerdown, o dnd-kit inicia um
          // arraste e o clique nunca chega a abrir o painel.
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full border border-dashed border-foreground/25 px-1.5 py-0.5 text-foreground/50 transition hover:border-foreground/40 hover:bg-foreground/5 hover:text-foreground/80",
            compact ? "text-[10px]" : "text-[11px]",
            attachments.length > 0 && "border-solid border-foreground/20 text-foreground/70",
          )}
        >
          <Paperclip className="h-2.5 w-2.5" />
          {attachments.length > 0 ? attachments.length : "anexar"}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[20rem] p-0"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
          <span className="text-[13px] font-semibold">Anexos</span>
          {attachments.length > 0 && (
            <span className="text-[11px] text-muted-foreground">{attachments.length}</span>
          )}
        </div>

        {attachments.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
            Nenhum arquivo anexado ainda.
          </p>
        ) : (
          <ul className="scroll-thin max-h-56 divide-y divide-border overflow-y-auto">
            {attachments.map((attachment) => (
              <AttachmentRow
                key={attachment.id}
                attachment={attachment}
                onRemove={() => remover(attachment)}
              />
            ))}
          </ul>
        )}

        <div className="border-t border-border p-2">
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => void anexar(event.target.files)}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            {enviando ? "Guardando…" : "Escolher arquivo"}
          </button>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Até {formatBytes(MAX_ATTACHMENT_BYTES)} por arquivo, guardado neste navegador.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
