import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route"; 
import { prisma } from "../../../../lib/prisma";

// 1. ROTA PARA CRIAR UM NOVO EVENTO (POST)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    // Trava de segurança: Se não estiver logado ou não for admin, bloqueia na hora
    if (!session || !session.user?.roles?.includes("admin")) {
      return NextResponse.json({ message: "Acesso Negado. Apenas administradores." }, { status: 403 });
    }

    // Pega os dados que você digitou no formulário do Painel Admin
    const { title, description, date, time, category, bannerUrl } = await req.json();

    // Validação básica
    if (!title || !description || !date || !time || !category) {
      return NextResponse.json({ message: "Por favor, preencha todos os campos obrigatórios." }, { status: 400 });
    }

    // Salva o evento no banco de dados Neon
    const newEvent = await prisma.event.create({
      data: { title, description, date, time, category, bannerUrl },
    });

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json({ message: "Erro interno no servidor." }, { status: 500 });
  }
}

// 2. ROTA PARA BUSCAR E LISTAR TODOS OS EVENTOS (GET)
export async function GET() {
  try {
    // Busca todos os eventos cadastrados, ordenando do mais novo para o mais antigo
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Devolve a lista para o front-end desenhar na tela
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error("Erro ao buscar eventos:", error);
    return NextResponse.json({ message: "Erro ao listar eventos." }, { status: 500 });
  }
}