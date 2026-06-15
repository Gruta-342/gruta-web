import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    // 1. Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Por favor, preencha todos os campos." },
        { status: 400 }
      );
    }

    // 2. Verifica se o e-mail já está cadastrado no banco
    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return NextResponse.json(
        { message: "Este e-mail já está em uso." },
        { status: 400 }
      );
    }

    // 3. Criptografa a senha com segurança (Salt de 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Cria o usuário na nuvem (com a role 'guest' padrão da Gruta)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roles: ["guest"],
      },
    });

    return NextResponse.json(
      { message: "Usuário registrado com sucesso!" },
      { status: 201 }
    );

  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { message: "Erro interno no servidor. Tente novamente." },
      { status: 500 }
    );
  }
}