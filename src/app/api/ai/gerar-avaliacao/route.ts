import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { materia, tema, nivel, numeroQuestoes, tipoQuestoes } = await request.json();

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

    const numQuestoes = numeroQuestoes || 10;
    const tipoPreferido = tipoQuestoes || "multipla-escolha";

    const prompt = `Voce e um assistente educacional especializado em criar avaliacoes.

Crie uma avaliacao com ${numQuestoes} questoes sobre o seguinte tema:
- Materia: ${materia}
- Tema: ${tema}
${nivel ? `- Nivel/Serie: ${nivel}` : ""}

Tipo de questoes preferido: ${tipoPreferido}

Forneca a resposta EXATAMENTE no seguinte formato JSON (sem markdown, sem \`\`\`json):
{
  "titulo": "Titulo da avaliacao (conciso)",
  "descricao": "Breve descricao da avaliacao (1-2 frases)",
  "perguntas": [
    {
      "enunciado": "Texto da pergunta",
      "tipo": "multipla-escolha",
      "opcoes": ["Opcao A", "Opcao B", "Opcao C", "Opcao D"],
      "resposta_correta": ["Opcao A"]
    },
    {
      "enunciado": "Texto da segunda pergunta",
      "tipo": "verdadeiro-falso",
      "opcoes": ["Verdadeiro", "Falso"],
      "resposta_correta": ["Verdadeiro"]
    }
  ]
}

REGRAS IMPORTANTES:
1. Crie exatamente ${numQuestoes} questoes
2. Use o tipo "${tipoPreferido}" sempre que possivel
3. Para "multipla-escolha": sempre 4 opcoes (A, B, C, D)
4. Para "verdadeiro-falso": sempre 2 opcoes (Verdadeiro, Falso)
5. "resposta_correta" deve ser um array com a(s) opcao(oes) correta(s)
6. As questoes devem variar em dificuldade (facil, medio, dificil)
7. Retorne APENAS o JSON, sem explicacoes adicionais

Exemplo de multipla escolha:
{
  "enunciado": "Qual e a capital do Brasil?",
  "tipo": "multipla-escolha",
  "opcoes": ["Sao Paulo", "Rio de Janeiro", "Brasilia", "Salvador"],
  "resposta_correta": ["Brasilia"]
}

Exemplo de verdadeiro ou falso:
{
  "enunciado": "A fotossintese ocorre nas mitocondrias.",
  "tipo": "verdadeiro-falso",
  "opcoes": ["Verdadeiro", "Falso"],
  "resposta_correta": ["Falso"]
}`;

    // Usar API REST direta do Gemini
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
    console.error("Erro ao gerar avaliacao com IA:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar avaliacao" },
      { status: 500 }
    );
  }
}
