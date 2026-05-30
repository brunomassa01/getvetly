import type { Fornecedor } from "./db";

/** Normaliza o nome: sem acento, minúsculo, só letras/números e espaços. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Distância de edição (Levenshtein) entre duas strings. */
export function distanciaEdicao(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let anterior = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const atual = [i];
    for (let j = 1; j <= n; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        atual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + custo,
      );
    }
    anterior = atual;
  }
  return anterior[n];
}

/** Dois nomes são "o mesmo fornecedor"? (igual normalizado ou erro de digitação) */
function saoSimilares(a: string, b: string): boolean {
  const na = normalizarNome(a);
  const nb = normalizarNome(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  // um contém o outro (ex: "eletromidia" vs "eletromidia sp")
  if (na.includes(nb) || nb.includes(na)) return true;
  // tolera erros de digitação proporcionais ao tamanho do nome
  const limiar = Math.max(1, Math.ceil(Math.max(na.length, nb.length) * 0.25));
  return distanciaEdicao(na, nb) <= limiar;
}

export interface GrupoDuplicado {
  fornecedores: Fornecedor[];
}

/**
 * Agrupa fornecedores que provavelmente são o mesmo (nomes parecidos).
 * Retorna só os grupos com 2+ itens — candidatos a fusão (o usuário confirma).
 */
export function agruparDuplicados(lista: Fornecedor[]): GrupoDuplicado[] {
  const n = lista.length;
  const pai = Array.from({ length: n }, (_, i) => i);
  const buscar = (x: number): number => (pai[x] === x ? x : (pai[x] = buscar(pai[x])));
  const unir = (x: number, y: number) => {
    pai[buscar(x)] = buscar(y);
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (saoSimilares(lista[i].nome, lista[j].nome)) unir(i, j);
    }
  }

  const mapa = new Map<number, Fornecedor[]>();
  for (let i = 0; i < n; i++) {
    const raiz = buscar(i);
    const grupo = mapa.get(raiz) ?? [];
    grupo.push(lista[i]);
    mapa.set(raiz, grupo);
  }

  return Array.from(mapa.values())
    .filter((g) => g.length >= 2)
    // o de mais cotações primeiro (sugestão de "principal")
    .map((g) => ({
      fornecedores: [...g].sort((a, b) => (b.cotacoes ?? 0) - (a.cotacoes ?? 0)),
    }));
}
