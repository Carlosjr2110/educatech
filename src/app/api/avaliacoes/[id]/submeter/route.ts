import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "aluno") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { respostas } = body; // { pergunta_id: resposta }

  // Buscar perguntas com respostas corretas
  const { data: perguntas, error: perguntasError } = await supabase
    .from("perguntas")
    .select("*")
    .eq("avaliacao_id", id);

  if (perguntasError) {
    return NextResponse.json({ error: perguntasError.message }, { status: 500 });
  }

  // Buscar nota máxima da avaliação
  const { data: avaliacao, error: avaliacaoError } = await supabase
    .from("avaliacoes")
    .select("nota_maxima")
    .eq("id", id)
    .single();

  if (avaliacaoError) {
    return NextResponse.json({ error: avaliacaoError.message }, { status: 500 });
  }

  // Calcular nota
  let acertos = 0;
  const totalPerguntas = perguntas.length;

  perguntas.forEach(pergunta => {
    const respostaAluno = respostas[pergunta.id];
    const respostaCorreta = pergunta.resposta_correta;

    if (Array.isArray(respostaCorreta)) {
      // Para múltipla escolha ou verdadeiro/falso
      if (JSON.stringify(respostaAluno) === JSON.stringify(respostaCorreta)) {
        acertos++;
      }
    } else {
      // Para resposta curta
      if (respostaAluno?.toLowerCase().trim() === respostaCorreta?.toLowerCase().trim()) {
        acertos++;
      }
    }
  });

  const notaFinal = (acertos / totalPerguntas) * avaliacao.nota_maxima;

  // Verificar prazo
  const { data: conteudo } = await supabase
    .from("conteudos")
    .select("data_entrega")
    .eq("id", id)
    .single();

  const atrasado = conteudo?.data_entrega
    ? new Date() > new Date(conteudo.data_entrega)
    : false;

  // Registrar atividade concluída
  const { error: atividadeError } = await supabase
    .from("atividades_concluidas")
    .insert({
      id: crypto.randomUUID(),
      aluno_id: session.user.id,
      tipo: "avaliacao",
      conteudo_id: id,
      data_conclusao: new Date().toISOString(),
      nota: notaFinal,
      nota_maxima: avaliacao.nota_maxima,
      atraso: atrasado
    });

  if (atividadeError) {
    return NextResponse.json({ error: atividadeError.message }, { status: 500 });
  }

  return NextResponse.json({
    nota: notaFinal,
    nota_maxima: avaliacao.nota_maxima,
    acertos,
    total: totalPerguntas,
    percentual: (acertos / totalPerguntas) * 100
  });
}
