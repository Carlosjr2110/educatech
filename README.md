# EducaTech - Plataforma de Gestão Educacional

Sistema MVP de gestão educacional desenvolvido com Next.js 15, TypeScript, Supabase, AWS e integração com IA (Google Gemini) para auxiliar professores, alunos e responsáveis no processo de ensino-aprendizagem.

## ✨ Características

- 🎓 **Gestão de Turmas e Alunos** - Organização completa de turmas, matérias e estudantes
- 📚 **Plano de Aulas** - Criação e gerenciamento de aulas com materiais anexos
- 📝 **Avaliações e Testes** - Sistema completo de avaliações com questões múltipla escolha e V/F
- 📊 **Análise de Desempenho** - Dashboard com métricas detalhadas de performance dos alunos
- 🤖 **IA Integrada** - Geração automática de conteúdo educacional com Google Gemini
  - Planos de aula personalizados
  - Questões de avaliação
  - Sugestões de reforço acadêmico
- 📁 **Armazenamento em Nuvem** - Upload e gerenciamento de arquivos com AWS S3
- 🔐 **Autenticação Segura** - Sistema de login com NextAuth e múltiplos roles
- 🌓 **Dark Mode** - Interface adaptável com tema claro/escuro
- 📱 **Responsivo** - Design otimizado para desktop, tablet e mobile

## 🛠 Tecnologias

### Frontend
- **Next.js 15.5.3** - Framework React com App Router e Turbopack
- **React 19.1** - Biblioteca JavaScript para interfaces
- **TypeScript 5** - Superset JavaScript com tipagem estática
- **Tailwind CSS 4** - Framework CSS utility-first
- **Lucide React** - Biblioteca de ícones

### Backend & Infraestrutura
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Storage)
- **NextAuth 4.24** - Autenticação e gerenciamento de sessões
- **AWS S3** - Armazenamento de arquivos e materiais didáticos

### IA & APIs
- **Google Gemini AI** - Geração de conteúdo educacional
- **@google/generative-ai** - SDK oficial do Google Gemini

### Outras Bibliotecas
- **React Toastify** - Notificações toast
- **@aws-sdk** - SDK da AWS para integração S3

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn** ou **pnpm**
- **Git**

## 🎮 Executando o Projeto

```bash
npm install
```

### Modo Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Modo Produção

```bash
npm run build
npm run start
```

## 📁 Estrutura do Projeto

```
educatech/
├── src/
│   ├── app/
│   │   ├── (pages)/              # Páginas da aplicação
│   │   │   ├── avaliacoes/       # Avaliações e testes
│   │   │   ├── desempenho/       # Dashboard de desempenho
│   │   │   ├── estudantes/       # Gestão de estudantes (responsável)
│   │   │   ├── painel/           # Painel principal
│   │   │   ├── planodeaulas/     # Plano de aulas
│   │   │   └── turmas/           # Gestão de turmas
│   │   ├── api/                  # API Routes
│   │   │   ├── ai/               # Endpoints de IA
│   │   │   ├── auth/             # NextAuth
│   │   │   ├── avaliacoes/       # CRUD de avaliações
│   │   │   ├── desempenho/       # Dados de desempenho
│   │   │   └── turmas/           # CRUD de turmas
│   │   ├── components/           # Componentes React
│   │   │   ├── modal/            # Modais
│   │   │   └── ui/               # Componentes de UI
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # Camada de serviços
│   │   ├── types/                # Definições TypeScript
│   │   ├── globals.css           # Estilos globais
│   │   ├── layout.tsx            # Layout principal
│   │   ├── page.tsx              # Página de login
│   │   └── providers.tsx         # Providers React
│   ├── lib/                      # Bibliotecas e configurações
│   │   └── supabase.ts           # Cliente Supabase
│   └── middleware.ts             # Middleware Next.js
├── public/                       # Arquivos estáticos
├── .env                          # Variáveis de ambiente
├── package.json                  # Dependências
├── tailwind.config.ts            # Configuração Tailwind
├── tsconfig.json                 # Configuração TypeScript
└── README.md                     # Este arquivo
```

