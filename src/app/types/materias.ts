import { Aula } from "./aula";

export interface Materia {
  id: string;
  nome: string;                
  turma_id: string;             
  professor_id: string;          
  aulas: Aula[];
}