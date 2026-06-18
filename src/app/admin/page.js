"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./admin.css";

// Inicializa o Supabase Client para poder fazer o Upload das imagens
// Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu arquivo .env ou .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPanel() {
  const [activeMenu, setActiveMenu] = useState("proximos");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // --- ESTADOS DO FORMULÁRIO ---
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  
  // Imagem: Trata o arquivo novo selecionado ou a URL de uma imagem já salva
  const [eventImageFile, setEventImageFile] = useState(null); 
  const [eventBannerUrl, setEventBannerUrl] = useState(""); 
  
  const [eventTags, setEventTags] = useState([]);
  const [eventTagInput, setEventTagInput] = useState("");

  // --- CARREGAR EVENTOS DO BANCO ---
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // CORREÇÃO DO ERRO 404: Caminho /api/admin/events adicionado
      const response = await fetch("/api/admin/events"); 
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        setAlert({ type: "error", message: "Erro ao carregar eventos do banco." });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: "Erro de conexão." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleAddTag = () => {
    if (eventTagInput.trim() && !eventTags.includes(eventTagInput.trim())) {
      setEventTags([...eventTags, eventTagInput.trim().toUpperCase()]);
      setEventTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEventTags(eventTags.filter((t) => t !== tagToRemove));
  };

  // --- SALVAR EVENTO E FAZER UPLOAD ---
  const handleEventSubmit = async (e) => {
    e.preventDefault();
    const today = getTodayDate();
    const backendCategory = activeMenu === "proximos" ? "upcoming" : "past";

    if (backendCategory === "upcoming" && eventDate < today) {
      setAlert({ type: "error", message: "Erro: A data não pode ser retroativa." });
      return;
    }
    if (backendCategory === "past" && eventDate >= today) {
      setAlert({ type: "error", message: "Erro: Últimos Eventos precisa ser uma data passada." });
      return;
    }

    setAlert({ type: "success", message: "Processando e salvando imagem..." });
    let finalBannerUrl = eventBannerUrl;

    // 1. SE O USUÁRIO ESCOLHEU UM ARQUIVO NOVO, FAZEMOS O UPLOAD PARA O SUPABASE PRIMEIRO
    if (eventImageFile) {
      const fileExt = eventImageFile.name.split(".").pop();
      // Cria um nome de arquivo único para não sobrescrever imagens antigas
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Faz o upload para a pasta/bucket chamada "events"
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("events")
        .upload(fileName, eventImageFile);

      if (uploadError) {
        setAlert({ type: "error", message: "Erro ao fazer upload da imagem no Supabase." });
        return; // Para o processo se a imagem falhar
      }

      // Pega a URL pública permanente da imagem que acabou de subir
      const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
      finalBannerUrl = urlData.publicUrl;
    }

    // 2. MONTA OS DADOS PARA O BANCO COM A URL DEFINITIVA
    const eventPayload = {
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      time: backendCategory === "upcoming" ? eventTime : "",
      category: backendCategory,
      bannerUrl: finalBannerUrl, // URL da imagem enviada ou mantida
      tags: eventTags
    };

    // 3. SALVA NO BANCO DE DADOS (PRISMA)
    try {
      let response;
      if (editingEventId !== null) {
        // CORREÇÃO DO ERRO 404: /api/admin/events/[id]
        response = await fetch(`/api/admin/events/${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
      } else {
        // CORREÇÃO DO ERRO 404: /api/admin/events
        response = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
      }

      if (response.ok) {
        setAlert({
          type: "success",
          message: editingEventId !== null ? "Evento atualizado com sucesso!" : "Novo evento cadastrado!"
        });
        clearEventForm();
        fetchEvents();
      } else {
        const errorData = await response.json();
        setAlert({ type: "error", message: errorData.message || "Erro ao salvar o evento." });
      }
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: "Erro de comunicação com o banco de dados." });
    }
  };

  const deleteEvent = async (id) => {
    if (!confirm("Tem certeza que deseja deletar este evento?")) return;
    try {
      // CORREÇÃO DO ERRO 404
      const response = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (response.ok) {
        setAlert({ type: "success", message: "Evento excluído!" });
        if (editingEventId === id) clearEventForm();
        fetchEvents();
      } else {
        setAlert({ type: "error", message: "Erro ao excluir." });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao conectar com a API." });
    }
  };

  const startEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDescription(evt.description);
    setEventDate(evt.date ? evt.date.split("T")[0] : "");
    setEventTime(evt.time || "");
    setEventBannerUrl(evt.bannerUrl || ""); // Guarda a URL antiga
    setEventImageFile(null); // Limpa o input de arquivo (pois ele não precisa mandar de novo se não quiser trocar)
    setEventTags(evt.tags || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearEventForm = () => {
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventTime("");
    setEventBannerUrl("");
    setEventImageFile(null);
    setEventTags([]);
    setEditingEventId(null);
  };

  const currentCategoryFilter = activeMenu === "proximos" ? "upcoming" : "past";
  const displayedEvents = events.filter((evt) => evt.category === currentCategoryFilter);

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>Painel Admin</h2>
          <span>Gruta 342</span>
        </div>
        <nav className="sidebar-menu">
          <button className={`menu-item ${activeMenu === "proximos" ? "active" : ""}`} onClick={() => { setActiveMenu("proximos"); clearEventForm(); }}>Próximos Eventos</button>
          <button className={`menu-item ${activeMenu === "ultimos" ? "active" : ""}`} onClick={() => { setActiveMenu("ultimos"); clearEventForm(); }}>Últimos Eventos</button>
          <button className={`menu-item ${activeMenu === "galeria" ? "active" : ""}`} onClick={() => setActiveMenu("galeria")}>Galeria</button>
          <button className={`menu-item ${activeMenu === "jogos" ? "active" : ""}`} onClick={() => setActiveMenu("jogos")}>Jogos</button>
        </nav>
      </aside>

      <main className="admin-content-wrapper">
        {alert.message && <div className={`admin-alert ${alert.type}`}><span>{alert.message}</span></div>}

        <div className="admin-sections-vertical">
          {(activeMenu === "proximos" || activeMenu === "ultimos") && (
            <section className="form-section-container">
              <h2 className="section-title">{editingEventId !== null ? "Editar Evento" : "Novo Evento"}</h2>
              
              <form onSubmit={handleEventSubmit} className="admin-form">
                <div className="form-group">
                  <label>Título do Evento</label>
                  <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data</label>
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                  </div>
                  {activeMenu === "proximos" && (
                    <div className="form-group">
                      <label>Horário</label>
                      <input 
                        type="time" 
                        value={eventTime} 
                        onChange={(e) => setEventTime(e.target.value)} 
                        required 
                      />
                    </div>
                  )}
                </div>

                {/* UPLOAD DE ARQUIVO AO INVÉS DE TEXTO */}
                <div className="form-group">
                  <label>Capa / Banner do Evento (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEventImageFile(e.target.files[0])}
                    className="admin-file-input"
                  />
                  {/* Pré-visualização da imagem para ficar bonito */}
                  {(eventImageFile || eventBannerUrl) && (
                    <div style={{ marginTop: '10px' }}>
                      <img 
                        src={eventImageFile ? URL.createObjectURL(eventImageFile) : eventBannerUrl} 
                        alt="Prévia do Banner" 
                        style={{ height: "100px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} 
                      />
                      <p style={{fontSize: "0.8rem", color: "#8a9fc4", marginTop: "4px"}}>
                        {eventImageFile ? "Nova imagem pronta para envio." : "Imagem atual cadastrada."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Descrição Completa</label>
                  <textarea rows="3" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} required />
                </div>

                {activeMenu === "ultimos" && (
                  <div className="form-group">
                    <label>Tags Associadas</label>
                    <div className="tag-input-wrapper">
                      <input type="text" value={eventTagInput} onChange={(e) => setEventTagInput(e.target.value)} />
                      <button type="button" onClick={handleAddTag}>Inserir</button>
                    </div>
                    <div className="tags-container">
                      {eventTags.map((tag, idx) => (
                        <span key={idx} className="tag-badge">
                          {tag} <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-actions-row">
                  <button type="submit" className="btn-primary">
                    {editingEventId !== null ? "Aplicar Alterações" : "Salvar e Enviar"}
                  </button>
                  {editingEventId !== null && (
                    <button type="button" className="btn-secondary" onClick={clearEventForm}>Cancelar</button>
                  )}
                </div>
              </form>
            </section>
          )}

          {/* TABELA DE REGISTROS MANTIDA INTACTA */}
          {(activeMenu === "proximos" || activeMenu === "ultimos") && (
            <section className="existing-records-section">
              <h2 className="section-title">Itens Ativos no Banco de Dados ({displayedEvents.length})</h2>
              {isLoading ? (
                <p className="empty-state">Buscando dados no Supabase...</p>
              ) : (
                <div className="records-table-wrapper">
                  <table className="records-table">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Data {activeMenu === "proximos" && "/ Horário"}</th>
                        <th>Tags</th>
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedEvents.map((item) => (
                        <tr key={item.id} className={editingEventId === item.id ? "row-highlight-editing" : ""}>
                          <td className="font-semibold">{item.title}</td>
                          <td>
                            {item.date ? new Date(item.date).toLocaleDateString("pt-BR", {timeZone: "UTC"}) : "N/A"}
                            {activeMenu === "proximos" && item.time ? ` às ${item.time}` : ""}
                          </td>
                          <td>
                            <div className="table-tags-flex">
                              {item.tags?.map((t, idx) => <span key={idx} className="table-tag-mini">{t}</span>)}
                            </div>
                          </td>
                          <td>
                            <div className="table-actions-flex">
                              <button type="button" className="action-btn-edit" onClick={() => startEditEvent(item)} title="Editar dados">
                                <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                              </button>
                              <button type="button" className="action-btn-delete" onClick={() => deleteEvent(item.id)} title="Excluir do Supabase">
                                <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}