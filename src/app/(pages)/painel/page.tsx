import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { BookOpen, Users, BarChart3, Award } from "lucide-react";

export default async function Painel() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const user = session.user;
  
  // Conteúdo personalizado por role
  const roleConfig = {
    aluno: {
      title: "Área de Aprendizado",
      subtitle: "Continue sua jornada educacional",
      welcomeMessage: `Bem-vindo de volta, ${user.name}!`,
      features: [
        { icon: BookOpen, label: "Plano de Aulas", description: "Acesse suas aulas", href: "/planodeaulas" },
        { icon: Award, label: "Avaliações e Testes", description: "Valide o conhecimento adquirido", href: "/avaliacoes" },
        { icon: BarChart3, label: "Desempenho", description: "Analise seu rendimento", href: "/desempenho" },
      ]
    },
    professor: {
      title: "Painel do Educador",
      subtitle: "Gerencie suas turmas e conteúdos",
      welcomeMessage: `Olá, Professor(a) ${user.name}!`,
      features: [
        { icon: Users, label: "Minhas Turmas", description: "Gerencie suas turmas", href: "/turmas" },
        { icon: BookOpen, label: "Plano de Aulas", description: "Crie e edite aulas", href: "/planodeaulas" },
        { icon: Award, label: "Avaliações e Testes", description: "Aplique testes e avaliações ao alunos", href: "/avaliacoes" },
        { icon: BarChart3, label: "Desempenho", description: "Analise o desempenho dos alunos", href: "/desempenho" },
      ]
    },
    responsavel: {
      title: "Acompanhamento Familiar",
      subtitle: "Acompanhe o desenvolvimento educacional",
      welcomeMessage: `Olá, ${user.name}!`,
      features: [
        { icon: Users, label: "Estudantes", description: "Acompanhe os estudantes vinculados", href: "/estudantes" },
        { icon: Award, label: "Desempenho", description: "Verifique o rendimento escolar", href: "/desempenho" },
      ]
    },
    
  };

  const config = roleConfig[user.role as keyof typeof roleConfig];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {config.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {config.subtitle}
              </p>
              <p className="text-lg text-blue-600 dark:text-blue-400 mt-4">
                {config.welcomeMessage}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
       {/* Features Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {config.features.map((feature, index) => {
    const IconComponent = feature.icon;
    return (
      <a
        key={index}
        href={feature.href ?? "#"} // fallback para "#" caso não tenha href
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 block"
      >
        <div className="flex items-center mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          {feature.label}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {feature.description}
        </p>
      </a>
    );
  })}
</div>


       
      </div>
    </div>
  );
}