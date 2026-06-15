"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // <-- Importação adicionada
import "./cadastro.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Ocorreu um erro ao criar a conta.");
      } else {
        setSuccess("Conta criada com sucesso! Redirecionando para o login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Criar Conta na Gruta</h2>

        {/* --- ADICIONADO: Botões Sociais --- */}
        <div className="social-login">
          {/* O type="button" impede que ele tente enviar o formulário tradicional sem querer */}
          <button 
            type="button" 
            className="social-btn discord-btn"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
          >
            Registrar com Discord
          </button>
          
          <button 
            type="button" 
            className="social-btn google-btn"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Registrar com Google
          </button>
        </div>

        <div className="register-divider">ou</div>
        {/* ---------------------------------- */}

        <form onSubmit={handleRegister} className="register-form">
          <div className="input-group">
            <label>Nome Completo / Nick</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como quer ser chamado"
              required
            />
          </div>

          <div className="input-group">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha segura"
              required
            />
          </div>

          <div className="input-group">
            <label>Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              required
            />
          </div>

          {error && <p className="register-error">{error}</p>}
          {success && <p className="register-success">{success}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Cadastrando..." : "Concluir Cadastro"}
          </button>
        </form>

        <div className="register-footer">
          Já tem uma conta?{" "}
          <Link href="/login">Faça login aqui</Link>
        </div>
      </div>
    </div>
  );
}