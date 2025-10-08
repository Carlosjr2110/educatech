"use client";

import { useEffect, useState } from "react";
import { Book, CheckCircle, XCircle, AlertCircle, Play, Eye, Plus, Trash2, Edit } from "lucide-react";
import { buscarAvaliacoes, criarAvaliacao, editarAvaliacao, deletarAvaliacao, buscarPerguntas } from "@/app/services/avaliacoes";
import ModalAvaliacao from "@/app/components/modal/ModalAvaliacao";
import RealizarAvaliacao from "@/app/components/modal/RealizarAvaliacao";

type StatusAvaliacao = "concluido" | "pendente" | "disponivel" | "atrasado";

interface AvaliacoesClientProps {
  userRole: string;
  userId: string;
  materias: any[];
}

export default function AvaliacoesClient({ userRole, userId, materias }: AvaliacoesClientProps) {
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(null);
  const [materiaSelecionada, setMateriaSelecionada] = useState<string | null>(null);
  const [statusSelecionado, setStatusSelecionado] = useState<string>("todos");
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modalRealizarAberto, setModalRealizarAberto] = useState(false);
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<any>(null);
  const [avaliacaoParaEditar, setAvaliacaoParaEditar] = useState<any>(null);
  const [perguntasParaEditar, setPerguntasParaEditar] = useState<any[]>([]);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAvaliacoes();
    if (userRole === "professor") {
      carregarTurmas();
    }
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      const data = await buscarAvaliacoes();
      setAvaliacoes(data);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarTurmas = async () => {
    try {
      const { getTurmas } = await import("@/app/services/turmas");
      const data = await getTurmas(userId);
      setTurmas(data);
      if (data.length > 0 && !turmaSelecionada) {
        setTurmaSelecionada(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  };

  const getStatusAvaliacao = (av: any): StatusAvaliacao => {
    const hoje = new Date();
    const entrega = av.data_entrega ? new Date(av.data_entrega) : null;
    const atividade = av.atividade?.[0];

    if (atividade?.nota !== null && atividade?.data_conclusao) return "concluido";
    if (entrega && hoje > entrega) return "atrasado";
    return "disponivel";
  };

  const getIconeStatus = (s: StatusAvaliacao) => {
    switch (s) {
      case "concluido":
        return <CheckCircle className="text-green-500" size={20} />;
      case "pendente":
        return <AlertCircle className="text-yellow-500" size={20} />;
      case "atrasado":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Play className="text-blue-500" size={20} />;
    }
  };

  const formatarData = (data: string | null) =>
    data
      ? new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(data))
      : "—";

  const avaliacoesFiltradas = avaliacoes.filter((av) => {
    const status = getStatusAvaliacao(av);
    let passa = true;

    if (turmaSelecionada && av.turma_id !== turmaSelecionada) passa = false;
    if (materiaSelecionada && av.materia?.id !== materiaSelecionada) passa = false;
    if (statusSelecionado !== "todos" && status !== statusSelecionado) passa = false;

    return passa;
  });

  const materiasUnicas = Array.from(
    new Map(avaliacoes.map((a) => [a.materia?.id, a.materia])).values()
  ).filter(Boolean);

  // Filtrar materias por turma selecionada (para professor)
  const materiasFiltradas = userRole === "professor" && turmaSelecionada
    ? materias.filter(m => m.turma_id === turmaSelecionada)
    : materiasUnicas;

  const handleCriarOuEditarAvaliacao = async (avaliacao: any) => {
    try {
      if (avaliacao.id) {
        await editarAvaliacao(avaliacao);
      } else {
        await criarAvaliacao(avaliacao);
      }
      await carregarAvaliacoes();
      setModalCriarAberto(false);
      setAvaliacaoParaEditar(null);
      setPerguntasParaEditar([]);
    } catch (error: any) {
      alert("Erro ao salvar avaliação: " + error.message);
    }
  };

  const handleEditarAvaliacao = async (avaliacao: any) => {
    try {
      const perguntas = await buscarPerguntas(avaliacao.id);
      setAvaliacaoParaEditar(avaliacao);
      setPerguntasParaEditar(perguntas);
      setModalCriarAberto(true);
    } catch (error: any) {
      alert("Erro ao carregar avaliação para edição: " + error.message);
    }
  };

  const handleDeletarAvaliacao = async (id: string) => {
    if (!confirm("Deseja realmente deletar esta avaliação?")) return;
    try {
      await deletarAvaliacao(id);
      await carregarAvaliacoes();
    } catch (error: any) {
      alert("Erro ao deletar avaliação: " + error.message);
    }
  };

  const handleIniciarAvaliacao = (avaliacao: any) => {
    setAvaliacaoSelecionada(avaliacao);
    setModalRealizarAberto(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Book className="text-blue-600" /> Avaliações
            </h1>
            {userRole === "professor" && (
              <button
                onClick={() => setModalCriarAberto(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={20} /> Nova Avaliação
              </button>
            )}
          </div>
        </div>

        {/* Seletores de Turma e Matéria (apenas para professor) */}
        {userRole === "professor" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seletor de Turmas */}
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Turma</h2>
                <div className="flex flex-wrap gap-2">
                  {turmas.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Voce nao esta lecionando em nenhuma turma.
                    </p>
                  ) : (
                    turmas.map(turma => (
                      <button
                        key={turma.id}
                        onClick={() => {
                          setTurmaSelecionada(turma.id);
                          setMateriaSelecionada(null);
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

              {/* Seletor de Matérias */}
              {turmaSelecionada && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Materia</h2>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMateriaSelecionada(null)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        !materiaSelecionada
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      }`}
                    >
                      Todas
                    </button>
                    {materiasFiltradas.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMateriaSelecionada(m.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          materiaSelecionada === m.id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }`}
                      >
                        {m.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filtros para Alunos */}
        {userRole === "aluno" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={materiaSelecionada || ""}
                onChange={(e) => setMateriaSelecionada(e.target.value || null)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas as materias</option>
                {materiasUnicas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>

              <select
                value={statusSelecionado}
                onChange={(e) => setStatusSelecionado(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="todos">Todos os status</option>
                <option value="disponivel">Disponiveis</option>
                <option value="concluido">Concluidos</option>
                <option value="atrasado">Atrasados</option>
              </select>
            </div>
          </div>
        )}

        {/* Lista */}
        {avaliacoesFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <Book className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Nenhuma avaliação encontrada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {avaliacoesFiltradas.map((av) => {
              const status = getStatusAvaliacao(av);
              const atividade = av.atividade?.[0];
              const jaConcluida = status === "concluido";

              return (
                <div
                  key={av.id}
                  className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {userRole === "aluno" && getIconeStatus(status)}
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {av.titulo}
                        </h3>
                      </div>

                      {av.descricao && (
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {av.descricao}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Book size={16} />
                          {av.materia?.nome}
                        </span>
                        {av.avaliacao?.[0]?.nota_maxima && (
                          <span>Nota máxima: {av.avaliacao[0].nota_maxima}</span>
                        )}
                        {av.data_entrega && (
                          <span>Entrega: {formatarData(av.data_entrega)}</span>
                        )}
                      </div>

                      {jaConcluida && atividade && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <p className="text-green-700 dark:text-green-400 font-medium">
                            Nota: {atividade.nota.toFixed(1)} / {atividade.nota_maxima}
                            {atividade.atraso && (
                              <span className="ml-2 text-orange-600 dark:text-orange-400">
                                (Entregue com atraso)
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      {userRole === "aluno" && (
                        <button
                          onClick={() => handleIniciarAvaliacao(av)}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                            jaConcluida
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                          disabled={jaConcluida}
                        >
                          <Eye size={16} />
                          {jaConcluida ? "Concluído" : "Iniciar"}
                        </button>
                      )}

                      {userRole === "professor" && (
                        <>
                          <button
                            onClick={() => handleEditarAvaliacao(av)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Edit size={16} />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeletarAvaliacao(av.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                          >
                            <Trash2 size={16} />
                            Deletar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modais */}
        {userRole === "professor" && (
          <ModalAvaliacao
            isOpen={modalCriarAberto}
            onClose={() => {
              setModalCriarAberto(false);
              setAvaliacaoParaEditar(null);
              setPerguntasParaEditar([]);
            }}
            onSalvar={handleCriarOuEditarAvaliacao}
            userId={userId}
            materias={materias}
            avaliacaoParaEditar={avaliacaoParaEditar}
            perguntasIniciais={perguntasParaEditar}
            turmaSelecionadaInicial={turmaSelecionada}
            materiaSelecionadaInicial={materiaSelecionada}
          />
        )}

        {userRole === "aluno" && avaliacaoSelecionada && (
          <RealizarAvaliacao
            isOpen={modalRealizarAberto}
            onClose={() => {
              setModalRealizarAberto(false);
              setAvaliacaoSelecionada(null);
            }}
            avaliacao={avaliacaoSelecionada}
            onConcluir={carregarAvaliacoes}
          />
        )}
      </div>
    </div>
  );
}
