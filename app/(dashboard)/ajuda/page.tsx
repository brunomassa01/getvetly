import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ajuda — Vetly" };

const FAQ: { p: string; r: string }[] = [
  {
    p: "Como analiso uma proposta?",
    r: "Vá em Propostas → Nova proposta, suba o(s) arquivo(s) do fornecedor (PDF com texto, Excel ou Word) e pronto. A IA lê tudo, extrai fornecedor, valores e condições, e monta um relatório com leitura crítica. A análise roda em segundo plano — a página atualiza sozinha quando fica pronta.",
  },
  {
    p: "Posso comparar várias propostas?",
    r: "Sim. Em Comparativos, use 'Comparar analisadas' (escolhe propostas já prontas) ou 'Subir e comparar' (um arquivo por fornecedor). A IA gera uma matriz lado a lado, recomenda a melhor pelo seu critério e mostra cenários de decisão.",
  },
  {
    p: "Como compartilho com a diretoria para aprovar?",
    r: "Na proposta ou no comparativo, gere um link de aprovação (ou envie por e-mail). Quem recebe vê o relatório completo e aprova/recusa direto pelo link, sem precisar criar conta. O resultado volta automaticamente para você no sistema.",
  },
  {
    p: "Como gero a apresentação em PDF ou PowerPoint?",
    r: "No relatório, clique em 'Gerar apresentação'. A IA monta um deck executivo (capa, números de destaque, recomendação, tabela, gráfico e próximos passos) com a identidade visual da sua empresa. Na tela seguinte você escolhe baixar como PDF ou como PPT editável.",
  },
  {
    p: "O que é a 'Situação' da proposta?",
    r: "É o ciclo comercial: Em aberto → Apresentada → Aprovada ou Recusada. Marque 'Apresentada' quando enviar ao decisor; depois marque o desfecho. O Painel mostra quantas você apresentou, fechou e quantas aguardam retorno.",
  },
  {
    p: "Como convido minha equipe?",
    r: "Administradores vão em (menu de perfil) → Gestão de Usuários → Convidar, e enviam um convite por e-mail. O número de usuários depende do seu plano. Operadores usam o sistema; administradores também gerenciam empresa, usuários e plano.",
  },
  {
    p: "Como mudo de plano ou cancelo a assinatura?",
    r: "No menu de perfil → Financeiro. Lá você vê seu plano, troca de plano ou abre o portal de cobrança para gerenciar/cancelar e ver faturas.",
  },
  {
    p: "Quais formatos de arquivo posso enviar?",
    r: "PDF com texto, Excel (.xlsx/.xls) e Word (.docx). PDFs escaneados (imagem) e PowerPoint dependem de leitura por OCR, que chega em breve. O limite é 25 MB no total por proposta.",
  },
  {
    p: "Como personalizo os relatórios com a marca da minha empresa?",
    r: "Em Configurações da Empresa você sobe o logo e define as cores. Pode também subir o design system (.md) que a IA usa para extrair as cores da marca. Tudo isso aparece nas apresentações e no PDF/PPT.",
  },
];

export default function AjudaPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-extrabold text-ink text-2xl sm:text-3xl tracking-tighter">
        Central de Ajuda
      </h1>
      <p className="text-sm text-texto-2 mt-1 mb-6">
        Dúvidas frequentes sobre como usar o Get Vetly.
      </p>

      <div className="space-y-2">
        {FAQ.map((item) => (
          <details
            key={item.p}
            className="group rounded-lg border border-[color:var(--border-subtle)] bg-white"
          >
            <summary className="cursor-pointer list-none px-5 py-4 font-medium text-ink flex items-center justify-between gap-3">
              {item.p}
              <span className="text-texto-3 group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>
            <p className="px-5 pb-4 text-sm text-texto-2 leading-relaxed">
              {item.r}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-[color:var(--border-default)] bg-paper-warm p-5 text-center">
        <p className="text-sm text-texto-2">
          Não encontrou o que precisava?
        </p>
        <a
          href="mailto:contato@getvetly.com"
          className="inline-block mt-3 font-body font-semibold text-sm bg-ink text-paper px-5 py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          Falar com o suporte
        </a>
        <p className="text-xs text-texto-3 mt-3">
          Em breve: assistente por IA e abertura de chamados por aqui.
        </p>
      </div>
    </div>
  );
}
