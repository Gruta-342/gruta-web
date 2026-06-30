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

  // --- ALTERAR VISIBILIDADE DO EVENTO (Usando sua API / Prisma -> Neon) ---
  const toggleVisibility = async (item) => {
    try {
      const newStatus = item.is_visible === false ? true : false;
      
      // Montamos o pacote com todos os dados do evento, mas com a visibilidade invertida
      const payload = {
        ...item,
        is_visible: newStatus
      };

      // Dispara para a SUA rota de API que conversa com o Prisma/Neon
      const response = await fetch(`/api/admin/events/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Falha ao atualizar no banco de dados.");
      
      // Atualiza o estado localmente sem recarregar tudo
      setEvents(events.map(e => e.id === item.id ? { ...e, is_visible: newStatus } : e));
      
      setAlert({ 
        type: "success", 
        message: `Item ${newStatus ? 'visível no site' : 'ocultado do site'} com sucesso!` 
      });
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error);
      setAlert({ type: "error", message: "Erro ao alterar visibilidade do item." });
    }
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
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("events")
        .upload(fileName, eventImageFile);

      if (uploadError) {
        setAlert({ type: "error", message: "Erro ao fazer upload da imagem no Supabase." });
        return; 
      }

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
      bannerUrl: finalBannerUrl, 
      tags: eventTags
    };

    // 3. SALVA NO BANCO DE DADOS
    try {
      let response;
      if (editingEventId !== null) {
        response = await fetch(`/api/admin/events/${editingEventId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload)
        });
      } else {
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
    setEventBannerUrl(evt.bannerUrl || "");
    setEventImageFile(null); 
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

                <div className="form-group">
                  <label>Capa / Banner do Evento (Upload)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setEventImageFile(e.target.files[0])}
                    className="admin-file-input"
                  />
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

          {/* TABELA DE REGISTROS COM SVGs ATUALIZADOS E BOTÃO DE EXIBIR/OCULTAR */}
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
                        {/* Exibe o cabeçalho de Tags apenas se NÃO for 'proximos' */}
                        {activeMenu !== "proximos" && <th>Tags</th>}
                        <th className="text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedEvents.map((item) => (
                        <tr key={item.id} className={`${editingEventId === item.id ? "row-highlight-editing" : ""} ${item.is_visible === false ? "item-hidden" : ""}`.trim()}>
                          <td className="font-semibold">{item.title}</td>
                          <td>
                            {item.date ? new Date(item.date).toLocaleDateString("pt-BR", {timeZone: "UTC"}) : "N/A"}
                            {activeMenu === "proximos" && item.time ? ` às ${item.time}` : ""}
                          </td>
                          
                          {/* Renderiza as tags dinamicamente apenas se NÃO for 'proximos' */}
                          {activeMenu !== "proximos" && (
                            <td>
                              <div className="table-tags-flex">
                                {item.tags?.map((t, idx) => <span key={idx} className="table-tag-mini">{t}</span>)}
                              </div>
                            </td>
                          )}

                          <td>
                            <div className="table-actions-flex">
                              {/* Botão de Visibilidade (Olho aberto/fechado) */}
                              <button 
                                type="button" 
                                className="action-btn-toggle" 
                                onClick={() => toggleVisibility(item)} 
                                title={item.is_visible === false ? "Exibir no site" : "Ocultar do site"}
                              >
                                {item.is_visible === false ? (
                                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                                ) : (
                                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                )}
                              </button>

                              {/* Novo Botão de Editar */}
                              <button type="button" className="action-btn-edit" onClick={() => startEditEvent(item)} title="Editar dados">
                                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                              </button>

                              {/* Novo Botão de Excluir */}
                              <button type="button" className="action-btn-delete" onClick={() => deleteEvent(item.id)} title="Excluir do Supabase">
                                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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