import { useEffect, useState } from "react";

/**
 * Relógio que avança sozinho, para telas que marcam "agora" (a linha do horário
 * atual no calendário). Começa fixo e só passa a andar depois da montagem, para
 * o HTML do servidor e o primeiro render do cliente coincidirem.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
