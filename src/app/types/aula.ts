export interface Conteudo {
  id: string;
  titulo: string;
  descricao?: string;
  turma_id: string;
  professor_id: string;
  data_publicacao: Date;
  data_entrega?: Date;
}


export interface Aula extends Conteudo {
  tipo: 'aula';
  plano_estudo: string;                     // Detalhes da aula
  materiais_complementares: MaterialComplementar[];
  materia_id: string;  // <- nova relação
}

export interface MaterialComplementar {
  id: string;
  aula_id: string;
  nome: string;
  tipo: 'video' | 'pdf' | 'link' | 'imagem';
  url: string;
}

export interface Avaliacao extends Conteudo {
  tipo: 'avaliacao';
  perguntas: Pergunta[];
  nota_maxima: number;
  materia_id: string; 

}

export interface Pergunta {
  id: string;
  enunciado: string;
  tipo: 'multipla-escolha' | 'verdadeiro-falso' | 'resposta-curta';
  opcoes?: string[];                         // Para múltipla escolha
  resposta_correta: string | string[];
}
