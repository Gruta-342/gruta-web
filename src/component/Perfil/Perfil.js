"use client";

import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import "./Perfil.css";

export default function Perfil({ user, isOwn, viewerId }) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "info" });

  useEffect(() => {
    setFormData({ name: user.name || "", image: user.image || "" });
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "info" });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "info" });

    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, image: formData.image }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao atualizar o perfil.");

      setMessage({ text: data.message || "Perfil atualizado com sucesso!", type: "success" });
      setEditMode(false);
    } catch (error) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const roleLabel = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return "Convidado";
    if (roles.includes("admin")) return "Administrador";
    if (roles.includes("member")) return "Membro";
    return roles[0];
  };

  const roleClass = (roles) => {
    if (!Array.isArray(roles) || roles.length === 0) return "role-guest";
    if (roles.includes("admin")) return "role-admin";
    if (roles.includes("member")) return "role-member";
    return "role-guest";
  };

  const avatar = user.image ? (
    <img src={user.image} alt="Avatar" className="perfil-avatar" />
  ) : (
    <div className="perfil-avatar-fallback">
      {(user.name || "U").charAt(0).toUpperCase()}
    </div>
  );

  // ============================================
  // MODO: PERFIL DE OUTRA PESSOA (VISITANTE)
  // ============================================
  if (!isOwn) {
    return (
      <div className="perfil-container">
        <div className="perfil-header">
          <span className="perfil-badge other">Perfil de visitante</span>
          {avatar}
          <h1 className="perfil-nome">{user.name || "Usuário sem nome"}</h1>
          <span className="perfil-role {roleClass(user.roles)}">
            {roleLabel(user.roles)}
          </span>
        </div>

        <div className="perfil-divider"></div>

        <div className="perfil-dados">
          <div className="perfil-item">
            <span className="label">Nome</span>
            <span className="valor">{user.name || "Não informado"}</span>
          </div>
          <div className="perfil-item">
            <span className="label">Função</span>
            <span className="valor">{roleLabel(user.roles)}</span>
          </div>
          <div className="perfil-item">
            <span className="label">Membro desde</span>
            <span className="valor">
              {user.joined_date ? new Date(user.joined_date).toLocaleDateString("pt-BR") : "-"}
            </span>
          </div>
        </div>

        {viewerId ? (
          <div className="perfil-acoes row">
            <button className="btn btn-outline" disabled>
              Adicionar aos amigos
            </button>
          </div>
        ) : (
          <p className="perfil-somente-leitura">
            Faça <a href="/login">login</a> para interagir com este perfil.
          </p>
        )}
      </div>
    );
  }
  // ============================================
  // MODO: PRÓPRIO PERFIL
  // ============================================
  return (
    <div className="perfil-container">
      <div className="perfil-header">
        <span className="perfil-badge own">Este é o seu perfil</span>
        {avatar}
        <h1 className="perfil-nome">{user.name || "Usuário sem nome"}</h1>
        {user.email && <p className="perfil-email">{user.email}</p>}
        <span className="perfil-role {roleClass(user.roles)}">
          {roleLabel(user.roles)}
        </span>
      </div>

      <div className="perfil-divider"></div>

      <div className="perfil-dados">
        <div className="perfil-item">
          <span className="label">Nome</span>
          <span className="valor">{user.name || "Não informado"}</span>
        </div>
        {user.email && (
          <div className="perfil-item">
            <span className="label">E-mail</span>
            <span className="valor">{user.email}</span>
          </div>
        )}
        <div className="perfil-item">
          <span className="label">Função</span>
          <span className="valor">{roleLabel(user.roles)}</span>
        </div>
        <div className="perfil-item">
          <span className="label">Membro desde</span>
          <span className="valor">
            {user.joined_date ? new Date(user.joined_date).toLocaleDateString("pt-BR") : "-"}
          </span>
        </div>
      </div>

      {editMode ? (
        <section className="perfil-edicao">
          <h3>Editar perfil</h3>
          {message.text && (
            <p
              style={{
                color: message.type === "success" ? "#00d2ff" : "#ff4d4d",
                fontSize: "0.9rem",
                marginBottom: 12,
              }}
            >
              {message.text}
            </p>
          )}
          <form onSubmit={handleSave}>
            <div className="campo">
              <label htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="campo">
              <label htmlFor="imagem">URL da imagem (avatar)</label>
              <input
                id="imagem"
                name="image"
                value={formData.image}
                onChange={handleChange}
                type="url"
                placeholder="https://exemplo.com/avatar.png"
              />
            </div>
            <div className="perfil-acoes-edicao">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditMode(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : (
        <div className="perfil-acoes row">
          <button className="btn btn-outline" onClick={() => setEditMode(true)}>
            Editar perfil
          </button>
          <button className="btn btn-danger" onClick={handleLogout}>
            Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}

