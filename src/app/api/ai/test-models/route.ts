import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || "";

  // Verificacoes basicas
  const diagnostico = {
    apiKeyExists: !!apiKey,
    apiKeyLength: apiKey.length,
    apiKeyPrefix: apiKey.substring(0, 10) + "...",
    apiKeyFormat: apiKey.startsWith("AIza") ? "Formato correto" : "Formato incorreto (deve comecar com AIza)"
  };

  if (!apiKey) {
    return NextResponse.json({
      erro: "API Key nao configurada no .env",
      diagnostico
    });
  }

  // Primeiro, tentar listar os modelos disponiveis
  let modelosDisponiveis = [];
  try {
    // Fazer uma requisicao HTTP direta para listar modelos
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        erro: "Erro ao listar modelos",
        diagnostico,
        statusCode: response.status,
        errorDetails: errorText
      });
    }

    const data = await response.json();
    modelosDisponiveis = data.models?.map((m: any) => ({
      nome: m.name,
      displayName: m.displayName,
      supportsGenerateContent: m.supportedGenerationMethods?.includes("generateContent")
    })) || [];
  } catch (error: any) {
    return NextResponse.json({
      erro: "Erro ao conectar com Gemini API",
      diagnostico,
      errorMessage: error.message
    });
  }

  return NextResponse.json({
    diagnostico,
    modelosDisponiveis,
    sugestao: "Use um dos modelos acima que suporta generateContent"
  });
}
