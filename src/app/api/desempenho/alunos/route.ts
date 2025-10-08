import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// API para professores listarem alunos de suas turmas
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "professor") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const professorId = session.user.id;

  // Buscar turmas onde o professor leciona
  const { data: materias } = await supabase
    .from("materias")
    .select("turma_id")
    .eq("professor_id", professorId);

  if (!materias || materias.length === 0) {
    return NextResponse.json([]);
  }

  const turmaIds = [...new Set(materias.map(m => m.turma_id))];

  // Buscar alunos dessas turmas
  const { data: alunos, error } = await supabase
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
    .in("turma_id", turmaIds)
    .order("turma_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const alunosFormatados = (alunos || []).map(aluno => ({
    id: aluno.user_id,
    nome: (aluno.usuarios as any).name,
    email: (aluno.usuarios as any).email,
    matricula: aluno.matricula,
    turma: {
      id: aluno.turma_id,
      nome: (aluno.turmas as any).nome,
      serie: (aluno.turmas as any).serie
    }
  }));

  return NextResponse.json(alunosFormatados);
}
