// src/app/services/materias.ts
import { Materia } from "@/app/types/materias";


// Buscar todas as matérias
export const buscarMaterias = async (turmaId?: string): Promise<Materia[]> => {
  try {
    const url = turmaId ? `/api/materias?turma_id=${turmaId}` : "/api/materias";
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // garante dados atualizados
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar matérias: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    console.error("Erro no buscarMaterias:", err);
    throw err;
  }
};

// Criar nova matéria
export const criarMateria = async (novaMateria: Partial<Materia>): Promise<Materia> => {
  try {
    const res = await fetch("/api/materias", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(novaMateria),
    });

    if (!res.ok) {
      throw new Error(`Erro ao criar matéria: ${res.status}`);
    }

    return res.json();
  } catch (err) {
    console.error("Erro no criarMateria:", err);
    throw err;
  }
};

// Deletar matéria
export const deletarMateria = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`/api/materias/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Erro ao deletar matéria: ${res.status}`);
    }
  } catch (err) {
    console.error("Erro no deletarMateria:", err);
    throw err;
  }
};
