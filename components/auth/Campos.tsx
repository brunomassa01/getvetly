"use client";

import { useFormStatus } from "react-dom";

const baseInput =
  "w-full bg-paper border border-[color:var(--border-default)] rounded-md px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-lime-deep focus:shadow-ring placeholder:text-texto-3";

export function Campo({
  label,
  name,
  type = "text",
  ...props
}: {
  label: string;
  name: string;
  type?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-texto-2 mb-1.5">
        {label}
      </span>
      <input name={name} type={type} className={baseInput} {...props} />
    </label>
  );
}

export function BotaoEnviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full font-body font-semibold text-sm bg-lime text-ink px-5 py-2.5 rounded-md transition-colors hover:bg-lime-deep disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Aguarde..." : children}
    </button>
  );
}

export function Aviso({ erro, sucesso }: { erro?: string; sucesso?: string }) {
  if (!erro && !sucesso) return null;
  return (
    <div
      role="alert"
      className={
        erro
          ? "text-sm rounded-md px-3.5 py-2.5 bg-[#FBE3E3] text-[#8E2828]"
          : "text-sm rounded-md px-3.5 py-2.5 bg-lime-faint text-[#5C7A0E]"
      }
    >
      {erro ?? sucesso}
    </div>
  );
}
