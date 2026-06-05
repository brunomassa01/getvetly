// Detecção do tipo do arquivo de marca enviado em Configurações.
// Puro (sem I/O) para ser fácil de testar. O navegador nem sempre informa o
// mime-type certo, então olhamos mime-type E extensão do nome.

const EXTENSOES_TEXTO = [".md", ".markdown", ".css", ".scss", ".json", ".txt"];

/** É um PDF (manual de marca)? */
export function ehPdfMarca(nome: string, tipo: string): boolean {
  return (
    tipo.toLowerCase().includes("pdf") || nome.toLowerCase().endsWith(".pdf")
  );
}

/** É um arquivo de texto que sabemos ler (.md/.css/.json/.txt)? */
export function ehTextoMarca(nome: string, tipo: string): boolean {
  const n = nome.toLowerCase();
  const t = tipo.toLowerCase();
  return (
    t.startsWith("text/") ||
    t === "application/json" ||
    EXTENSOES_TEXTO.some((ext) => n.endsWith(ext))
  );
}

/** Sabemos extrair texto desse arquivo de marca? (PDF ou texto) */
export function ehArquivoMarcaSuportado(nome: string, tipo: string): boolean {
  return ehPdfMarca(nome, tipo) || ehTextoMarca(nome, tipo);
}
