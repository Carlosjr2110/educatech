import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userRole = session.user.role;
  const userId = session.user.id;

  let query = supabase
    .from("conteudos")
    .select(`
      id,
      titulo,
      descricao,
      data_publicacao,
      data_entrega,
      tipo,
      turma_id,
      professor_id,
      materia_id,
      materia:materia_id (
        id,
        nome,
        professor_id
      ),
      avaliacao:avaliacoes!inner (
        id,
        nota_maxima
      )
    `)
    .eq("tipo", "avaliacao");

  // Se for aluno, busca apenas avaliações da sua turma
  if (userRole === "aluno") {
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("turma_id")
      .eq("user_id", userId)
      .single();

    if (alunoData?.turma_id) {
      query = query.eq("turma_id", alunoData.turma_id);
    }
  }

  // Se for professor, busca apenas avaliações que criou
  if (userRole === "professor") {
    query = query.eq("professor_id", userId);
  }

  const { data, error } = await query.order("data_publicacao", { ascending: false });

  if (error) {
    console.error("Erro ao buscar avaliações:", error);
    return NextResponse.json({ error: "Erro ao buscar avaliações" }, { status: 500 });
  }

  // Buscar atividades concluídas para cada avaliação (se for aluno)
  let dataComAtividades = data;
  if (userRole === "aluno") {
    const avaliacoesIds = data.map(a => a.id);
    const { data: atividadesData } = await supabase
      .from("atividades_concluidas")
      .select("*")
      .eq("aluno_id", userId)
      .in("conteudo_id", avaliacoesIds);

    dataComAtividades = data.map(av => ({
      ...av,
      atividade: atividadesData?.filter(at => at.conteudo_id === av.id) || []
    }));
  }

  return NextResponse.json(dataComAtividades, { status: 200 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professor") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { titulo, descricao, turma_id, materia_id, data_entrega, nota_maxima, perguntas } = body;

  // Criar conteúdo
  const conteudoId = crypto.randomUUID();
  const { error: conteudoError } = await supabase
    .from("conteudos")
    .insert({
      id: conteudoId,
      titulo,
      descricao,
      turma_id,
      professor_id: session.user.id,
      materia_id,
      data_entrega,
      tipo: "avaliacao"
    });

  if (conteudoError) {
    console.error("Erro ao criar conteúdo:", conteudoError);
    return NextResponse.json({ error: conteudoError.message }, { status: 500 });
  }

  // Criar avaliação
  const { error: avaliacaoError } = await supabase
    .from("avaliacoes")
    .insert({
      id: conteudoId,
      nota_maxima
    });

  if (avaliacaoError) {
    console.error("Erro ao criar avaliação:", avaliacaoError);
    return NextResponse.json({ error: avaliacaoError.message }, { status: 500 });
  }

  // Criar perguntas
  if (perguntas && perguntas.length > 0) {
    const perguntasComId = perguntas.map((p: any) => ({
      id: crypto.randomUUID(),
      avaliacao_id: conteudoId,
      enunciado: p.enunciado,
      tipo: p.tipo,
      opcoes: p.opcoes || null,
      resposta_correta: p.resposta_correta
    }));

    const { error: perguntasError } = await supabase
      .from("perguntas")
      .insert(perguntasComId);

    if (perguntasError) {
      console.error("Erro ao criar perguntas:", perguntasError);
      return NextResponse.json({ error: perguntasError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: conteudoId, message: "Avaliação criada com sucesso" });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professor") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { id, titulo, descricao, turma_id, materia_id, data_entrega, nota_maxima, perguntas } = body;

  if (!id) {
    return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
  }

  // Atualizar conteúdo
  const { error: conteudoError } = await supabase
    .from("conteudos")
    .update({
      titulo,
      descricao,
      turma_id,
      materia_id,
      data_entrega
    })
    .eq("id", id);

  if (conteudoError) {
    console.error("Erro ao atualizar conteúdo:", conteudoError);
    return NextResponse.json({ error: conteudoError.message }, { status: 500 });
  }

  // Atualizar avaliação
  const { error: avaliacaoError } = await supabase
    .from("avaliacoes")
    .update({ nota_maxima })
    .eq("id", id);

  if (avaliacaoError) {
    console.error("Erro ao atualizar avaliação:", avaliacaoError);
    return NextResponse.json({ error: avaliacaoError.message }, { status: 500 });
  }

  // Deletar perguntas antigas e criar novas
  await supabase.from("perguntas").delete().eq("avaliacao_id", id);

  if (perguntas && perguntas.length > 0) {
    const perguntasComId = perguntas.map((p: any) => ({
      id: crypto.randomUUID(),
      avaliacao_id: id,
      enunciado: p.enunciado,
      tipo: p.tipo,
      opcoes: p.opcoes || null,
      resposta_correta: p.resposta_correta
    }));

    const { error: perguntasError } = await supabase
      .from("perguntas")
      .insert(perguntasComId);

    if (perguntasError) {
      console.error("Erro ao atualizar perguntas:", perguntasError);
      return NextResponse.json({ error: perguntasError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id, message: "Avaliação atualizada com sucesso" });
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professor") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
  }

  // Deletar em ordem: perguntas → atividades_concluidas → avaliacoes → conteudos
  await supabase.from("perguntas").delete().eq("avaliacao_id", id);
  await supabase.from("atividades_concluidas").delete().eq("conteudo_id", id);
  await supabase.from("avaliacoes").delete().eq("id", id);
  const { error } = await supabase.from("conteudos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Avaliação deletada com sucesso" });
}
