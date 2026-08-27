import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUp, Github } from "lucide-react";
import { BrandLogo } from "@/components/kanban/BrandLogo";
import bgImage from "@/assets/kanban-sticky-bg.jpg";

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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.36 1.43c.04 1.06-.36 2.06-1 2.83-.7.83-1.82 1.47-2.92 1.39-.05-1.03.42-2.06 1.06-2.78.72-.8 1.92-1.4 2.86-1.44ZM20.5 17.36c-.55 1.28-.82 1.85-1.53 2.99-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.01-3.05-1.76-4.04-3.32C-.3 16.6-.55 11.4 2.07 8.62c1.5-1.6 3.06-2.55 4.5-2.55 1.48 0 2.41.82 3.64.82 1.19 0 1.91-.82 3.63-.82 1.3 0 2.68.71 3.92 1.94-3.45 1.89-2.89 6.81.74 8.35Z" />
    </svg>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [lastUsed] = useState<"google" | null>("google");

  return (
    <div className="flex min-h-screen w-full bg-white text-zinc-900">
      {/* Left pane — login form */}
      <div className="flex w-full max-w-[480px] shrink-0 flex-col px-8 py-10 sm:px-12">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[360px]">
            {/* Brand */}
            <div className="mb-10 flex items-center gap-2">
              <BrandLogo />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Entrar
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Bem-vindo de volta. Entre para continuar organizando.
            </p>

            {/* Social login — pill buttons */}
            <div className="mt-8 flex flex-col gap-3">
              <div className="relative">
                <SocialButton onClick={() => {}}>
                  <GoogleIcon className="h-5 w-5" />
                  Continuar com Google
                </SocialButton>
                {lastUsed === "google" && (
                  <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                    Usado pela última vez
                  </span>
                )}
              </div>

              <SocialButton onClick={() => {}}>
                <Github className="h-5 w-5" />
                Continuar com GitHub
              </SocialButton>

              <SocialButton onClick={() => {}}>
                <AppleIcon className="h-5 w-5" />
                Continuar com Apple
              </SocialButton>
            </div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <span className="h-px flex-1 bg-zinc-200" />
              <span className="text-xs text-zinc-400">ou</span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>

            {/* Email */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-zinc-700"
                >
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="h-12 w-full rounded-full border border-zinc-200 bg-white px-5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>

              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 active:scale-[0.99]"
              >
                Continuar
              </button>
            </form>

            {/* Footer links */}
            <div className="mt-8 flex flex-col gap-4">
              <p className="text-center text-sm text-zinc-500">
                Não tem uma conta?{" "}
                <Link
                  to="/login"
                  className="font-medium text-zinc-900 underline underline-offset-4 hover:text-zinc-700"
                >
                  Crie sua conta
                </Link>
              </p>

              <p className="text-center text-xs text-zinc-400">
                SSO disponível nos planos Business e Enterprise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right pane — kanban de notas autoadesivas */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <img
          src={bgImage}
          alt="Kanban de notas autoadesivas Lembrei!"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-white/5 to-zinc-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.25),transparent_60%)]" />

        <div className="relative flex h-full items-end justify-center p-12">
          <div className="w-full max-w-xl pb-12">
            <div className="mb-6 text-center">
              <BrandLogo className="justify-center [&_span]:text-white" />
              <p className="mt-4 text-2xl font-semibold text-white drop-shadow-sm">
                Suas notas e tarefas, organizadas.
              </p>
              <p className="mt-1.5 text-sm text-white/80">
                Quadros kanban com notas autoadesivas para você não esquecer.
              </p>
            </div>

            {/* Prompt pill */}
            <div className="flex items-center gap-2 rounded-full border border-white/30 bg-white/95 py-2 pl-5 pr-2 shadow-2xl backdrop-blur">
              <input
                type="text"
                placeholder="Crie sua primeira nota autoadesiva..."
                className="flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={() => {}}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90 active:scale-95"
                aria-label="Enviar"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-white/60">
              Notas autoadesivas · Prazos · Equipes · Lembrei!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.99]"
    >
      {children}
    </button>
  );
}
