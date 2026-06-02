import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Guia passo a passo — Vetly" };

interface Passo {
  titulo: string;
  texto: string;
  acao?: { rotulo: string; href: string };
}

const PASSOS: Passo[] = [
  {
    titulo: "Configure sua empresa",
    texto:
      "Em Configurações, suba o logo e defina as cores da marca (ou o design system em .md). Isso personaliza os relatórios e as apresentações com a identidade da sua empresa — sem isso, usamos o visual padrão Vetly.",
    acao: { rotulo: "Abrir Configurações", href: "/configuracoes" },
  },
  {
    titulo: "Suba uma proposta",
    texto:
      "Em Propostas → Nova proposta, envie o(s) arquivo(s) do fornecedor (PDF com texto, Excel ou Word, até 25 MB no total). Pode subir vários arquivos da mesma proposta — a IA lê tudo junto. O título é opcional.",
    acao: { rotulo: "Nova proposta", href: "/propostas/nova" },
  },
  {
    titulo: "A IA analisa (em segundo plano)",
    texto:
      "A proposta entra como 'Analisando' e a página abre na hora. A IA extrai fornecedor, valores, condições e métricas, e monta um relatório com leitura crítica: resumo executivo, pontos fortes e pontos a questionar. A tela atualiza sozinha quando fica pronta — não precisa esperar parado.",
  },
  {
    titulo: "Complete o que faltar",
    texto:
      "Se a IA não encontrou todos os dados de contato do fornecedor, um card opcional permite preencher. O fornecedor é cadastrado e vinculado automaticamente, construindo seu histórico em Fornecedores (com economia e desconto médio).",
    acao: { rotulo: "Ver fornecedores", href: "/fornecedores" },
  },
  {
    titulo: "Compare propostas concorrentes",
    texto:
      "Em Comparativos, use 'Comparar analisadas' (escolhe propostas já prontas) ou 'Subir e comparar' (um arquivo por fornecedor). A IA gera uma matriz lado a lado, recomenda a melhor pelo seu critério e mostra cenários de decisão ('se o prazo é crítico → X').",
    acao: { rotulo: "Abrir Comparativos", href: "/comparativos" },
  },
  {
    titulo: "Gere a apresentação",
    texto:
      "No relatório (de uma proposta ou de um comparativo), clique em 'Gerar apresentação'. A IA monta um deck executivo — capa, números de destaque, recomendação, tabela, gráfico e próximos passos — com a marca da sua empresa. Na tela seguinte, escolha baixar como PDF ou como PowerPoint editável.",
  },
  {
    titulo: "Compartilhe para aprovação",
    texto:
      "Gere um link de aprovação (ou envie por e-mail) para a diretoria. Quem recebe vê o relatório completo e aprova ou recusa direto pelo link, sem precisar criar conta. O resultado volta automaticamente para você no sistema.",
  },
  {
    titulo: "Acompanhe a situação",
    texto:
      "Marque o ciclo: Em aberto → Apresentada → Aprovada ou Recusada. Numa comparação, basta escolher a proposta aceita — as outras viram recusadas automaticamente. O Painel mostra quantas você apresentou, fechou e quantas aguardam retorno, com a taxa de aprovação.",
    acao: { rotulo: "Ir para o Painel", href: "/painel" },
  },
  {
    titulo: "Convide sua equipe",
    texto:
      "Administradores podem convidar pessoas por e-mail em Gestão de Usuários. O número de usuários depende do seu plano. Operadores usam o sistema (analisam, comparam); administradores também gerenciam empresa, usuários e plano.",
    acao: { rotulo: "Gestão de Usuários", href: "/usuarios" },
  },
  {
    titulo: "Plano e cobrança",
    texto:
      "Em Financeiro você vê seu plano, troca de plano ou abre o portal de cobrança para gerenciar a assinatura, ver faturas e cancelar quando quiser. O teste grátis cobre 3 análises antes de exigir um plano.",
    acao: { rotulo: "Abrir Financeiro", href: "/financeiro" },
  },
];

export default function GuiaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/ajuda" className="text-sm text-texto-2 hover:text-ink">
        ← Ajuda
      </Link>
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter mt-2">
        Guia passo a passo
      </h1>
      <p className="text-sm text-texto-2 mt-1 mb-8">
        Do arquivo do fornecedor até a aprovação da diretoria — como usar o Get
        Vetly de ponta a ponta.
      </p>

      <ol className="space-y-6">
        {PASSOS.map((p, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-ink text-paper font-display font-bold">
              {i + 1}
            </span>
            <div className="pt-1">
              <h2 className="font-display font-bold text-ink text-lg">
                {p.titulo}
              </h2>
              <p className="text-sm text-texto-2 mt-1 leading-relaxed">
                {p.texto}
              </p>
              {p.acao && (
                <Link
                  href={p.acao.href}
                  className="inline-block mt-3 font-body font-semibold text-sm bg-transparent text-ink px-4 py-2 rounded-md border border-[color:var(--border-strong)] hover:bg-paper-warm transition-colors"
                >
                  {p.acao.rotulo} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-xl border border-[color:var(--border-default)] bg-paper-warm p-5 text-center">
        <p className="text-sm text-texto-2">Ainda com dúvida?</p>
        <a
          href="mailto:contato@getvetly.com"
          className="inline-block mt-3 font-body font-semibold text-sm bg-ink text-paper px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          Falar com o suporte
        </a>
      </div>
    </div>
  );
}
