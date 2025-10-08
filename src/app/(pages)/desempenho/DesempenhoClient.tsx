"use client";

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Calendar, CheckCircle, Clock, Award, Lightbulb, Target, BookOpen } from "lucide-react";
import { toast } from "react-toastify";
import { buscarDesempenho, buscarAlunosProfessor } from "@/app/services/desempenho";
import { Card, CardHeader } from "@/app/components/ui/Card";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { EmptyState } from "@/app/components/ui/EmptyState";

interface DesempenhoClientProps {
  userRole: string;
  userId: string;
  alunoIdInicial?: string;
}

export default function DesempenhoClient({ userRole, userId, alunoIdInicial }: DesempenhoClientProps) {
  const [desempenho, setDesempenho] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(alunoIdInicial || userId);
  const [sugestoesIA, setSugestoesIA] = useState<any>(null);
  const [loadingSugestoes, setLoadingSugestoes] = useState(false);

  useEffect(() => {
    if (userRole === "professor") {
      carregarTurmasEAlunos();
    } else {
      // Para aluno/responsavel, carregar imediatamente
      carregarDados();
    }
  }, []);

  useEffect(() => {
    // Só carregar quando houver aluno selecionado E não for o carregamento inicial
    if (alunoSelecionado && userRole === "professor") {
      carregarDados();
    }
  }, [alunoSelecionado]);

  const carregarTurmasEAlunos = async () => {
    setLoading(true);
    try {
      // Carregar turmas do professor
      const { getTurmas } = await import("@/app/services/turmas");
      const turmasData = await getTurmas(userId);
      setTurmas(turmasData);

      // Carregar todos os alunos
      const alunosData = await buscarAlunosProfessor();
      setAlunos(alunosData);

      // Selecionar primeira turma e primeiro aluno dessa turma E carregar desempenho
      if (turmasData.length > 0 && alunosData.length > 0) {
        const primeiraTurma = turmasData[0].id;
        setTurmaSelecionada(primeiraTurma);

        const alunosDaTurma = alunosData.filter((a: any) => a.turma.id === primeiraTurma);
        if (alunosDaTurma.length > 0) {
          const primeiroAluno = alunosDaTurma[0].id;
          setAlunoSelecionado(primeiroAluno);

          // Carregar desempenho do primeiro aluno imediatamente
          const desempenhoData = await buscarDesempenho(primeiroAluno);
          setDesempenho(desempenhoData);
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar turmas e alunos:", error);
      toast.error("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    try {
      const desempenhoData = await buscarDesempenho(
        userRole === "aluno" ? undefined : alunoSelecionado
      );
      setDesempenho(desempenhoData);
    } catch (error: any) {
      console.error("Erro ao carregar desempenho:", error);
      toast.error("Erro ao carregar dados de desempenho. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const gerarSugestoesIA = async () => {
    if (!desempenho || !desempenho.estatisticas.areasMelhoria.length) {
      toast.error("Não há áreas de melhoria identificadas.");
      return;
    }

    setLoadingSugestoes(true);
    try {
      const res = await fetch("/api/ai/sugestoes-reforco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materias: desempenho.estatisticas.areasMelhoria,
          nomeAluno: desempenho.aluno.nome,
          serie: desempenho.aluno.turma.serie
        })
      });

      if (!res.ok) throw new Error("Erro ao gerar sugestões");

      const data = await res.json();
      setSugestoesIA(data);
      toast.success("Sugestões de reforço geradas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao gerar sugestões:", error);
      toast.error("Erro ao gerar sugestões de reforço. Tente novamente.");
    } finally {
      setLoadingSugestoes(false);
    }
  };

  // Loading completo para todos os roles no carregamento inicial
  if (loading && !desempenho) {
    return <LoadingSpinner fullScreen text="Carregando desempenho..." />;
  }

  // Erro se não houver dados após carregamento
  if (!desempenho && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <Card>
          <EmptyState
            icon={<BarChart3 size={64} />}
            title="Nenhum dado disponível"
            description="Não foi possível carregar os dados de desempenho. Tente novamente mais tarde."
          />
        </Card>
      </div>
    );
  }

  const { aluno, metricas, progresso, estatisticas } = desempenho || {};

  const getCorNota = (nota: number) => {
    if (nota >= 80) return "text-green-600";
    if (nota >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getCorFundoNota = (nota: number) => {
    if (nota >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (nota >= 60) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  // Filtrar alunos por turma selecionada
  const alunosFiltrados = userRole === "professor" && turmaSelecionada
    ? alunos.filter(a => a.turma.id === turmaSelecionada)
    : alunos;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader
            icon={<BarChart3 size={32} />}
            title="Desempenho Acadêmico"
            subtitle={userRole === "professor" ? "Acompanhe o progresso dos seus alunos" : "Acompanhe seu progresso e evolução"}
          />
        </Card>

        {/* Seletores de Turma e Aluno (apenas para professor) */}
        {userRole === "professor" && (
          <Card className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seletor de Turmas */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Turma</h2>
                <div className="flex flex-wrap gap-2">
                  {turmas.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Você não está lecionando em nenhuma turma.
                    </p>
                  ) : (
                    turmas.map(turma => (
                      <button
                        key={turma.id}
                        onClick={() => {
                          setTurmaSelecionada(turma.id);
                          // Selecionar primeiro aluno da turma
                          const alunosDaTurma = alunos.filter(a => a.turma.id === turma.id);
                          if (alunosDaTurma.length > 0) {
                            setAlunoSelecionado(alunosDaTurma[0].id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          turmaSelecionada === turma.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {turma.nome}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Seletor de Alunos */}
              {turmaSelecionada && alunosFiltrados.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Aluno</h2>
                  <div className="flex flex-wrap gap-2">
                    {alunosFiltrados.map(aluno => (
                      <button
                        key={aluno.id}
                        onClick={() => setAlunoSelecionado(aluno.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          alunoSelecionado === aluno.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {aluno.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Loading inline ao trocar de aluno */}
        {loading && desempenho && (
          <Card className="mb-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando dados do aluno...</p>
            </div>
          </Card>
        )}

        {/* Informações do Aluno */}
        {!loading && desempenho && aluno && (
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-base sm:text-lg text-blue-600 dark:text-blue-400 font-medium">
                {aluno.nome} • {aluno.turma.nome}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Matrícula: {aluno.matricula}
              </span>
            </div>
          </Card>
        )}

        {/* Métricas Principais */}
        {!loading && desempenho && metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Pontuação Geral */}
          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pontuação Geral</p>
                <p className={`text-3xl font-bold mt-2 ${getCorNota(metricas.pontuacaoGeral)}`}>
                  {metricas.pontuacaoGeral}%
                </p>
              </div>
              <div className={`p-3 rounded-full ${getCorFundoNota(metricas.pontuacaoGeral)}`}>
                <Award className={`h-6 w-6 ${getCorNota(metricas.pontuacaoGeral)}`} />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    metricas.pontuacaoGeral >= 80 ? "bg-green-500" :
                    metricas.pontuacaoGeral >= 60 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${metricas.pontuacaoGeral}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Taxa de Conclusão */}
          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conclusão de Avaliações</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {metricas.taxaConclusao}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metricas.avaliacoesConcluidas}/{metricas.totalAvaliacoes} avaliações
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </Card>

          {/* Média de Notas */}
          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Média de Notas</p>
                <p className="text-3xl font-bold mt-2 text-purple-600 dark:text-purple-400">
                  {metricas.mediaNotas} / {metricas.mediaNotasMaxima}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metricas.avaliacoesConcluidas}/{metricas.totalAvaliacoes} avaliações
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          {/* Pontualidade */}
          <Card padding="md" hover>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entregas em Dia</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {metricas.totalEntregas > 0
                    ? Math.round((metricas.entregasEmDia / metricas.totalEntregas) * 100)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {metricas.entregasEmDia}/{metricas.totalEntregas} entregas
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>
        )}

        {!loading && desempenho && progresso && estatisticas && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Desempenho por Matéria */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Desempenho por Matéria
              </h2>
              {progresso?.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhuma matéria disponível
                </p>
              ) : (
                <div className="space-y-4">
                  {progresso.map((materia: any) => (
                    <div key={materia.materiaId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900 dark:text-white">{materia.nome}</span>
                        <span className={`font-bold ${getCorNota(materia.pontuacao)}`}>
                          {materia.pontuacao}%
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Avaliações concluídas:</span>
                          <span className="text-gray-900 dark:text-white">{materia.avaliacoesConcluidas}/{materia.totalAvaliacoes}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${materia.taxaConclusao || 0}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Nota média:</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {materia.notaMedia} / {materia.notaMediaMaxima}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Estatísticas e Ranking */}
          <div className="space-y-4 md:space-y-6">
            {/* Ranking */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ranking da Turma
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  #{estatisticas.rankingTurma}
                </div>
                <div className="text-gray-600 dark:text-gray-400 mt-2">
                  de {estatisticas.totalAlunos} alunos
                </div>
              </div>
            </Card>

            {/* Pontos Fortes */}
            {estatisticas?.pontosFortes?.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pontos Fortes
                </h3>
                <div className="space-y-2">
                  {estatisticas.pontosFortes.map((ponto: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span>{ponto}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Áreas de Melhoria */}
            {estatisticas?.areasMelhoria?.length > 0 && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Áreas de Melhoria
                </h3>
                <div className="space-y-3">
                  {estatisticas.areasMelhoria.map((area: any, index: number) => (
                    <div key={index} className="border-l-4 border-yellow-500 pl-3">
                      <div className="font-medium text-gray-900 dark:text-white">{area.nome}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Nota: {area.notaMedia}/{area.notaMediaMaxima} • Conclusão: {area.taxaConclusao}%
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
        )}

        {/* Sugestões de Reforço com IA */}
        {!loading && desempenho && estatisticas?.areasMelhoria?.length > 0 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Lightbulb className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Sugestões de Reforço
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Plano personalizado gerado com IA
                  </p>
                </div>
              </div>
              {!sugestoesIA && (
                <button
                  onClick={gerarSugestoesIA}
                  disabled={loadingSugestoes}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingSugestoes ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Lightbulb size={18} />
                      Gerar Sugestões
                    </>
                  )}
                </button>
              )}
            </div>

            {sugestoesIA ? (
              <div className="space-y-6">
                {/* Sugestões por Matéria */}
                {sugestoesIA.sugestoes?.map((sugestao: any, index: number) => (
                  <div key={index} className="bg-purple-50 dark:bg-purple-900/10 rounded-lg p-5 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3 mb-4">
                      <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {sugestao.materia}
                        </h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {sugestao.diagnostico}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Ações Práticas */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <CheckCircle size={16} className="text-purple-600 dark:text-purple-400" />
                          Ações Práticas
                        </h4>
                        <ul className="space-y-1.5">
                          {sugestao.acoes?.map((acao: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 pl-2">
                              • {acao}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Recursos */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <BookOpen size={16} className="text-purple-600 dark:text-purple-400" />
                          Recursos Sugeridos
                        </h4>
                        <ul className="space-y-1.5">
                          {sugestao.recursos?.map((recurso: string, i: number) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 pl-2">
                              • {recurso}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-start gap-2">
                      <Target size={16} className="text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <span className="text-xs font-medium text-purple-600 dark:text-purple-400">META</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-0.5">{sugestao.meta}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Dicas Gerais */}
                {sugestoesIA.dicasGerais?.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Award size={18} className="text-blue-600 dark:text-blue-400" />
                      Dicas Gerais para Melhorar o Desempenho
                    </h3>
                    <ul className="space-y-2">
                      {sugestoesIA.dicasGerais.map((dica: string, i: number) => (
                        <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                          <span className="text-blue-600 dark:text-blue-400 mt-0.5">✓</span>
                          <span>{dica}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setSugestoesIA(null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Gerar Novas Sugestões
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Clique no botão acima para gerar sugestões personalizadas de reforço com IA
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
