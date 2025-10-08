"use client";

import { useState, useEffect } from "react";
import { Users, UserPlus, Edit, Trash2, Search, BookOpen, Mail, User as UserIcon, IdCard } from "lucide-react";
import { toast } from "react-toastify";
import { Turma } from "@/app/types/turma";
import { Aluno, Responsavel } from "@/app/types/users";
import { getTurmas, getAlunos, getResponsaveis, addAluno, updateAluno, deleteAluno } from "@/app/services/turmas";
import { Card, CardHeader } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { EmptyState } from "@/app/components/ui/EmptyState";
import { LoadingSpinner } from "@/app/components/ui/LoadingSpinner";
import { Modal } from "@/app/components/ui/Modal";
import { Input } from "@/app/components/ui/Input";
import { TableCard, TableRow, TableCell, MobileCard } from "@/app/components/ui/TableCard";
import { useIsMobile } from "@/app/hooks/useMediaQuery";

interface TurmasClientProps {
  userId: string;
  userRole: string;
}

export default function TurmasClient({ userId, userRole }: TurmasClientProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [alunosTurma, setAlunosTurma] = useState<Aluno[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    matricula: "",
    turma_id: "",
    responsavel_id: ""
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [turmasRes, alunosRes, responsaveisRes] = await Promise.all([
        userRole === "professor" ? getTurmas(userId) : getTurmas(),
        getAlunos(),
        getResponsaveis()
      ]);
      setTurmas(turmasRes);
      setAlunos(alunosRes);
      setResponsaveis(responsaveisRes);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar dados. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (turmaSelecionada) {
      setAlunosTurma(alunos.filter(a => a.turma_id === turmaSelecionada.id));
      setFormData(prev => ({ ...prev, turma_id: turmaSelecionada.id }));
    } else {
      setAlunosTurma([]);
    }
  }, [turmaSelecionada, alunos]);

  const alunosFiltrados = alunosTurma.filter(aluno =>
    aluno.name.toLowerCase().includes(busca.toLowerCase()) ||
    aluno.matricula.includes(busca) ||
    aluno.email.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirModalNovoAluno = () => {
    if (!turmaSelecionada) {
      toast.warning("Selecione uma turma primeiro");
      return;
    }
    setModoEdicao(false);
    setAlunoEditando(null);
    setFormData({
      name: "",
      email: "",
      matricula: "",
      turma_id: turmaSelecionada?.id || "",
      responsavel_id: ""
    });
    setModalAberto(true);
  };

  const abrirModalEditarAluno = (aluno: Aluno) => {
    setModoEdicao(true);
    setAlunoEditando(aluno);
    setFormData({
      name: aluno.name,
      email: aluno.email,
      matricula: aluno.matricula,
      turma_id: aluno.turma_id,
      responsavel_id: aluno.responsavel_id || ""
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setAlunoEditando(null);
    setFormData({
      name: "",
      email: "",
      matricula: "",
      turma_id: "",
      responsavel_id: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (modoEdicao && alunoEditando) {
        await updateAluno(alunoEditando.id, formData);
        toast.success("Aluno atualizado com sucesso!");
      } else {
        await addAluno({
          ...formData,
          password: "temp123",
          role: "aluno",
          created_at: new Date()
        });
        toast.success("Aluno adicionado com sucesso!");
      }
      await fetchData();
      fecharModal();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar aluno. Tente novamente.");
    }
  };

  const excluirAluno = async (aluno: Aluno) => {
    if (!confirm(`Deseja realmente excluir o aluno ${aluno.name}?`)) return;
    try {
      await deleteAluno(aluno.id);
      toast.success("Aluno excluído com sucesso!");
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir aluno. Tente novamente.");
    }
  };

  const getResponsavel = (id?: string) => {
    if (!id) return null;
    return responsaveis.find(r => r.id === id);
  };

  const getTurnoTexto = (turno: string) => {
    switch (turno) {
      case 'manha': return 'Manhã';
      case 'tarde': return 'Tarde';
      case 'noite': return 'Noite';
      default: return turno;
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Carregando turmas..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader
            icon={<Users size={32} />}
            title="Minhas Turmas"
            subtitle="Gerencie turmas e alunos"
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de Turmas */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Turmas ({turmas.length})
              </h2>
              <div className="space-y-2">
                {turmas.map(turma => (
                  <button
                    key={turma.id}
                    onClick={() => setTurmaSelecionada(turma)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      turmaSelecionada?.id === turma.id
                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="font-medium">{turma.nome}</div>
                    <div className="text-sm opacity-75">
                      {getTurnoTexto(turma.turno ?? "")} • {turma.serie}
                    </div>
                    <div className="text-xs opacity-60 mt-1">
                      {alunos.filter(a => a.turma_id === turma.id).length} alunos
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Lista de Alunos */}
          <div className="lg:col-span-3">
            {turmaSelecionada ? (
              <Card>
                {/* Header da Turma */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {turmaSelecionada.nome}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {getTurnoTexto(turmaSelecionada.turno ?? "")} • {turmaSelecionada.serie} • {alunosTurma.length} alunos
                    </p>
                  </div>
                  <Button onClick={abrirModalNovoAluno} icon={<UserPlus size={20} />}>
                    Adicionar Aluno
                  </Button>
                </div>

                {/* Busca */}
                <div className="mb-4">
                  <Input
                    type="text"
                    placeholder="Buscar alunos..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    icon={<Search size={20} />}
                  />
                </div>

                {/* Lista de Alunos */}
                {alunosFiltrados.length === 0 ? (
                  <EmptyState
                    icon={<Users size={64} />}
                    title={busca ? "Nenhum aluno encontrado" : "Nenhum aluno nesta turma"}
                    description={busca ? "Tente buscar com outros termos" : "Adicione alunos para começar"}
                    action={!busca ? {
                      label: "Adicionar Primeiro Aluno",
                      onClick: abrirModalNovoAluno,
                      icon: <UserPlus size={20} />
                    } : undefined}
                  />
                ) : (
                  <>
                    {isMobile ? (
                      <div className="space-y-3">
                        {alunosFiltrados.map(aluno => {
                          const resp = getResponsavel(aluno.responsavel_id);
                          return (
                            <MobileCard
                              key={aluno.id}
                              data={[
                                { label: "Nome", value: aluno.name },
                                { label: "Email", value: aluno.email },
                                { label: "Matrícula", value: aluno.matricula },
                                { label: "Responsável", value: resp ? `${resp.name} (${resp.telefone || "-"})` : "Não vinculado" }
                              ]}
                              actions={
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => abrirModalEditarAluno(aluno)}
                                    icon={<Edit size={16} />}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => excluirAluno(aluno)}
                                    icon={<Trash2 size={16} />}
                                  >
                                    Excluir
                                  </Button>
                                </>
                              }
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <TableCard headers={["Aluno", "Email", "Matrícula", "Responsável", "Ações"]}>
                        {alunosFiltrados.map(aluno => {
                          const resp = getResponsavel(aluno.responsavel_id);
                          return (
                            <TableRow key={aluno.id}>
                              <TableCell>{aluno.name}</TableCell>
                              <TableCell>{aluno.email}</TableCell>
                              <TableCell>{aluno.matricula}</TableCell>
                              <TableCell>{resp ? `${resp.name} (${resp.telefone || "-"})` : "Não vinculado"}</TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => abrirModalEditarAluno(aluno)}
                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                                    aria-label="Editar aluno"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => excluirAluno(aluno)}
                                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                                    aria-label="Excluir aluno"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableCard>
                    )}
                  </>
                )}
              </Card>
            ) : (
              <Card>
                <EmptyState
                  icon={<BookOpen size={64} />}
                  title="Selecione uma turma"
                  description="Escolha uma turma à esquerda para ver os alunos"
                />
              </Card>
            )}
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalAberto}
          onClose={fecharModal}
          title={modoEdicao ? "Editar Aluno" : "Adicionar Aluno"}
          size="md"
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={fecharModal} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" form="form-aluno" className="flex-1">
                {modoEdicao ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          }
        >
          <form id="form-aluno" onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome"
              type="text"
              placeholder="Nome completo"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              icon={<UserIcon size={20} />}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              icon={<Mail size={20} />}
              required
            />
            <Input
              label="Matrícula"
              type="text"
              placeholder="000000"
              value={formData.matricula}
              onChange={e => setFormData({...formData, matricula: e.target.value})}
              icon={<IdCard size={20} />}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsável
              </label>
              <select
                value={formData.responsavel_id}
                onChange={e => setFormData({...formData, responsavel_id: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecionar responsável (opcional)</option>
                {responsaveis.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
