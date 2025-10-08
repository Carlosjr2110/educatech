import { Aula } from "@/app/types/aula";

export async function buscarAulas(turmaId?: string): Promise<Aula[]> {
  const url = turmaId ? `/api/aulas?turma_id=${turmaId}` : "/api/aulas";
  const res = await fetch(url);
  if (!res.ok) throw new Error("Erro ao buscar aulas");
  return res.json();
}

export async function criarAula(novaAula: Partial<Aula>): Promise<Aula> {
  const res = await fetch("/api/aulas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(novaAula),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.details || "Erro ao criar aula";
    throw new Error(errorMessage);
  }

  return res.json();
}

export async function deletarAula(id: string) {
  const res = await fetch(`/api/aulas?id=${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Erro ao deletar aula")
}


export async function atualizarAula(aula: Aula): Promise<Aula> {
  const res = await fetch("/api/aulas", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aula),
  });
  if (!res.ok) throw new Error("Erro ao atualizar aula");
  return res.json();
}

