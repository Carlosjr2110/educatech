import { Materia } from "./materias";
import { Aluno } from "./users";

export interface Turma {
  id: string;
  nome: string;
  serie: string;                // Ex: "5º Ano", "1º Ano EM"
  turno?: "manha" | "tarde" | "noite";
  materias?: Materia[];         // lista de matérias da turma (opcional)
  alunos?: Aluno[];             // lista de alunos (opcional)
}
