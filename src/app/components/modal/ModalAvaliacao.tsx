"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Sparkles } from "lucide-react";
import { getTurmas } from "@/app/services/turmas";
import { Turma } from "@/app/types/turma";

interface Pergunta {
  enunciado: string;
  tipo: "multipla-escolha" | "verdadeiro-falso" | "resposta-curta";
  opcoes?: string[];
  resposta_correta: string[] | string;
}

interface ModalAvaliacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (avaliacao: any) => Promise<void>;
  userId: string;
  materias: any[];
  avaliacaoParaEditar?: any;
  perguntasIniciais?: Pergunta[];
  turmaSelecionadaInicial?: string | null;
  materiaSelecionadaInicial?: string | null;
}

export default function ModalAvaliacao({
  isOpen,
  onClose,
  onSalvar,
  userId,
  materias,
  avaliacaoParaEditar,
  perguntasIniciais = [],
  turmaSelecionadaInicial,
  materiaSelecionadaInicial
}: ModalAvaliacaoProps) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [turmaSelecionada, setTurmaSelecionada] = useState("");
  const [materiaSelecionada, setMateriaSelecionada] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [notaMaxima, setNotaMaxima] = useState(10);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiFormData, setAIFormData] = useState({
    tema: "",
    nivel: "",
    numeroQuestoes: 10,
    tipoQuestoes: "multipla-escolha"
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getTurmas(userId).then(setTurmas);

      // Se for edicao, preencher formulario
      if (avaliacaoParaEditar) {
        setTitulo(avaliacaoParaEditar.titulo || "");
        setDescricao(avaliacaoParaEditar.descricao || "");
        // Importante: setar turma antes da materia para desbloquear o campo
        const turmaId = avaliacaoParaEditar.turma_id || "";
        setTurmaSelecionada(turmaId);
        // Aguardar um momento para que o filtro de materias seja aplicado
        setTimeout(() => {
          setMateriaSelecionada(avaliacaoParaEditar.materia_id || "");
        }, 0);
        setDataEntrega(avaliacaoParaEditar.data_entrega || "");
        setNotaMaxima(avaliacaoParaEditar.avaliacao?.[0]?.nota_maxima || 10);
        setPerguntas(perguntasIniciais);
      } else {
        // Ao criar nova avaliacao, preencher com valores selecionados na pagina
        setTitulo("");
        setDescricao("");
        setTurmaSelecionada(turmaSelecionadaInicial || "");
        setMateriaSelecionada(materiaSelecionadaInicial || "");
        setDataEntrega("");
        setNotaMaxima(10);
        setPerguntas([]);
      }
    }
  }, [isOpen, userId, avaliacaoParaEditar, perguntasIniciais, turmaSelecionadaInicial, materiaSelecionadaInicial]);

  const materiasFiltradasPorTurma = materias.filter(
    (m) => m.turma_id === turmaSelecionada
  );

  const adicionarPergunta = () => {
    setPerguntas([
      ...perguntas,
      {
        enunciado: "",
        tipo: "multipla-escolha",
        opcoes: ["", "", "", ""],
        resposta_correta: []
      }
    ]);
  };

  const removerPergunta = (index: number) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const atualizarPergunta = (index: number, campo: string, valor: any) => {
    const novasPerguntas = [...perguntas];
    if (campo === "tipo") {
      // Resetar opcoes e resposta ao mudar tipo
      if (valor === "multipla-escolha") {
        novasPerguntas[index] = {
          ...novasPerguntas[index],
          tipo: valor,
          opcoes: ["", "", "", ""],
          resposta_correta: []
        };
      } else if (valor === "verdadeiro-falso") {
        novasPerguntas[index] = {
          ...novasPerguntas[index],
          tipo: valor,
          opcoes: ["Verdadeiro", "Falso"],
          resposta_correta: []
        };
      } else {
        novasPerguntas[index] = {
          ...novasPerguntas[index],
          tipo: valor,
          opcoes: undefined,
          resposta_correta: ""
        };
      }
    } else {
      (novasPerguntas[index] as any)[campo] = valor;
    }
    setPerguntas(novasPerguntas);
  };

  const atualizarOpcao = (perguntaIndex: number, opcaoIndex: number, valor: string) => {
    const novasPerguntas = [...perguntas];
    if (novasPerguntas[perguntaIndex].opcoes) {
      novasPerguntas[perguntaIndex].opcoes![opcaoIndex] = valor;
      setPerguntas(novasPerguntas);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo || !turmaSelecionada || !materiaSelecionada || perguntas.length === 0) {
      alert("Preencha todos os campos obrigatórios e adicione pelo menos uma pergunta");
      return;
    }

    // Validar perguntas
    for (const p of perguntas) {
      if (!p.enunciado) {
        alert("Todas as perguntas devem ter um enunciado");
        return;
      }
      if (p.tipo !== "resposta-curta" && (!p.resposta_correta || (Array.isArray(p.resposta_correta) && p.resposta_correta.length === 0))) {
        alert("Todas as perguntas devem ter uma resposta correta marcada");
        return;
      }
    }

    const avaliacao = {
      ...(avaliacaoParaEditar ? { id: avaliacaoParaEditar.id } : {}),
      titulo,
      descricao,
      turma_id: turmaSelecionada,
      materia_id: materiaSelecionada,
      data_entrega: dataEntrega || null,
      nota_maxima: notaMaxima,
      perguntas: perguntas.map(p => ({
        ...p,
        opcoes: p.tipo === "resposta-curta" ? null : p.opcoes
      }))
    };

    await onSalvar(avaliacao);
    limparFormulario();
    onClose();
  };

  const handleGerarComIA = async () => {
    if (!aiFormData.tema) {
      alert("Por favor, preencha o tema da avaliacao");
      return;
    }

    if (!materiaSelecionada) {
      alert("Por favor, selecione uma materia primeiro");
      return;
    }

    setIsGenerating(true);

    try {
      const materiaNome = materias.find(m => m.id === materiaSelecionada)?.nome || "";

      const response = await fetch("/api/ai/gerar-avaliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materia: materiaNome,
          tema: aiFormData.tema,
          nivel: aiFormData.nivel,
          numeroQuestoes: aiFormData.numeroQuestoes,
          tipoQuestoes: aiFormData.tipoQuestoes
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar avaliacao");
      }

      const data = await response.json();

      // Preenche os campos do formulario
      setTitulo(data.titulo);
      setDescricao(data.descricao);
      setPerguntas(data.perguntas || []);

      setShowAIModal(false);
      setAIFormData({ tema: "", nivel: "", numeroQuestoes: 10, tipoQuestoes: "multipla-escolha" });
      alert("Avaliacao gerada com sucesso! Revise e ajuste conforme necessario.");
    } catch (error: any) {
      console.error("Erro ao gerar avaliacao:", error);
      alert(error.message || "Erro ao gerar avaliacao com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const limparFormulario = () => {
    setTitulo("");
    setDescricao("");
    setTurmaSelecionada("");
    setMateriaSelecionada("");
    setDataEntrega("");
    setNotaMaxima(10);
    setPerguntas([]);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {avaliacaoParaEditar ? "Editar Avaliacao" : "Nova Avaliacao"}
            </h2>
            <div className="flex items-center gap-2">
              {!avaliacaoParaEditar && (
                <button
                  type="button"
                  onClick={() => setShowAIModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
                >
                  <Sparkles size={18} />
                  Gerar com IA
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Informações Básicas
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Turma *
                </label>
                <select
                  value={turmaSelecionada}
                  onChange={(e) => {
                    setTurmaSelecionada(e.target.value);
                    setMateriaSelecionada("");
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Selecione uma turma</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} - {t.serie}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matéria *
                </label>
                <select
                  value={materiaSelecionada}
                  onChange={(e) => setMateriaSelecionada(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  disabled={!turmaSelecionada}
                >
                  <option value="">Selecione uma matéria</option>
                  {materiasFiltradasPorTurma.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Data de Entrega
                </label>
                <input
                  type="datetime-local"
                  value={dataEntrega}
                  onChange={(e) => setDataEntrega(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nota Máxima *
                </label>
                <input
                  type="number"
                  value={notaMaxima}
                  onChange={(e) => setNotaMaxima(Number(e.target.value))}
                  min="1"
                  step="0.5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Perguntas */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Perguntas ({perguntas.length})
              </h3>
              <button
                type="button"
                onClick={adicionarPergunta}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} /> Adicionar Pergunta
              </button>
            </div>

            {perguntas.map((pergunta, pIndex) => (
              <div
                key={pIndex}
                className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg space-y-4 bg-gray-50 dark:bg-gray-700/30"
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Pergunta {pIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerPergunta(pIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipo de Pergunta
                  </label>
                  <select
                    value={pergunta.tipo}
                    onChange={(e) => atualizarPergunta(pIndex, "tipo", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="multipla-escolha">Múltipla Escolha</option>
                    <option value="verdadeiro-falso">Verdadeiro/Falso</option>
                    <option value="resposta-curta">Resposta Curta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enunciado
                  </label>
                  <textarea
                    value={pergunta.enunciado}
                    onChange={(e) =>
                      atualizarPergunta(pIndex, "enunciado", e.target.value)
                    }
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {pergunta.tipo === "multipla-escolha" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Opções (marque a correta)
                    </label>
                    {pergunta.opcoes?.map((opcao, oIndex) => (
                      <div key={oIndex} className="flex gap-2 items-center">
                        <input
                          type="radio"
                          name={`resposta-${pIndex}`}
                          checked={
                            Array.isArray(pergunta.resposta_correta) &&
                            pergunta.resposta_correta.includes(opcao)
                          }
                          onChange={() =>
                            atualizarPergunta(pIndex, "resposta_correta", [opcao])
                          }
                          className="w-4 h-4"
                        />
                        <input
                          type="text"
                          value={opcao}
                          onChange={(e) =>
                            atualizarOpcao(pIndex, oIndex, e.target.value)
                          }
                          placeholder={`Opção ${oIndex + 1}`}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {pergunta.tipo === "verdadeiro-falso" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resposta Correta
                    </label>
                    {["Verdadeiro", "Falso"].map((opcao) => (
                      <div key={opcao} className="flex gap-2 items-center">
                        <input
                          type="radio"
                          name={`resposta-${pIndex}`}
                          checked={
                            Array.isArray(pergunta.resposta_correta) &&
                            pergunta.resposta_correta.includes(opcao)
                          }
                          onChange={() =>
                            atualizarPergunta(pIndex, "resposta_correta", [opcao])
                          }
                          className="w-4 h-4"
                        />
                        <label className="text-gray-900 dark:text-white">{opcao}</label>
                      </div>
                    ))}
                  </div>
                )}

                {pergunta.tipo === "resposta-curta" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Resposta Correta (exata)
                    </label>
                    <input
                      type="text"
                      value={
                        typeof pergunta.resposta_correta === "string"
                          ? pergunta.resposta_correta
                          : ""
                      }
                      onChange={(e) =>
                        atualizarPergunta(pIndex, "resposta_correta", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Digite a resposta esperada"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                limparFormulario();
                onClose();
              }}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {avaliacaoParaEditar ? "Salvar Alterações" : "Criar Avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>

    {/* Modal de IA */}
    {showAIModal && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Gerar Avaliacao com IA
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure as opcoes para gerar questoes automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAIModal(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              disabled={isGenerating}
            >
              <X size={24} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Materia Selecionada *
              </label>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-900 dark:text-blue-200 font-medium">
                  {materias.find(m => m.id === materiaSelecionada)?.nome || "Selecione uma materia primeiro"}
                </p>
              </div>
              {!materiaSelecionada && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Volte e selecione uma materia antes de gerar com IA
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema da Avaliacao *
              </label>
              <input
                type="text"
                value={aiFormData.tema}
                onChange={(e) => setAIFormData(prev => ({ ...prev, tema: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Fotossintese, Guerra Fria, Equacoes do 2 grau..."
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel/Serie (opcional)
              </label>
              <input
                type="text"
                value={aiFormData.nivel}
                onChange={(e) => setAIFormData(prev => ({ ...prev, nivel: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 8 ano, Ensino Medio..."
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Numero de Questoes
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={aiFormData.numeroQuestoes}
                  onChange={(e) => setAIFormData(prev => ({ ...prev, numeroQuestoes: parseInt(e.target.value) || 10 }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isGenerating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tipo de Questoes
                </label>
                <select
                  value={aiFormData.tipoQuestoes}
                  onChange={(e) => setAIFormData(prev => ({ ...prev, tipoQuestoes: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isGenerating}
                >
                  <option value="multipla-escolha">Multipla Escolha</option>
                  <option value="verdadeiro-falso">Verdadeiro ou Falso</option>
                  <option value="misto">Misto</option>
                </select>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-900 dark:text-purple-200">
                <strong>Dica:</strong> A IA gerara questoes baseadas no tema e nivel informados. Voce podera revisar e ajustar as questoes antes de salvar.
              </p>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowAIModal(false)}
              disabled={isGenerating}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGerarComIA}
              disabled={isGenerating || !materiaSelecionada}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Gerar Questoes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
