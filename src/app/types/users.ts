import { Materia } from "./materias";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Deve ser hasheada no banco!
  role: 'aluno' | 'responsavel' | 'professor';
  created_at: Date;
}

// Tipo para ALUNO
export interface Aluno extends User {
  role: "aluno";
  matricula: string;
  turma_id: string;
  responsavel_id?: string;
}

// RESPONSÁVEL
export interface Responsavel extends User {
  role: "responsavel";
  telefone: string;
  filhos: Aluno[];
}

// PROFESSOR
export interface Professor extends User {
  role: "professor";
  materias: Materia[];          // matérias que leciona
}