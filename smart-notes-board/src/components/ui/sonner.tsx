import { Toaster as Sonner, toast } from "sonner";
import { setNotifier, type Notifier } from "@/lib/notify";

/**
 * O desenho dos avisos, e a única ligação com o `sonner`.
 *
 * A ligação acontece dentro do `<Toaster />`, não no topo do módulo: o
 * `package.json` declara `sideEffects: false`, então uma chamada solta aqui
 * fora pode ser descartada pelo empacotador — e os avisos sumiriam calados só
 * no build de produção. Dentro do componente ela é código executado, não efeito
 * de importação, e não há como montar um sem o outro.
 */

const sonnerNotifier: Notifier = {
  show: (message, options) => {
    toast(message, { description: options?.description });
  },
  success: (message, options) => {
    toast.success(message, { description: options?.description });
  },
  error: (message, options) => {
    toast.error(message, { description: options?.description });
  },
  undo: (message, onUndo, options) => {
    toast.success(message, {
      description: options?.description,
      action: { label: "Desfazer", onClick: onUndo },
    });
  },
};

type ToasterProps = React.ComponentProps<typeof Sonner>;

let ligado = false;

const Toaster = ({ ...props }: ToasterProps) => {
  // Idempotente e sem estado de React: só aponta o `notify` para o `sonner`.
  if (!ligado) {
    ligado = true;
    setNotifier(sonnerNotifier);
  }

  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
