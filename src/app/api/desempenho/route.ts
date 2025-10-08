import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get("aluno_id");
    const userRole = session.user.role;
    const userId = session.user.id;

    let targetAlunoId = alunoId;

  // Se for aluno, só pode ver o próprio desempenho
  if (userRole === "aluno") {
    targetAlunoId = userId;
  }

  // Se for responsável, buscar ID do filho
  if (userRole === "responsavel") {
    if (!alunoId) {
      // Buscar primeiro filho
      const { data: filhos } = await supabase
        .from("alunos")
        .select("user_id")
        .eq("responsavel_id", userId)
        .limit(1);

      if (!filhos || filhos.length === 0) {
        return NextResponse.json({ error: "Nenhum aluno vinculado" }, { status: 404 });
      }

      targetAlunoId = filhos[0].user_id;
    } else {
      // Verificar se o aluno pertence ao responsável
      const { data: verificacao } = await supabase
        .from("alunos")
        .select("user_id")
        .eq("user_id", alunoId)
        .eq("responsavel_id", userId)
        .single();

      if (!verificacao) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
      }
    }
  }

  // Se for professor, verificar se o aluno está em uma de suas turmas
  if (userRole === "professor") {
    if (!alunoId) {
      return NextResponse.json({ error: "ID do aluno é obrigatório para professores" }, { status: 400 });
    }

    // Buscar turma do aluno
    const { data: alunoData } = await supabase
      .from("alunos")
      .select("turma_id")
      .eq("user_id", alunoId)
      .single();

    if (!alunoData) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    // Verificar se o professor leciona nessa turma
    const { data: materias } = await supabase
      .from("materias")
      .select("id")
      .eq("turma_id", alunoData.turma_id)
      .eq("professor_id", userId);

    if (!materias || materias.length === 0) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  if (!targetAlunoId) {
    return NextResponse.json({ error: "ID do aluno não fornecido" }, { status: 400 });
  }

  // Buscar dados do aluno
  const { data: alunoInfo, error: alunoError } = await supabase
    .from("alunos")
    .select(`
      user_id,
      matricula,
      turma_id,
      usuarios!inner (
        name,
        email
      ),
      turmas!inner (
        nome,
        serie
      )
    `)
    .eq("user_id", targetAlunoId)
    .single();

  if (alunoError || !alunoInfo) {
    return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
  }

  const turmaId = alunoInfo.turma_id;

  // Buscar apenas AVALIAÇÕES concluídas do aluno (aulas não têm conclusão formal)
  const { data: avaliacoesRealizadas } = await supabase
    .from("atividades_concluidas")
    .select(`
      id,
      tipo,
      conteudo_id,
      data_conclusao,
      nota,
      nota_maxima,
      atraso
    `)
    .eq("aluno_id", targetAlunoId)
    .eq("tipo", "avaliacao");

  // Buscar apenas AVALIAÇÕES disponíveis para a turma
  const { data: avaliacoesDisponiveis } = await supabase
    .from("conteudos")
    .select(`
      id,
      titulo,
      materia_id,
      materias!inner (
        id,
        nome
      )
    `)
    .eq("turma_id", turmaId)
    .eq("tipo", "avaliacao");

  // Buscar todas as matérias da turma
  const { data: materias } = await supabase
    .from("materias")
    .select("*")
    .eq("turma_id", turmaId);

  // Calcular métricas por matéria (APENAS AVALIAÇÕES)
  const progressoPorMateria = (materias || []).map(materia => {
    const avaliacoesDaMateria = (avaliacoesDisponiveis || []).filter(av => av.materia_id === materia.id);

    const avaliacoesRealizadasDaMateria = (avaliacoesRealizadas || []).filter(ar =>
      avaliacoesDaMateria.some(av => av.id === ar.conteudo_id)
    );

    // Calcular nota média em pontos (não porcentagem)
    const notasComMaximas = avaliacoesRealizadasDaMateria
      .filter(av => av.nota !== null && av.nota_maxima !== null)
      .map(av => ({ nota: av.nota!, notaMaxima: av.nota_maxima! }));

    const somaNotas = notasComMaximas.reduce((acc, item) => acc + item.nota, 0);
    const somaMaximas = notasComMaximas.reduce((acc, item) => acc + item.notaMaxima, 0);

    const notaMedia = notasComMaximas.length > 0 ? somaNotas / notasComMaximas.length : 0;
    const notaMediaMaxima = notasComMaximas.length > 0 ? somaMaximas / notasComMaximas.length : 10;
    const percentualNota = notaMediaMaxima > 0 ? (notaMedia / notaMediaMaxima) * 100 : 0;

    // Taxa de conclusão das avaliações
    const taxaConclusao = avaliacoesDaMateria.length > 0
      ? (avaliacoesRealizadasDaMateria.length / avaliacoesDaMateria.length) * 100
      : 0;

    // Pontuação = 50% taxa de conclusão + 50% percentual da nota
    const pontuacao = (taxaConclusao * 0.5) + (percentualNota * 0.5);

    return {
      materiaId: materia.id,
      nome: materia.nome,
      pontuacao: Math.round(pontuacao),
      avaliacoesConcluidas: avaliacoesRealizadasDaMateria.length,
      totalAvaliacoes: avaliacoesDaMateria.length,
      notaMedia: parseFloat(notaMedia.toFixed(1)),
      notaMediaMaxima: parseFloat(notaMediaMaxima.toFixed(1)),
      taxaConclusao: Math.round(taxaConclusao)
    };
  });

  // Calcular métricas gerais (APENAS AVALIAÇÕES)
  const totalAvaliacoes = (avaliacoesDisponiveis || []).length;
  const totalRealizadas = (avaliacoesRealizadas || []).length;

  const entregasEmDia = (avaliacoesRealizadas || []).filter(av => !av.atraso).length;

  // Calcular média geral de notas em pontos
  const notasGeraisComMaximas = (avaliacoesRealizadas || [])
    .filter(av => av.nota !== null && av.nota_maxima !== null)
    .map(av => ({ nota: av.nota!, notaMaxima: av.nota_maxima! }));

  const somaTotalNotas = notasGeraisComMaximas.reduce((acc, item) => acc + item.nota, 0);
  const somaTotalMaximas = notasGeraisComMaximas.reduce((acc, item) => acc + item.notaMaxima, 0);

  const mediaNotasPontos = notasGeraisComMaximas.length > 0
    ? somaTotalNotas / notasGeraisComMaximas.length
    : 0;
  const mediaMaximaPontos = notasGeraisComMaximas.length > 0
    ? somaTotalMaximas / notasGeraisComMaximas.length
    : 10;
  const percentualMediaNotas = mediaMaximaPontos > 0
    ? (mediaNotasPontos / mediaMaximaPontos) * 100
    : 0;

  // Taxa de conclusão geral
  const taxaConclusao = totalAvaliacoes > 0 ? (totalRealizadas / totalAvaliacoes) * 100 : 0;

  // Taxa de pontualidade
  const taxaPontualidade = totalRealizadas > 0 ? (entregasEmDia / totalRealizadas) * 100 : 0;

  // Pontuação geral = 40% taxa de conclusão + 40% percentual de notas + 20% pontualidade
  const pontuacaoGeral = Math.round(
    (taxaConclusao * 0.4) +
    (percentualMediaNotas * 0.4) +
    (taxaPontualidade * 0.2)
  );

  // Buscar todos os alunos da turma e calcular suas pontuações
  const { data: todosAlunos } = await supabase
    .from("alunos")
    .select("user_id")
    .eq("turma_id", turmaId);

  const totalAlunosTurma = todosAlunos?.length || 0;

  // Calcular pontuação de cada aluno da turma
  const pontuacoesAlunos: number[] = [];

  for (const aluno of todosAlunos || []) {
    const { data: avaliacoesAluno } = await supabase
      .from("atividades_concluidas")
      .select("id, nota, nota_maxima, atraso")
      .eq("aluno_id", aluno.user_id)
      .eq("tipo", "avaliacao");

    const totalRealizadasAluno = avaliacoesAluno?.length || 0;
    const entregasEmDiaAluno = avaliacoesAluno?.filter(av => !av.atraso).length || 0;

    const notasAluno = (avaliacoesAluno || [])
      .filter(av => av.nota !== null && av.nota_maxima !== null)
      .map(av => (av.nota! / av.nota_maxima!) * 100);

    const mediaNotasAluno = notasAluno.length > 0
      ? notasAluno.reduce((a, b) => a + b, 0) / notasAluno.length
      : 0;

    const taxaConclusaoAluno = totalAvaliacoes > 0 ? (totalRealizadasAluno / totalAvaliacoes) * 100 : 0;
    const taxaPontualidadeAluno = totalRealizadasAluno > 0 ? (entregasEmDiaAluno / totalRealizadasAluno) * 100 : 0;

    const pontuacaoAluno = Math.round(
      (taxaConclusaoAluno * 0.4) +
      (mediaNotasAluno * 0.4) +
      (taxaPontualidadeAluno * 0.2)
    );

    pontuacoesAlunos.push(pontuacaoAluno);
  }

  // Ordenar pontuações em ordem decrescente
  pontuacoesAlunos.sort((a, b) => b - a);

  // Encontrar a posição do aluno atual
  const rankingTurma = pontuacoesAlunos.findIndex(p => p <= pontuacaoGeral) + 1;

  const result = {
    aluno: {
      id: alunoInfo.user_id,
      nome: (alunoInfo.usuarios as any).name,
      email: (alunoInfo.usuarios as any).email,
      matricula: alunoInfo.matricula,
      turma: {
        id: turmaId,
        nome: (alunoInfo.turmas as any).nome,
        serie: (alunoInfo.turmas as any).serie
      }
    },
    metricas: {
      pontuacaoGeral,
      entregasEmDia,
      totalEntregas: totalRealizadas,
      avaliacoesConcluidas: totalRealizadas,
      totalAvaliacoes,
      mediaNotas: parseFloat(mediaNotasPontos.toFixed(1)),
      mediaNotasMaxima: parseFloat(mediaMaximaPontos.toFixed(1)),
      taxaConclusao: Math.round(taxaConclusao),
      taxaPontualidade: Math.round(taxaPontualidade)
    },
    progresso: progressoPorMateria,
    estatisticas: {
      rankingTurma,
      totalAlunos: totalAlunosTurma,
      evolucao: 0, // Pode ser calculado comparando com período anterior
      pontosFortes: calcularPontosFortes(progressoPorMateria),
      areasMelhoria: calcularAreasMelhoria(progressoPorMateria)
    }
  };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro no endpoint de desempenho:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar desempenho" },
      { status: 500 }
    );
  }
}

function calcularPontosFortes(progresso: any[]): string[] {
  return progresso
    .filter(p => p.pontuacao >= 80)
    .sort((a, b) => b.pontuacao - a.pontuacao)
    .slice(0, 3)
    .map(p => p.nome);
}

function calcularAreasMelhoria(progresso: any[]) {
  // Retornar todas as matérias com desempenho abaixo de 70
  return progresso
    .filter(p => p.pontuacao < 70)
    .sort((a, b) => a.pontuacao - b.pontuacao)
    .map(p => ({
      nome: p.nome,
      pontuacao: p.pontuacao,
      notaMedia: p.notaMedia,
      notaMediaMaxima: p.notaMediaMaxima,
      taxaConclusao: p.taxaConclusao
    }));
}
