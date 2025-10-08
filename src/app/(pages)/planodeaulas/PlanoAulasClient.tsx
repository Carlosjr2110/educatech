"use client";

import { useState, useEffect } from "react";
import { Aula, MaterialComplementar } from "@/app/types/aula";
import { Materia } from "@/app/types/materias";
import { Turma } from "@/app/types/turma";
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Video,
  Link as LinkIcon,
  Eye,
  PlusCircle,
  Trash,
  Edit,
  School,
} from "lucide-react";
import { buscarAulas, criarAula, deletarAula, atualizarAula } from "@/app/services/aulas";
import { buscarMaterias } from "@/app/services/materias";
import { getTurmas } from "@/app/services/turmas";
import { criarMaterial } from "@/app/services/materiais";
import ModalAula from "@/app/components/modal/ModalAula";

interface PlanoAulasClientProps {
  userRole: "aluno" | "professor" | "responsavel";
  turmaId: string | null;
  userId: string;
}

export default function PlanoAulasClient({ userRole, turmaId, userId }: PlanoAulasClientProps) {
  const [turmaSelecionada, setTurmaSelecionada] = useState<string | null>(turmaId);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [materiaSelecionada, setMateriaSelecionada] = useState<string | null>(null);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaExpandida, setAulaExpandida] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [aulaParaEditar, setAulaParaEditar] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------
  // Carregar turmas (apenas para professor)
  // ------------------------------
  const carregarTurmas = async () => {
    if (userRole !== "professor") return;

    try {
      const data = await getTurmas(userId);
      setTurmas(data);

      // Se houver turmas e nenhuma selecionada, seleciona a primeira
      if (data.length > 0 && !turmaSelecionada) {
        setTurmaSelecionada(data[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
    }
  };

  // ------------------------------
  // Carregar dados da API
  // ------------------------------
  const carregarAulas = async (turmaIdParam?: string) => {
    try {
      setLoading(true);
      const turmaParaBuscar = turmaIdParam || turmaSelecionada;
      const data = await buscarAulas(turmaParaBuscar || undefined);
      setAulas(data);
    } catch (err) {
      console.error("Erro ao carregar aulas:", err);
    } finally {
      setLoading(false);
    }
  };

  const carregarMaterias = async (turmaIdParam?: string) => {
    try {
      const turmaParaBuscar = turmaIdParam || turmaSelecionada;
      const data = await buscarMaterias(turmaParaBuscar || undefined);
      setMaterias(data);
    } catch (err) {
      console.error("Erro ao carregar matérias:", err);
    }
  };

  useEffect(() => {
    if (userRole === "professor") {
      carregarTurmas();
    } else {
      // Para alunos, carrega diretamente
      carregarAulas();
      carregarMaterias();
    }
  }, []);

  useEffect(() => {
    // Quando a turma selecionada muda, recarrega matérias e aulas
    if (turmaSelecionada) {
      carregarMaterias(turmaSelecionada);
      carregarAulas(turmaSelecionada);
      setMateriaSelecionada(null); // Reseta matéria selecionada
    }
  }, [turmaSelecionada]);

  // ------------------------------
  // Modal Handlers
  // ------------------------------
  const handleAbrirModalCriar = () => {
    if (!turmaSelecionada) {
      alert("Por favor, selecione uma turma antes de criar uma aula.");
      return;
    }

    if (materias.length === 0) {
      alert("Não há matérias disponíveis nesta turma.");
      return;
    }

    setAulaParaEditar(null);
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (aula: Aula) => {
    setAulaParaEditar(aula);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setAulaParaEditar(null);
  };

  const handleSalvarAula = async (aulaData: Partial<Aula>, materiais: MaterialComplementar[]) => {
    try {
      let aulaId: string;

      if (aulaParaEditar) {
        // Editando aula existente
        await atualizarAula(aulaData as Aula);
        aulaId = aulaParaEditar.id;
        alert("Aula atualizada com sucesso!");
      } else {
        // Criando nova aula
        const aulaCriada = await criarAula(aulaData);
        aulaId = aulaCriada.id;
        alert("Aula criada com sucesso!");
      }

      // Salvar materiais complementares novos
      const materiaisNovos = materiais.filter(m => !m.id || m.id === "");
      for (const material of materiaisNovos) {
        await criarMaterial({
          aula_id: aulaId,
          nome: material.nome,
          tipo: material.tipo,
          url: material.url,
        });
      }

      carregarAulas(turmaSelecionada || undefined);
    } catch (err: any) {
      console.error("Erro ao salvar aula:", err);
      alert(`Erro ao salvar aula: ${err.message}`);
      throw err;
    }
  };

  const handleDeletarAula = async (id: string, titulo: string) => {
    const confirmacao = confirm(`Tem certeza que deseja deletar a aula "${titulo}"?`);
    if (!confirmacao) return;

    try {
      await deletarAula(id);
      carregarAulas(turmaSelecionada || undefined);
      alert("Aula deletada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao deletar aula:", err);
      alert(`Erro ao deletar aula: ${err.message}`);
    }
  };

  // ------------------------------
  // Filtragem de aulas
  // ------------------------------
  const aulasFiltradas = materiaSelecionada
    ? aulas.filter(a => a.materia_id === materiaSelecionada)
    : aulas;

  // ------------------------------
  // Helpers
  // ------------------------------
  const getMateriaDaAula = (aula: Aula) => {
    return materias.find(m => m.id === aula.materia_id) || null;
  };

  const formatarData = (data?: string | Date) => {
    if (!data) return "—";
    const dateObj = typeof data === "string" ? new Date(data) : data;
    if (isNaN(dateObj.getTime())) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(dateObj);
  };

  const getIconeMaterial = (tipo: string) => {
    switch (tipo) {
      case "pdf": return <FileText size={16} />;
      case "video": return <Video size={16} />;
      case "link": return <LinkIcon size={16} />;
      case "imagem": return <Eye size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getCorMaterial = (tipo: string) => {
    switch (tipo) {
      case "pdf": return "text-red-500";
      case "video": return "text-purple-500";
      case "link": return "text-blue-500";
      case "imagem": return "text-green-500";
      default: return "text-gray-500";
    }
  };

  // ------------------------------
  // JSX
  // ------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <BookOpen className="text-blue-600" />
              Plano de Aulas
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Acompanhe suas aulas e materiais de estudo</p>
          </div>

          {userRole === "professor" && (
            <button
              onClick={handleAbrirModalCriar}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircle size={18} /> Nova Aula
            </button>
          )}
        </div>

        {/* Seletores de Turma e Matéria */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seletor de Turmas (apenas para professor) */}
            {userRole === "professor" && (
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <School className="text-blue-600" size={18} />
                  Turma
                </h2>
                <div className="flex flex-wrap gap-2">
                  {turmas.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      Voce nao esta lecionando em nenhuma turma.
                    </p>
                  ) : (
                    turmas.map(turma => (
                      <button
                        key={turma.id}
                        onClick={() => setTurmaSelecionada(turma.id)}
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
            )}

            {/* Seletor de Matérias */}
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                {userRole === "professor" ? "Materia" : "Materias"}
              </h2>
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
                {materias.map(m => (
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
          </div>
        </div>

        {/* Lista de Aulas */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-300">Carregando aulas...</p>
              </div>
            </div>
          ) : aulasFiltradas.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Nenhuma aula encontrada</h3>
            </div>
          ) : (
            aulasFiltradas.map(aula => {
              const materia = getMateriaDaAula(aula);
              return (
                <div
                  key={aula.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  {/* Cabeçalho da Aula */}
                  <div className="p-6 flex justify-between">
                    <div className="flex-1">
                      {materia && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
                          {materia.nome}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{aula.titulo}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">{aula.descricao}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={16} /> {formatarData(aula.data_publicacao)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={16} /> {aula.materiais_complementares.length} material
                          {aula.materiais_complementares.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-start">
                      {userRole === "professor" && (
                        <>
                          <button
                            onClick={() => handleDeletarAula(aula.id, aula.titulo)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                            title="Deletar aula"
                          >
                            <Trash size={18} />
                          </button>
                          <button
                            onClick={() => handleAbrirModalEditar(aula)}
                            className="p-2 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded transition"
                            title="Editar aula"
                          >
                            <Edit size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => setAulaExpandida(aulaExpandida === aula.id ? null : aula.id)}
                        className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                        title={aulaExpandida === aula.id ? "Recolher" : "Expandir"}
                      >
                        {aulaExpandida === aula.id ? "↑" : "↓"}
                      </button>
                    </div>
                  </div>

                  {/* Conteúdo Expandido */}
                  {aulaExpandida === aula.id && (
                    <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Plano de Estudo</h4>
<p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
  {aula.plano_estudo}
</p>
                      {aula.materiais_complementares.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Materiais Complementares</h4>
                          <div className="space-y-2">
                            {aula.materiais_complementares.map((m: MaterialComplementar) => (
                              <div key={m.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                                <span className={getCorMaterial(m.tipo)}>{getIconeMaterial(m.tipo)}</span>
                                <a
                                  href={m.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline flex-1"
                                >
                                  {m.nome}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Criar/Editar Aula */}
      {turmaSelecionada && (
        <ModalAula
          isOpen={modalAberto}
          onClose={handleFecharModal}
          onSave={handleSalvarAula}
          aula={aulaParaEditar}
          materias={materias}
          turmaId={turmaSelecionada}
          professorId={userId}
        />
      )}
    </div>
  );
}
