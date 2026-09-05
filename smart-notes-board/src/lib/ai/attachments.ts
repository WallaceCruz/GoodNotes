import type Anthropic from "@anthropic-ai/sdk";
import { getFile } from "@/lib/attachment-files";
import { formatBytes } from "@/lib/board/attachments";
import type { NoteAttachment } from "@/lib/board/model";

/**
 * Os anexos da nota entrando na conversa.
 *
 * Sem isto o modelo veria só os nomes dos arquivos e responderia sobre eles no
 * escuro. PDF vai como documento, que a API sabe ler; texto vai como texto. O
 * resto (imagem, binário) não vira bloco — dizer "não consigo abrir este
 * formato" é melhor que mandar bytes que o modelo não entende.
 */

/** Acima disto o anexo sozinho dominaria a janela de contexto. */
const MAX_INLINE_BYTES = 4 * 1024 * 1024;

const TEXTUAIS = [
  "text/",
  "application/json",
  "application/xml",
  "application/javascript",
  "application/x-yaml",
];

function ehTexto(type: string, name: string): boolean {
  if (TEXTUAIS.some((prefixo) => type.startsWith(prefixo))) return true;
  return /\.(txt|md|csv|tsv|json|xml|ya?ml|log|ts|tsx|js|jsx|css|html?)$/i.test(name);
}

async function paraBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binario = "";
  const bytes = new Uint8Array(buffer);
  // Em pedaços: `String.fromCharCode(...bytes)` estoura a pilha em arquivos grandes.
  for (let i = 0; i < bytes.length; i += 8192) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binario);
}

export type AttachmentBlocks = {
  blocks: Anthropic.ContentBlockParam[];
  /** Anexos que não puderam entrar, para o painel avisar em vez de omitir. */
  skipped: string[];
};

/** Converte os anexos em blocos de conteúdo para a mensagem. */
export async function attachmentBlocks(attachments: NoteAttachment[]): Promise<AttachmentBlocks> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  const skipped: string[] = [];

  for (const anexo of attachments) {
    if (anexo.size > MAX_INLINE_BYTES) {
      skipped.push(`${anexo.name} (${formatBytes(anexo.size)}, grande demais)`);
      continue;
    }

    const arquivo = await getFile(anexo.id);
    if (!arquivo) {
      skipped.push(`${anexo.name} (não está neste navegador)`);
      continue;
    }

    if (anexo.type === "application/pdf") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: await paraBase64(arquivo) },
        title: anexo.name,
      });
      continue;
    }

    if (ehTexto(anexo.type, anexo.name)) {
      blocks.push({
        type: "text",
        text: `<anexo nome="${anexo.name}">\n${await arquivo.text()}\n</anexo>`,
      });
      continue;
    }

    skipped.push(`${anexo.name} (formato ${anexo.type || "desconhecido"})`);
  }

  return { blocks, skipped };
}

/**
 * O mesmo, para arquivos que a pessoa solta no chat.
 *
 * Estes não passam pelo IndexedDB: são da conversa, não da nota, e viram
 * blocos direto do `File`. Por isso também não sobrevivem a recarregar a
 * página — anexar de novo é mais barato que guardar megabytes por conversa.
 */
export async function fileBlocks(files: File[]): Promise<AttachmentBlocks> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  const skipped: string[] = [];

  for (const arquivo of files) {
    if (arquivo.size > MAX_INLINE_BYTES) {
      skipped.push(`${arquivo.name} (${formatBytes(arquivo.size)}, grande demais)`);
      continue;
    }

    if (arquivo.type === "application/pdf") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: await paraBase64(arquivo) },
        title: arquivo.name,
      });
      continue;
    }

    if (ehTexto(arquivo.type, arquivo.name)) {
      blocks.push({
        type: "text",
        text: `<anexo nome="${arquivo.name}">\n${await arquivo.text()}\n</anexo>`,
      });
      continue;
    }

    skipped.push(`${arquivo.name} (formato ${arquivo.type || "desconhecido"})`);
  }

  return { blocks, skipped };
}