## 🎯 Funcionalidades

### Para Professores

#### 📚 Gestão de Turmas
- Criar e gerenciar turmas
- Adicionar matérias e associar professores
- Visualizar lista de alunos por turma

#### 📖 Plano de Aulas
- Criar aulas com título, descrição e materiais
- Upload de arquivos para AWS S3
- Gerar plano de estudos automaticamente com IA
- Sugestões de materiais complementares com IA
- Editar e deletar aulas

#### 📝 Avaliações e Testes
- Criar avaliações personalizadas
- Gerar questões automaticamente com IA
  - Múltipla escolha (4 alternativas)
  - Verdadeiro ou Falso
- Definir nota máxima e data de entrega
- Visualizar submissões dos alunos
- Correção automática

#### 📊 Análise de Desempenho
- Selecionar turma e aluno para visualizar
- Métricas detalhadas:
  - Pontuação geral (taxa conclusão + notas + pontualidade)
  - Taxa de conclusão de avaliações
  - Média de notas (em pontos, não porcentagem)
  - Entregas no prazo
- Progresso por matéria
- Ranking da turma (calculado em tempo real)
- Pontos fortes e áreas de melhoria
- **Sugestões de reforço com IA** - Plano personalizado para cada aluno

### Para Alunos

#### 📚 Plano de Aulas
- Visualizar aulas disponíveis
- Acessar materiais e plano de estudos
- Download de arquivos

#### 📝 Realizar Avaliações
- Listar avaliações disponíveis
- Status: disponível, concluído ou atrasado
- Realizar avaliações com timer
- Visualizar nota após conclusão

#### 📊 Acompanhar Desempenho
- Visualizar próprio desempenho
- Métricas individuais
- Ranking na turma
- Identificar pontos fortes e fracos

### Para Responsáveis

#### 👨‍👩‍👧 Gestão de Estudantes
- Visualizar lista de filhos vinculados
- Acessar informações de turma e matérias

#### 📊 Monitoramento
- Acompanhar desempenho dos filhos
- Visualizar notas e frequência
- Receber insights de áreas que precisam atenção

## 🔐 Roles e Permissões

### Professor
- Acesso total a turmas que leciona
- Criar e gerenciar conteúdo educacional
- Visualizar desempenho de todos os alunos das suas turmas
- Utilizar recursos de IA para criação de conteúdo

### Aluno
- Acesso a conteúdo da própria turma
- Realizar avaliações
- Visualizar apenas o próprio desempenho

### Responsável
- Acesso aos dados dos filhos vinculados
- Visualização read-only de desempenho
- Não pode editar conteúdo

## 🔌 API Routes

### Autenticação
- `POST /api/auth/[...nextauth]` - Autenticação via NextAuth

### Turmas
- `GET /api/turmas` - Listar turmas do professor
- `POST /api/turmas` - Criar turma
- `PUT /api/turmas` - Atualizar turma
- `DELETE /api/turmas` - Deletar turma

### Avaliações
- `GET /api/avaliacoes` - Listar avaliações (filtrado por role)
- `POST /api/avaliacoes` - Criar avaliação
- `PUT /api/avaliacoes` - Editar avaliação
- `DELETE /api/avaliacoes` - Deletar avaliação
- `GET /api/avaliacoes/[id]/perguntas` - Buscar perguntas
- `POST /api/avaliacoes/[id]/submeter` - Submeter respostas

### Desempenho
- `GET /api/desempenho` - Buscar desempenho do aluno
- `GET /api/desempenho/alunos` - Listar alunos do professor

### IA (Gemini)
- `POST /api/ai/gerar-aula` - Gerar plano de aula com IA
- `POST /api/ai/gerar-avaliacao` - Gerar questões com IA
- `POST /api/ai/sugestoes-reforco` - Gerar sugestões de reforço


## 👥 Autores

- **Carlos Humberto Chaves Junior** - *Desenvolvimento Inicial*

