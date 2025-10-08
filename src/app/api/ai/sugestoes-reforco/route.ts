import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { materias, nomeAluno, serie } = await request.json();

    if (!materias || materias.length === 0) {
      return NextResponse.json({ error: "Nenhuma matéria com baixo desempenho" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const materiasTexto = materias.map((m: any) =>
      `- ${m.nome}: Pontuação ${m.pontuacao}%, Nota Média ${m.notaMedia}%, Taxa de Conclusão ${m.taxaConclusao}%`
    ).join("\n");

    const prompt = `Você é um assistente educacional especializado em criar planos de reforço para estudantes.

Analise o desempenho do aluno ${nomeAluno} (${serie}) nas seguintes matérias que precisam de melhoria:

${materiasTexto}

Crie um plano de reforço personalizado com sugestões práticas e acionáveis.

Forneça a resposta EXATAMENTE no seguinte formato JSON (sem markdown, sem blocos de código):
{
  "sugestoes": [
    {
      "materia": "Nome da Matéria",
      "diagnostico": "Breve diagnóstico do problema principal (1 frase)",
      "acoes": [
        "Ação prática 1",
        "Ação prática 2",
        "Ação prática 3"
      ],
      "recursos": [
        "Recurso ou ferramenta sugerida 1",
        "Recurso ou ferramenta sugerida 2"
      ],
      "meta": "Meta de melhoria específica e mensurável"
    }
  ],
  "dicasGerais": [
    "Dica geral 1 para melhorar hábitos de estudo",
    "Dica geral 2 para organização e planejamento",
    "Dica geral 3 para motivação"
  ]
}

IMPORTANTE: Retorne apenas o JSON puro, sem formatação markdown.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = response.text();

    // Limpar markdown
    text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const dados = JSON.parse(text);

    return NextResponse.json(dados);
  } catch (error: any) {
    console.error("Erro ao gerar sugestões de reforço:", error);
    return NextResponse.json({
      error: "Erro ao gerar sugestões",
      details: error.message
    }, { status: 500 });
  }
}
