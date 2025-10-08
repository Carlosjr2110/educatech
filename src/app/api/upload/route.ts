import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { s3Client, S3_BUCKET_NAME } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const tipo = formData.get("tipo") as string;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo fornecido" }, { status: 400 });
    }

    // Validação de tipo de arquivo
    const allowedTypes: Record<string, string[]> = {
      video: ["video/mp4", "video/webm", "video/ogg"],
      pdf: ["application/pdf"],
      imagem: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    };

    if (tipo && allowedTypes[tipo] && !allowedTypes[tipo].includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo inválido para ${tipo}` },
        { status: 400 }
      );
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${randomString}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const key = `materials/${fileName}`;

    // Converter file para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload para S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Gerar URL pública (se o bucket for público) ou presigned URL
    const url = `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    console.log("✅ Arquivo enviado para S3:", url);

    return NextResponse.json({
      success: true,
      url,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("❌ Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo", details: error.message },
      { status: 500 }
    );
  }
}
