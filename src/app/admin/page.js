"use client";

import React, { useState, useEffect } from "react";
import "./admin.css"; // Garanta que este arquivo está na mesma pasta!

// Nossos Templates para facilitar a vida
const PRESETS = {
  nenhum: { title: "", description: "", bannerUrl: "" },
  dbd: {
    title: "Dead By Daylight",
    description: "Todo mundo tinha um plano, mas nada saiu como planejado... como sempre!",
    bannerUrl: "https://i.imgur.com/link_da_imagem_dbd.jpg" // Troque pelo link real da imagem depois
  },
  fifa: {
    title: "Torneio de FIFA",
    description: "Controles quebrados e amizades desfeitas. Mais um dia normal.",
    bannerUrl: ""
  }
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming" ou "past"
  
  // Estados do Formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [presetKey, setPresetKey] = useState("nenhum");

  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const fetchEvents = async () => {
    const res = await fetch("/api/admin/events");
    if (res.ok) {
      const data = await res.json();
      setEvents(data);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Quando escolhe um template, preenche os campos automaticamente
  const handlePresetChange = (e) => {
    const key = e.target.value;
    setPresetKey(key);
    if (key !== "nenhum") {
      setTitle(PRESETS[key].title);
      setDescription(PRESETS[key].description);
      if (PRESETS[key].bannerUrl) setBannerUrl(PRESETS[key].bannerUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Se for "past" (Últimos Eventos), mandamos um horário em branco pra não quebrar o banco
    const payload = { 
      title, 
      description, 
      date, 
      time: activeTab === "upcoming" ? time : "", 
      category: activeTab,
      bannerUrl 
    };

    let res;
    if (editingId) {
      res = await fetch(`/api/admin/events/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      setMessage(editingId ? "✅ Evento atualizado!" : "✅ Evento criado com sucesso!");
      limparFormulario();
      fetchEvents();
    } else {
      setMessage("❌ Falha ao salvar o evento.");
    }
  };

  const handleEdit = (evt) => {
    setEditingId(evt.id);
    setActiveTab(evt.category);
    setTitle(evt.title);
    setDescription(evt.description);
    setDate(evt.date);
    setTime(evt.time || "");
    setBannerUrl(evt.bannerUrl || "");
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este evento?")) {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) fetchEvents();
    }
  };

  const limparFormulario = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setBannerUrl("");
    setPresetKey("nenhum");
  };

  return (
    <div className="admin-container">
      <div className="admin-grid">
        
        {/* Lado Esquerdo: Formulário */}
        <div className="admin-card">
          <h2 className="admin-subtitle">
            {editingId ? "✏️ Editando Evento" : "✨ Criar Novo Evento"}
          </h2>

          {/* Abas de Seleção */}
          {!editingId && (
            <div className="admin-tabs">
              <button 
                className={activeTab === "upcoming" ? "tab active" : "tab"}
                onClick={() => setActiveTab("upcoming")}
              >
                Próximos Eventos
              </button>
              <button 
                className={activeTab === "past" ? "tab active" : "tab"}
                onClick={() => setActiveTab("past")}
              >
                Últimos Eventos
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-form">
            
            {/* Se for aba de "Últimos Eventos", mostra o dropdown de Templates */}
            {activeTab === "past" && (
              <div className="form-group template-highlight">
                <label>Carregar Pré-definição (Opcional)</label>
                <select value={presetKey} onChange={handlePresetChange}>
                  <option value="nenhum">-- Preencher Manualmente --</option>
                  <option value="dbd">🎮 Dead By Daylight</option>
                  <option value="fifa">⚽ Torneio de FIFA</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Título do Evento</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              
              {/* O Horário só aparece se for um "Próximo Evento" */}
              {activeTab === "upcoming" && (
                <div className="form-group">
                  <label>Horário</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Link da Imagem {activeTab === "upcoming" ? "(Proporção 4:3)" : "(Proporção 1:1)"}</label>
              <input 
                type="url" 
                value={bannerUrl} 
                onChange={(e) => setBannerUrl(e.target.value)} 
                placeholder="Ex: https://imgur.com/sua_imagem.png" 
              />
            </div>

            <div className="form-group">
              <label>Descrição Breve</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" required />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" className="admin-submit-btn" style={{ flex: 1 }}>
                {editingId ? "Salvar Alterações" : "Publicar no Site"}
              </button>
              {editingId && (
                <button type="button" onClick={limparFormulario} className="admin-cancel-btn">Cancelar</button>
              )}
            </div>
            {message && <p className="admin-message">{message}</p>}
          </form>
        </div>

        {/* Lado Direito: Lista de Eventos */}
        <div className="admin-card">
          <h2 className="admin-subtitle">Eventos Cadastrados</h2>
          <div className="events-list">
            {events.map((evt) => (
              <div key={evt.id} className="event-item-mini" style={{ borderLeft: evt.category === "upcoming" ? "4px solid #00a8ff" : "4px solid #888" }}>
                <div>
                  <strong>{evt.title}</strong>
                  <p>{evt.date} {evt.time && `às ${evt.time}`} — <span>{evt.category === "upcoming" ? "Próximo" : "Passado"}</span></p>
                </div>
                <div className="event-actions">
                  <button onClick={() => handleEdit(evt)} className="edit-btn">✏️</button>
                  <button onClick={() => handleDelete(evt.id)} className="delete-btn">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}