import { useMemo, useRef, useState } from "react";
import { sanitizeHtml } from "@/lib/html";
import { cn } from "@/lib/utils";
import { ImageLightbox } from "@/components/note/ImageLightbox";

/**
 * Único ponto do app que injeta HTML de nota na página.
 *
 * Antes eram cinco `dangerouslySetInnerHTML` espalhados, cada um confiando no
 * conteúdo gravado. Concentrar aqui significa que a sanitização não pode ser
 * esquecida ao criar a próxima tela que mostra uma nota.
 *
 * Com `zoomable`, clicar numa imagem abre a visualização em tela cheia. É
 * opcional porque em superfícies que já respondem ao toque como um todo (a
 * carta do deck no celular, a prévia arrastada) o clique na imagem competiria
 * com o gesto da superfície — e um cursor de lupa que não amplia nada é pior
 * do que não ter lupa.
 */
export function NoteRichContent({
  html,
  className,
  fallback = "",
  zoomable = false,
}: {
  html: string | null | undefined;
  className?: string;
  /** Marcação usada quando a nota está vazia (o editor espera um parágrafo). */
  fallback?: string;
  /** Clicar numa imagem abre o visualizador em tela cheia. */
  zoomable?: boolean;
}) {
  const safeHtml = useMemo(() => sanitizeHtml(html) || fallback, [html, fallback]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [album, setAlbum] = useState<{ images: string[]; index: number } | null>(null);

  /**
   * O álbum é montado a partir dos elementos renderizados, não do texto do HTML:
   * a `src` que o DOM devolve é a versão resolvida da URL e nem sempre coincide
   * caractere a caractere com o que estava no atributo, então procurar por
   * string acabava não encontrando a imagem clicada.
   */
  const openImage = (event: React.MouseEvent) => {
    if (!zoomable) return;
    const target = event.target as HTMLElement;
    if (target.tagName !== "IMG") return;

    const images = Array.from(containerRef.current?.querySelectorAll("img") ?? []);
    const index = images.indexOf(target as HTMLImageElement);
    if (index < 0) return;

    // A imagem vive dentro de cards que reagem ao clique (abrir a nota, entrar
    // em edição); sem isto, ampliar dispararia essas ações por baixo.
    event.stopPropagation();
    setAlbum({ images: images.map((image) => image.src), index });
  };

  return (
    <>
      <div
        ref={containerRef}
        {...(zoomable ? { "data-zoomable": "" } : {})}
        className={cn(className)}
        onClick={openImage}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {album && (
        <ImageLightbox
          images={album.images}
          index={album.index}
          onIndexChange={(index) => setAlbum((current) => current && { ...current, index })}
          onClose={() => setAlbum(null)}
        />
      )}
    </>
  );
}
