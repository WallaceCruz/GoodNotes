import { Component, type ErrorInfo, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";

/**
 * Isola falhas do editor de texto.
 *
 * Sem isto, uma exceção dentro do Tiptap sobe até o limite da rota e leva o
 * quadro inteiro junto — o usuário perde o contexto por causa de uma nota. Aqui
 * a nota vira um aviso com "tentar de novo" e o resto do quadro segue de pé; o
 * conteúdo não se perde, porque ele já está no estado do quadro, não no editor.
 */
export class EditorBoundary extends Component<
  { children: ReactNode; fallbackText?: string },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[nota] editor falhou:", error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="rounded-lg border border-dashed border-destructive/50 bg-destructive/5 p-3 text-xs text-muted-foreground">
        <p>{this.props.fallbackText ?? "Não foi possível abrir o editor desta nota."}</p>
        <button
          type="button"
          onClick={() => this.setState({ failed: false })}
          className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-accent"
        >
          <RotateCcw className="h-3 w-3" />
          Tentar de novo
        </button>
      </div>
    );
  }
}
