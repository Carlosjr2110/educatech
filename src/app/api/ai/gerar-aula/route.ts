import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { materia, tema, serie, objetivos } = await request.json();

    if (!materia || !tema) {
      return NextResponse.json(
        { error: "Materia e tema sao obrigatorios" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key do Gemini nao configurada" },
        { status: 500 }
      );
    }

    const prompt = `Voce e um assistente educacional especializado em criar conteudos de estudo para alunos.

Crie um plano de aula com guia de estudo para ALUNOS sobre:
- Materia: ${materia}
- Tema: ${tema}
${serie ? `- Serie/Nivel: ${serie}` : ""}
${objetivos ? `- Objetivos: ${objetivos}` : ""}

Forneca a resposta EXATAMENTE no seguinte formato JSON (sem markdown, sem \`\`\`json):
{
  "titulo": "Titulo conciso e atrativo",
  "descricao": "Descricao breve do tema (2-3 frases)",
  "plano_estudo": "GUIA DE ESTUDO PARA ALUNOS:\\n\\n1. O que voce vai aprender:\\n- [Liste os principais conceitos]\\n\\n2. Como estudar este tema:\\n- [Passos e dicas de estudo]\\n\\n3. Pontos importantes para revisar:\\n- [Conceitos-chave]\\n\\n4. Exercicios sugeridos:\\n- [Tipos de pratica recomendados]\\n\\nEscreva de forma clara e direta para os alunos, como se fosse um guia de estudo.",
  "materiais_sugeridos": [
    {
      "nome": "Nome do material 1",
      "tipo": "pdf",
      "descricao": "Breve descricao do material"
    }
  ]
}

IMPORTANTE:
- O plano_estudo deve ser escrito PARA OS ALUNOS estudarem, nao para o professor ensinar
- Use linguagem clara e acessivel
- Foque em COMO o aluno deve estudar o conteudo
- Retorne APENAS o JSON, sem explicacoes adicionais.`;

    // Usar API REST direta do Gemini com modelo disponivel
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("Erro da API Gemini:", errorData);
      return NextResponse.json(
        { error: "Erro ao conectar com Gemini API", details: errorData },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Tentar fazer parse do JSON
    let jsonResponse;
    try {
      // Remove markdown code blocks se existirem
      const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      jsonResponse = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta da IA:", parseError);
      console.error("Texto recebido:", text);
      return NextResponse.json(
        { error: "Erro ao processar resposta da IA", rawText: text },
        { status: 500 }
      );
    }

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error("Erro ao gerar aula com IA:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar aula" },
      { status: 500 }
    );
  }
}
