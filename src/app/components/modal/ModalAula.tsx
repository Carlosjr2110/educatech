"use client";

import { useState, useEffect } from "react";
import { Aula, MaterialComplementar } from "@/app/types/aula";
import { Materia } from "@/app/types/materias";
import { X, Save, Upload, Trash2, Link as LinkIcon, FileText, Video, Image, Sparkles } from "lucide-react";
import { uploadArquivo, criarMaterial, deletarMaterial, buscarMateriaisAula } from "@/app/services/materiais";

interface ModalAulaProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aula: Partial<Aula>, materiais: MaterialComplementar[]) => Promise<void>;
  aula?: Aula | null;
  materias: Materia[];
  turmaId: string;
  professorId: string;
}

interface MaterialTemp {
  id?: string;
  nome: string;
  tipo: "video" | "pdf" | "link" | "imagem";
  url: string;
  file?: File;
  isUploading?: boolean;
  isNew?: boolean;
}

export default function ModalAula({
  isOpen,
  onClose,
  onSave,
  aula,
  materias,
  turmaId,
  professorId,
}: ModalAulaProps) {
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    plano_estudo: "",
    materia_id: "",
    data_publicacao: new Date().toISOString().split("T")[0],
    data_entrega: "",
  });

  const [materiais, setMateriais] = useState<MaterialTemp[]>([]);
  const [novoMaterial, setNovoMaterial] = useState({
    nome: "",
    tipo: "link" as "video" | "pdf" | "link" | "imagem",
    url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiFormData, setAIFormData] = useState({
    tema: "",
    serie: "",
    objetivos: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [materiaisSugeridos, setMateriaisSugeridos] = useState<any[]>([]);

  useEffect(() => {
    if (aula) {
      setFormData({
        titulo: aula.titulo || "",
        descricao: aula.descricao || "",
        plano_estudo: aula.plano_estudo || "",
        materia_id: aula.materia_id || "",
        data_publicacao: aula.data_publicacao
          ? new Date(aula.data_publicacao).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        data_entrega: aula.data_entrega
          ? new Date(aula.data_entrega).toISOString().split("T")[0]
          : "",
      });
      setMateriais(
        aula.materiais_complementares?.map(m => ({
          id: m.id,
          nome: m.nome,
          tipo: m.tipo,
          url: m.url,
          isNew: false,
        })) || []
      );
    } else {
      setFormData({
        titulo: "",
        descricao: "",
        plano_estudo: "",
        materia_id: materias[0]?.id || "",
        data_publicacao: new Date().toISOString().split("T")[0],
        data_entrega: "",
      });
      setMateriais([]);
      setMateriaisSugeridos([]);
    }
    setNovoMaterial({ nome: "", tipo: "link", url: "" });
  }, [aula, materias, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const aulaData: Partial<Aula> = {
        ...formData,
        turma_id: turmaId,
        professor_id: professorId,
        data_publicacao: new Date(formData.data_publicacao),
        data_entrega: formData.data_entrega ? new Date(formData.data_entrega) : undefined,
      };

      if (aula) {
        aulaData.id = aula.id;
      }

      // Converte materiais temp para MaterialComplementar
      const materiaisParaSalvar: MaterialComplementar[] = materiais
        .filter(m => m.url && !m.isUploading)
        .map(m => ({
          id: m.id || "",
          aula_id: aula?.id || "",
          nome: m.nome,
          tipo: m.tipo,
          url: m.url,
        }));

      await onSave(aulaData, materiaisParaSalvar);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar aula:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const detectarTipoArquivo = (file: File): "video" | "pdf" | "imagem" => {
    if (file.type.startsWith("video/")) return "video";
    if (file.type === "application/pdf") return "pdf";
    if (file.type.startsWith("image/")) return "imagem";
    return "pdf"; // default
  };

  const processarArquivo = async (file: File, nomeCustomizado?: string) => {
    const tipo = detectarTipoArquivo(file);
    const nome = nomeCustomizado || file.name;

    const materialTemp: MaterialTemp = {
      nome,
      tipo,
      url: "",
      file,
      isUploading: true,
      isNew: true,
    };

    setMateriais(prev => [...prev, materialTemp]);

    try {
      const url = await uploadArquivo(file, tipo);
      setMateriais(prev =>
        prev.map(m =>
          m.file === file ? { ...m, url, isUploading: false } : m
        )
      );
      return true;
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      setMateriais(prev => prev.filter(m => m.file !== file));
      alert(`Erro ao fazer upload de ${nome}: ${error.message}`);
      return false;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!novoMaterial.nome) {
      alert("Por favor, preencha o nome do material");
      return;
    }

    await processarArquivo(file, novoMaterial.nome);
    setNovoMaterial({ nome: "", tipo: novoMaterial.tipo, url: "" });
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);

    if (files.length === 0) return;

    // Processa todos os arquivos
    for (const file of files) {
      await processarArquivo(file);
    }
  };

  const handleAdicionarLink = () => {
    if (!novoMaterial.nome || !novoMaterial.url) {
      alert("Preencha nome e URL");
      return;
    }

    const materialTemp: MaterialTemp = {
      nome: novoMaterial.nome,
      tipo: novoMaterial.tipo,
      url: novoMaterial.url,
      isNew: true,
    };

    setMateriais(prev => [...prev, materialTemp]);
    setNovoMaterial({ nome: "", tipo: "link", url: "" });
  };

  const handleRemoverMaterial = async (material: MaterialTemp) => {
    // Se o material já existe no banco (tem id e não é novo), delete do banco
    if (material.id && !material.isNew && aula) {
      try {
        await deletarMaterial(material.id);
      } catch (error) {
        console.error("Erro ao deletar material:", error);
        alert("Erro ao deletar material");
        return;
      }
    }

    setMateriais(prev => prev.filter(m => m !== material));
  };

  const getIconePorTipo = (tipo: string) => {
    switch (tipo) {
      case "video": return <Video size={16} />;
      case "pdf": return <FileText size={16} />;
      case "link": return <LinkIcon size={16} />;
      case "imagem": return <Image size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const handleGerarComIA = async () => {
    if (!aiFormData.tema) {
      alert("Por favor, preencha pelo menos o tema da aula");
      return;
    }

    if (!formData.materia_id) {
      alert("Por favor, selecione uma matéria primeiro");
      return;
    }

    setIsGenerating(true);

    try {
      const materiaNome = materias.find(m => m.id === formData.materia_id)?.nome || "";

      const response = await fetch("/api/ai/gerar-aula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materia: materiaNome,
          tema: aiFormData.tema,
          serie: aiFormData.serie,
          objetivos: aiFormData.objetivos,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar aula");
      }

      const data = await response.json();

      // Preenche os campos do formulário
      setFormData(prev => ({
        ...prev,
        titulo: data.titulo,
        descricao: data.descricao,
        plano_estudo: data.plano_estudo,
      }));

      // Guarda materiais sugeridos para exibir como referência
      if (data.materiais_sugeridos && data.materiais_sugeridos.length > 0) {
        setMateriaisSugeridos(data.materiais_sugeridos);
      }

      setShowAIModal(false);
      setAIFormData({ tema: "", serie: "", objetivos: "" });
      alert("Aula gerada com sucesso! Veja os materiais sugeridos abaixo e arraste seus arquivos.");
    } catch (error: any) {
      console.error("Erro ao gerar aula:", error);
      alert(error.message || "Erro ao gerar aula com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {aula ? "Editar Aula" : "Nova Aula"}
            </h2>
            <div className="flex items-center gap-2">
              {!aula && (
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
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                disabled={isSubmitting}
              >
                <X size={24} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título da Aula *
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matéria *
            </label>
            <select
              name="materia_id"
              value={formData.materia_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Selecione uma matéria</option>
              {materias.map((materia) => (
                <option key={materia.id} value={materia.id}>
                  {materia.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plano de Estudo *
            </label>
            <textarea
              name="plano_estudo"
              value={formData.plano_estudo}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Publicação *
              </label>
              <input
                type="date"
                name="data_publicacao"
                value={formData.data_publicacao}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data de Entrega (opcional)
              </label>
              <input
                type="date"
                name="data_entrega"
                value={formData.data_entrega}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Seção de Materiais Complementares */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Materiais Complementares
            </h3>

            {/* Materiais Sugeridos pela IA */}
            {materiaisSugeridos.length > 0 && (
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                    Materiais Sugeridos pela IA
                  </h4>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                  Essas sao sugestoes de materiais. Baixe-os da internet e arraste para a area abaixo.
                </p>
                <ul className="space-y-2">
                  {materiaisSugeridos.map((material, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-purple-600 dark:text-purple-400 mt-0.5">
                        {getIconePorTipo(material.tipo)}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-purple-900 dark:text-purple-100">
                          {material.nome}
                        </p>
                        <p className="text-xs text-purple-700 dark:text-purple-300">
                          {material.descricao}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Área de Drag & Drop */}
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-xl p-8 mb-6 transition-all duration-200
                ${isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
                }
              `}
            >
              <div className="flex flex-col items-center justify-center text-center">
                <Upload
                  size={48}
                  className={`mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'} transition-colors`}
                />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {isDragging ? 'Solte os arquivos aqui!' : 'Arraste e solte arquivos aqui'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Suporta vídeos, PDFs e imagens • Múltiplos arquivos permitidos
                </p>

                {/* Indicador visual quando está arrastando */}
                {isDragging && (
                  <div className="absolute inset-0 pointer-events-none bg-blue-500/10 rounded-xl border-2 border-blue-500 animate-pulse" />
                )}
              </div>
            </div>

            {/* Lista de Materiais */}
            {materiais.length > 0 && (
              <div className="space-y-2 mb-4">
                {materiais.map((material, index) => (
                  <div
                    key={material.id || index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-blue-600 dark:text-blue-400">
                        {getIconePorTipo(material.tipo)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {material.nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {material.isUploading ? "Fazendo upload..." : material.url}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverMaterial(material)}
                      disabled={material.isUploading}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Adicionar Link Externo */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon size={18} className="text-gray-600 dark:text-gray-400" />
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  Adicionar Link Externo
                </h4>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={novoMaterial.nome}
                  onChange={(e) => setNovoMaterial(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Nome do link (ex: Vídeo no YouTube)"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={novoMaterial.url}
                    onChange={(e) => setNovoMaterial(prev => ({ ...prev, url: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarLink}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || materiais.some(m => m.isUploading)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {isSubmitting ? "Salvando..." : aula ? "Salvar Alterações" : "Criar Aula"}
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
                  Gerar Aula com IA
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Preencha as informações para gerar um plano de aula completo
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
                Matéria Selecionada *
              </label>
              <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-blue-900 dark:text-blue-200 font-medium">
                  {materias.find(m => m.id === formData.materia_id)?.nome || "Selecione uma matéria primeiro"}
                </p>
              </div>
              {!formData.materia_id && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Volte e selecione uma matéria antes de gerar com IA
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tema da Aula *
              </label>
              <input
                type="text"
                value={aiFormData.tema}
                onChange={(e) => setAIFormData(prev => ({ ...prev, tema: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Fotossíntese, Segunda Guerra Mundial, Equações do 2º grau..."
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Série/Nível (opcional)
              </label>
              <input
                type="text"
                value={aiFormData.serie}
                onChange={(e) => setAIFormData(prev => ({ ...prev, serie: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: 8º ano, Ensino Médio, Iniciante..."
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Objetivos de Aprendizagem (opcional)
              </label>
              <textarea
                value={aiFormData.objetivos}
                onChange={(e) => setAIFormData(prev => ({ ...prev, objetivos: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Ex: Compreender o processo de fotossíntese, identificar fatores que influenciam..."
                rows={3}
                disabled={isGenerating}
              />
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <p className="text-sm text-purple-900 dark:text-purple-200">
                💡 <strong>Dica:</strong> Quanto mais detalhes você fornecer, melhor será o resultado gerado pela IA.
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
              disabled={isGenerating || !formData.materia_id}
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
                  Gerar Aula
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
