import { supabase } from "@/lib/supabase";
import { Aluno } from "../types/users";

/**
 * Busca os dados do(s) aluno(s) vinculado(s) ao responsável
 */
export async function buscarAlunosPorResponsavel(responsavelId: string): Promise<Aluno[]> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        turmas:turma_id (
          id,
          nome,
          serie
        )
      `)
      .eq("responsavel_id", responsavelId)
      .eq("role", "aluno");

    if (error) {
      console.error("Erro ao buscar alunos:", error);
      throw new Error("Erro ao buscar dados dos alunos");
    }

    return data || [];
  } catch (error: any) {
    console.error("Erro ao buscar alunos por responsável:", error);
    throw error;
  }
}

/**
 * Busca informações detalhadas de um aluno específico
 */
export async function buscarAlunoDetalhado(alunoId: string): Promise<any> {
  try {
    const { data: aluno, error: alunoError } = await supabase
      .from("users")
      .select(`
        *,
        turmas:turma_id (
          id,
          nome,
          serie
        )
      `)
      .eq("id", alunoId)
      .eq("role", "aluno")
      .single();

    if (alunoError) {
      console.error("Erro ao buscar aluno:", alunoError);
      throw new Error("Erro ao buscar dados do aluno");
    }

    return aluno;
  } catch (error: any) {
    console.error("Erro ao buscar aluno detalhado:", error);
    throw error;
  }
}

/**
 * Busca as aulas da turma do aluno
 */
export async function buscarAulasPorAluno(turmaId: string) {
  try {
    const { data, error } = await supabase
      .from("aulas")
      .select(`
        *,
        materias (
          id,
          nome
        ),
        materiais_complementares (
          id,
          nome,
          tipo,
          url
        )
      `)
      .eq("turma_id", turmaId)
      .order("data_publicacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar aulas:", error);
      throw new Error("Erro ao buscar aulas do aluno");
    }

    return data || [];
  } catch (error: any) {
    console.error("Erro ao buscar aulas por aluno:", error);
    throw error;
  }
}
