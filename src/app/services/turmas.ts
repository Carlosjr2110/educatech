import { Aluno, Responsavel } from "@/app/types/users";
import { Turma } from "@/app/types/turma";

// Turmas
export const getTurmas = async (professorId?: string): Promise<Turma[]> => {
  const url = professorId ? `/api/turmas?professor_id=${professorId}` : "/api/turmas";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar turmas");
  return res.json();
};

// Alunos
export const getAlunos = async (): Promise<Aluno[]> => {
  const res = await fetch("/api/alunos");
  if (!res.ok) throw new Error("Erro ao buscar alunos");
  return res.json();
};

export const addAluno = async (aluno: Omit<Aluno, "id">) => {
  const res = await fetch("/api/alunos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aluno),
  });
  if (!res.ok) throw new Error("Erro ao adicionar aluno");
  return res.json();
};

export const updateAluno = async (id: string, aluno: Partial<Aluno>) => {
  const res = await fetch(`/api/alunos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aluno),
  });
  if (!res.ok) throw new Error("Erro ao atualizar aluno");
  return res.json();
};

export const deleteAluno = async (id: string) => {
  const res = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erro ao excluir aluno");
  return res.json();
};

// Responsáveis
export const getResponsaveis = async (): Promise<Responsavel[]> => {
  const res = await fetch("/api/responsaveis");
  if (!res.ok) throw new Error("Erro ao buscar responsáveis");
  return res.json();
};
