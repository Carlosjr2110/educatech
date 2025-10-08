"use client";

import { useState, useEffect } from "react";
import { Aluno } from "@/app/types/users";
import { buscarAlunosPorResponsavel, buscarAulasPorAluno } from "@/app/services/estudantes";
import {
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Mail,
  IdCard,
  School,
  ChevronRight,
  FileText,
  Video,
  Link as LinkIcon,
  Eye,
} from "lucide-react";

interface EstudantesClientProps {
  userId: string;
}

export default function EstudantesClient({ userId }: EstudantesClientProps) {
  const [alunos, setAlunos] = useState<any[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any | null>(null);
  const [aulas, setAulas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [aulaExpandida, setAulaExpandida] = useState<string | null>(null);

  useEffect(() => {
    carregarAlunos();
  }, [userId]);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      const data = await buscarAlunosPorResponsavel(userId);
      setAlunos(data);

      // Seleciona o primeiro aluno automaticamente se houver
      if (data.length > 0) {
        selecionarAluno(data[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    } finally {
      setLoading(false);
    }
  };

  const selecionarAluno = async (aluno: any) => {
    setAlunoSelecionado(aluno);

    if (aluno.turma_id) {
      setLoadingAulas(true);
      try {
        const aulasData = await buscarAulasPorAluno(aluno.turma_id);
        setAulas(aulasData);
      } catch (error) {
        console.error("Erro ao carregar aulas:", error);
      } finally {
        setLoadingAulas(false);
      }
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (alunos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <GraduationCap className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Nenhum aluno vinculado
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Você não possui alunos vinculados à sua conta de responsável.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <GraduationCap className="text-blue-600" />
            Meus Estudantes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Acompanhe o desempenho e as atividades dos seus filhos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Alunos */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={20} />
                Alunos
              </h2>
              <div className="space-y-2">
                {alunos.map((aluno) => (
                  <button
                    key={aluno.id}
                    onClick={() => selecionarAluno(aluno)}
                    className={`w-full p-4 rounded-lg text-left transition ${
                      alunoSelecionado?.id === aluno.id
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                        : "bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {aluno.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {aluno.turmas?.nome || "Sem turma"}
                        </p>
                      </div>
                      <ChevronRight
                        className={`${
                          alunoSelecionado?.id === aluno.id
                            ? "text-blue-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detalhes do Aluno */}
          <div className="lg:col-span-2 space-y-6">
            {alunoSelecionado ? (
              <>
                {/* Informações do Aluno */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <IdCard size={24} className="text-blue-600" />
                    Informações do Aluno
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                        <User size={16} />
                        Nome Completo
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alunoSelecionado.name}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                        <Mail size={16} />
                        E-mail
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alunoSelecionado.email}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                        <IdCard size={16} />
                        Matrícula
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alunoSelecionado.matricula || "Não informada"}
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
                        <School size={16} />
                        Turma
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {alunoSelecionado.turmas?.nome || "Não atribuída"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Aulas da Turma */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <BookOpen size={24} className="text-blue-600" />
                    Aulas e Materiais
                  </h2>

                  {loadingAulas ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 dark:text-gray-300 mt-4">Carregando aulas...</p>
                    </div>
                  ) : aulas.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-300">
                        Nenhuma aula disponível para esta turma.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aulas.map((aula) => (
                        <div
                          key={aula.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {aula.materias && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
                                    {aula.materias.nome}
                                  </span>
                                )}
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {aula.titulo}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-1">
                                  {aula.descricao}
                                </p>
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={16} /> {formatarData(aula.data_publicacao)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FileText size={16} />
                                    {aula.materiais_complementares?.length || 0} material
                                    {aula.materiais_complementares?.length !== 1 ? "is" : ""}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  setAulaExpandida(aulaExpandida === aula.id ? null : aula.id)
                                }
                                className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
                              >
                                {aulaExpandida === aula.id ? "↑" : "↓"}
                              </button>
                            </div>

                            {/* Conteúdo Expandido */}
                            {aulaExpandida === aula.id && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                                  Plano de Estudo
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                                  {aula.plano_estudo}
                                </p>

                                {aula.materiais_complementares &&
                                  aula.materiais_complementares.length > 0 && (
                                    <div className="mt-4">
                                      <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
                                        Materiais Complementares
                                      </h4>
                                      <div className="space-y-2">
                                        {aula.materiais_complementares.map((material: any) => (
                                          <div
                                            key={material.id}
                                            className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                          >
                                            <span className={getCorMaterial(material.tipo)}>
                                              {getIconeMaterial(material.tipo)}
                                            </span>
                                            <a
                                              href={material.url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-blue-600 dark:text-blue-400 hover:underline flex-1"
                                            >
                                              {material.nome}
                                            </a>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
                <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Selecione um aluno para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
