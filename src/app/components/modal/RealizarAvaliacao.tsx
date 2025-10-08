"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, Clock } from "lucide-react";
import { buscarPerguntas, submeterRespostas } from "@/app/services/avaliacoes";

interface Pergunta {
  id: string;
  enunciado: string;
  tipo: "multipla-escolha" | "verdadeiro-falso" | "resposta-curta";
  opcoes?: string[];
}

interface RealizarAvaliacaoProps {
  isOpen: boolean;
  onClose: () => void;
  avaliacao: any;
  onConcluir: () => void;
}

export default function RealizarAvaliacao({
  isOpen,
  onClose,
  avaliacao,
  onConcluir
}: RealizarAvaliacaoProps) {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  useEffect(() => {
    if (isOpen && avaliacao) {
      carregarPerguntas();
    }
  }, [isOpen, avaliacao]);

  const carregarPerguntas = async () => {
    setLoading(true);
    try {
      const data = await buscarPerguntas(avaliacao.id);
      setPerguntas(data);
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResposta = (perguntaId: string, resposta: any) => {
    setRespostas({
      ...respostas,
      [perguntaId]: resposta
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se todas as perguntas foram respondidas
    const perguntasNaoRespondidas = perguntas.filter(p => !respostas[p.id]);
    if (perguntasNaoRespondidas.length > 0) {
      if (!confirm(`Você ainda tem ${perguntasNaoRespondidas.length} pergunta(s) não respondida(s). Deseja enviar mesmo assim?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await submeterRespostas(avaliacao.id, respostas);
      setResultado(result);
    } catch (error: any) {
      alert("Erro ao submeter avaliação: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fechar = () => {
    setPerguntas([]);
    setRespostas({});
    setResultado(null);
    onClose();
    if (resultado) {
      onConcluir();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {avaliacao?.titulo}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {avaliacao?.materia?.nome} • Nota máxima: {avaliacao?.avaliacao?.[0]?.nota_maxima}
            </p>
          </div>
          <button
            onClick={fechar}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : resultado ? (
            <div className="text-center py-12 space-y-6">
              <CheckCircle className="mx-auto text-green-500" size={64} />
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Avaliação Concluída!
                </h3>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  Sua nota: <span className="font-bold text-blue-600">{resultado.nota.toFixed(1)}</span> / {resultado.nota_maxima}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Acertos: {resultado.acertos} de {resultado.total} ({resultado.percentual.toFixed(1)}%)
                </p>
              </div>
              <button
                onClick={fechar}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {avaliacao?.descricao && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300">{avaliacao.descricao}</p>
                </div>
              )}

              {avaliacao?.data_entrega && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={16} />
                  Prazo de entrega: {new Date(avaliacao.data_entrega).toLocaleString('pt-BR')}
                </div>
              )}

              <div className="space-y-6">
                {perguntas.map((pergunta, index) => (
                  <div
                    key={pergunta.id}
                    className="p-6 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white font-medium mb-4">
                          {pergunta.enunciado}
                        </p>

                        {pergunta.tipo === "multipla-escolha" && (
                          <div className="space-y-2">
                            {pergunta.opcoes?.map((opcao, oIndex) => (
                              <label
                                key={oIndex}
                                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`pergunta-${pergunta.id}`}
                                  value={opcao}
                                  checked={
                                    Array.isArray(respostas[pergunta.id]) &&
                                    respostas[pergunta.id].includes(opcao)
                                  }
                                  onChange={() =>
                                    handleResposta(pergunta.id, [opcao])
                                  }
                                  className="w-4 h-4"
                                />
                                <span className="text-gray-900 dark:text-white">
                                  {opcao}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {pergunta.tipo === "verdadeiro-falso" && (
                          <div className="space-y-2">
                            {["Verdadeiro", "Falso"].map((opcao) => (
                              <label
                                key={opcao}
                                className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`pergunta-${pergunta.id}`}
                                  value={opcao}
                                  checked={
                                    Array.isArray(respostas[pergunta.id]) &&
                                    respostas[pergunta.id].includes(opcao)
                                  }
                                  onChange={() =>
                                    handleResposta(pergunta.id, [opcao])
                                  }
                                  className="w-4 h-4"
                                />
                                <span className="text-gray-900 dark:text-white">
                                  {opcao}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {pergunta.tipo === "resposta-curta" && (
                          <input
                            type="text"
                            value={respostas[pergunta.id] || ""}
                            onChange={(e) =>
                              handleResposta(pergunta.id, e.target.value)
                            }
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Digite sua resposta"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 pt-6 border-t border-gray-200 dark:border-gray-700 flex gap-4">
                <button
                  type="button"
                  onClick={fechar}
                  className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? "Enviando..." : "Enviar Avaliação"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
