import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import { photosData } from "../../../data/photos"; 

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Acesso Negado. Apenas administradores." }, { status: 403 });
    }

    // Limpa a tabela antes para evitar registros duplicados caso acesse a rota de novo
    await prisma.gallery.deleteMany({});

    const formattedPhotos = photosData.map((photo, index) => ({
      img: photo.img,
      caption: photo.caption || "",
      date: photo.date,
      tags: photo.tags || [],
      isHallOfFame: photo.isHallOfFame || false,
      aspect: photo.aspect || "4:3",
      is_visible: true,
      order: index, 
    }));

    const result = await prisma.gallery.createMany({
      data: formattedPhotos,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Galeria limpa e migrada com sucesso sem duplicatas!", 
      inseridos: result.count 
    });
  } catch (error) {
    console.error("Erro na migração da galeria:", error);
    return NextResponse.json({ error: "Erro na migração." }, { status: 500 });
  }
}