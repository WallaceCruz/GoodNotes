/**
 * Os arquivos dos anexos.
 *
 * Ficam no IndexedDB, e não no armazenamento local junto do quadro, por um
 * motivo concreto: o quadro inteiro é serializado num único texto a cada
 * gravação, e um PDF de poucos megabytes estouraria a cota — momento em que o
 * app para de salvar *tudo* em silêncio, notas e comentários junto. Aqui os
 * binários ficam à parte, com cota própria e muito maior.
 *
 * O quadro guarda só os metadados (`NoteAttachment`); este módulo guarda o
 * conteúdo, endereçado pelo mesmo id.
 */

const DB_NAME = "goodnotes-attachments";
const STORE = "files";
const VERSION = 1;

/** Acima disto o navegador engasga e a espera não compensa. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = run(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export function putFile(id: string, file: Blob): Promise<unknown> {
  return transact("readwrite", (store) => store.put(file, id));
}

export function getFile(id: string): Promise<Blob | undefined> {
  return transact<Blob | undefined>("readonly", (store) => store.get(id));
}

export function deleteFile(id: string): Promise<unknown> {
  return transact("readwrite", (store) => store.delete(id));
}

/** Entrega o arquivo ao usuário, com o nome original. */
export async function downloadFile(id: string, name: string): Promise<boolean> {
  const file = await getFile(id);
  if (!file) return false;

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  // Revogar cedo demais cancela o download em alguns navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
