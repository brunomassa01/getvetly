"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const CHAVE = "vetly_tour_ok";

interface Passo {
  tour: string; // valor do data-tour do elemento-alvo
  titulo: string;
  texto: string;
  vaiPara?: string; // pra onde o "Próximo" navega (se muda de página)
}

const PASSOS: Passo[] = [
  {
    tour: "nav-propostas",
    titulo: "Comece pelas Propostas",
    texto:
      "É aqui que você analisa os arquivos dos fornecedores. Vamos criar a sua primeira.",
    vaiPara: "/propostas",
  },
  {
    tour: "btn-nova-proposta",
    titulo: "Nova proposta",
    texto: "Clique aqui sempre que quiser analisar uma proposta nova.",
    vaiPara: "/propostas/nova",
  },
  {
    tour: "dropzone-upload",
    titulo: "Suba o arquivo",
    texto:
      "Arraste ou clique para enviar o PDF, Excel ou Word do fornecedor — pode ser mais de um arquivo da mesma proposta.",
  },
  {
    tour: "btn-analisar",
    titulo: "Pronto — a IA faz o resto",
    texto:
      "Clique em Analisar proposta. A análise roda em segundo plano e a página atualiza sozinha quando ficar pronta.",
  },
];

export function TourGuia() {
  const router = useRouter();
  const pathname = usePathname();
  const [ativo, setAtivo] = useState(false);
  const [passo, setPasso] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Inicia no 1º acesso (enquanto não tiver concluído/pulado antes).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(CHAVE)) setAtivo(true);
  }, []);

  const encerrar = useCallback(() => {
    localStorage.setItem(CHAVE, "1");
    setAtivo(false);
  }, []);

  // Localiza o alvo do passo (com polling — o elemento pode estar em outra página).
  useEffect(() => {
    if (!ativo) return;
    let parar = false;
    const seletor = `[data-tour="${PASSOS[passo].tour}"]`;
    const tentar = () => {
      const el = document.querySelector(seletor) as HTMLElement | null;
      if (el) {
        setRect(el.getBoundingClientRect());
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        return true;
      }
      return false;
    };
    setRect(null);
    if (tentar()) return;
    const iv = setInterval(() => {
      if (!parar && tentar()) clearInterval(iv);
    }, 150);
    const to = setTimeout(() => clearInterval(iv), 4000);
    return () => {
      parar = true;
      clearInterval(iv);
      clearTimeout(to);
    };
  }, [ativo, passo, pathname]);

  // Reposiciona em scroll/resize.
  useEffect(() => {
    if (!ativo) return;
    const recalc = () => {
      const el = document.querySelector(
        `[data-tour="${PASSOS[passo].tour}"]`,
      ) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("scroll", recalc, true);
    window.addEventListener("resize", recalc);
    return () => {
      window.removeEventListener("scroll", recalc, true);
      window.removeEventListener("resize", recalc);
    };
  }, [ativo, passo]);

  if (!ativo || !rect) return null;

  const p = PASSOS[passo];
  const ultimo = passo === PASSOS.length - 1;

  const proximo = () => {
    if (ultimo) return encerrar();
    const destino = PASSOS[passo].vaiPara;
    setPasso((x) => x + 1);
    if (destino) router.push(destino);
  };

  // Posição do balão (abaixo do alvo, ou acima se faltar espaço).
  const abaixo = rect.bottom + 200 < window.innerHeight;
  const largura = 320;
  const left = Math.min(
    Math.max(rect.left, 12),
    window.innerWidth - largura - 12,
  );

  return (
    <>
      {/* Bloqueia cliques fora (o tour é dirigido pelos botões) */}
      <div className="fixed inset-0 z-[60]" />

      {/* Spotlight no alvo */}
      <div
        className="fixed z-[61] rounded-lg pointer-events-none transition-all"
        style={{
          left: rect.left - 4,
          top: rect.top - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          outline: "3px solid #C8FF02",
          boxShadow: "0 0 0 9999px rgba(30,30,30,.55)",
        }}
      />

      {/* Balão */}
      <div
        className="fixed z-[62] rounded-xl bg-white shadow-lg border border-[color:var(--border-subtle)] p-5"
        style={{
          left,
          width: largura,
          ...(abaixo
            ? { top: rect.bottom + 14 }
            : { bottom: window.innerHeight - rect.top + 14 }),
        }}
      >
        <p className="font-mono text-[10px] tracking-wide2 uppercase text-texto-3">
          Passo {passo + 1} de {PASSOS.length}
        </p>
        <h3 className="font-display font-bold text-ink mt-1">{p.titulo}</h3>
        <p className="text-sm text-texto-2 mt-1 leading-relaxed">{p.texto}</p>
        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={encerrar}
            className="text-sm text-texto-3 hover:text-ink transition-colors"
          >
            Pular
          </button>
          <button
            type="button"
            onClick={proximo}
            className="font-body font-semibold text-sm bg-lime text-ink px-4 py-2 rounded-md hover:bg-lime-deep transition-colors"
          >
            {ultimo ? "Entendi!" : "Próximo →"}
          </button>
        </div>
      </div>
    </>
  );
}
