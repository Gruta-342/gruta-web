"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import "./login.css"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        
        <h2 className="login-title">Entre na Gruta</h2>

        <div className="social-login">
          <button 
            className="social-btn discord-btn"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
          >
            Entrar com Discord
          </button>
          
          <button 
            className="social-btn google-btn"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Entrar com Google
          </button>
        </div>

        <div className="login-divider">ou</div>

        <form onSubmit={handleCredentialsLogin} className="login-form">
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
              placeholder="Sua senha secreta"
              required
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="submit-btn">
            Entrar
          </button>
        </form>

        <div className="login-footer">
          Não tem uma conta?{" "}
          <Link href="/cadastro">
            Registre-se aqui
          </Link>
        </div>

      </div>
    </div>
  );
}