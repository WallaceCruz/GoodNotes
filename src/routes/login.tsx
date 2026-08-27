import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar - Lembrei!" },
      {
        name: "description",
        content: "Entre na sua conta Lembrei! para organizar notas autoadesivas e tarefas.",
      },
      { property: "og:title", content: "Entrar - Lembrei!" },
      {
        property: "og:description",
        content: "Entre na sua conta Lembrei! para organizar notas autoadesivas e tarefas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return null;
}
