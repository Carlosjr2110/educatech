export interface DesempenhoAluno {
  alunoId: string;
  turmaId: string;
  periodo: string;               // "2024-01" para jan/2024
  metricas: MetricasDesempenho;
  progresso: ProgressoMateria[];
  estatisticas: EstatisticasDesempenho;
}

export interface MetricasDesempenho {
  pontuacaoGeral: number;        // 0-100
  entregasEmDia: number;
  totalEntregas: number;
  aulasConcluidas: number;
  totalAulas: number;
  avaliacoesConcluidas: number;
  totalAvaliacoes: number;
  mediaNotas: number;
}

export interface ProgressoMateria {
  materiaId: string;
  nome: string;
  pontuacao: number;
  aulasConcluidas: number;
  totalAulas: number;
  avaliacoesConcluidas: number;
  totalAvaliacoes: number;
  notaMedia: number;
  cor: string;
  icone: string;
}

export interface EstatisticasDesempenho {
  rankingTurma: number;
  totalAlunos: number;
  evolucao: number;              // % de evolução em relação ao período anterior
  pontosFortes: string[];
  areasMelhoria: string[];
}

export interface AtividadeConcluida {
  id: string;
  alunoId: string;
  tipo: 'aula' | 'avaliacao';
  conteudoId: string;
  dataConclusao: Date;
  nota?: number;
  notaMaxima?: number;
  atraso?: boolean;
}