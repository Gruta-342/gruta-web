"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import "./admin.css";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPanel() {
  const [activeMenu, setActiveMenu] = useState("proximos");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  // ==========================================
  // ESTADOS: EVENTOS
  // ==========================================
  const [events, setEvents] = useState([]);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventImageFile, setEventImageFile] = useState(null); 
  const [eventBannerUrl, setEventBannerUrl] = useState(""); 
  const [eventTags, setEventTags] = useState([]);
  const [eventTagInput, setEventTagInput] = useState("");

  // ==========================================
  // ESTADOS: JOGOS
  // ==========================================
  const [games, setGames] = useState([]);
  const [editingGameId, setEditingGameId] = useState(null);
  const [gameTitle, setGameTitle] = useState("");
  const [gameCategory, setGameCategory] = useState("Online");
  const [gameBadge, setGameBadge] = useState("");
  const [gameImageFile, setGameImageFile] = useState(null);
  const [gameImageUrl, setGameImageUrl] = useState("");

  // ==========================================
  // EFEITOS E UTILITÁRIOS GERAIS
  // ==========================================
  useEffect(() => {
    fetchEvents();
    fetchGames();
  }, []);

  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const getTodayDate = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // ==========================================
  // FUNÇÕES: EVENTOS
  // ==========================================
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/events"); 
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (eventTagInput.trim() && !eventTags.includes(eventTagInput.trim())) {
      setEventTags([...eventTags, eventTagInput.trim().toUpperCase()]);
      setEventTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => setEventTags(eventTags.filter((t) => t !== tagToRemove));

  const toggleEventVisibility = async (item) => {
    try {
      const newStatus = !item.is_visible;
      const payload = { ...item, is_visible: newStatus };
      const response = await fetch(`/api/admin/events/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Falha ao atualizar.");
      setEvents(events.map(e => e.id === item.id ? { ...e, is_visible: newStatus } : e));
      setAlert({ type: "success", message: `Evento ${newStatus ? 'visível' : 'ocultado'}!` });
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao alterar visibilidade." });
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    const today = getTodayDate();
    const backendCategory = activeMenu === "proximos" ? "upcoming" : "past";

    if (backendCategory === "upcoming" && eventDate < today) {
      setAlert({ type: "error", message: "Erro: A data não pode ser retroativa." });
      return;
    }
    if (backendCategory === "past" && eventDate >= today) {
      setAlert({ type: "error", message: "Erro: Últimos Eventos precisa ser passado." });
      return;
    }

    setAlert({ type: "success", message: "Processando..." });
    let finalBannerUrl = eventBannerUrl;

    if (eventImageFile) {
      const fileName = `${Date.now()}-${eventImageFile.name}`;
      const { data, error } = await supabase.storage.from("events").upload(fileName, eventImageFile);
      if (error) return setAlert({ type: "error", message: "Erro no upload da imagem." });
      const { data: urlData } = supabase.storage.from("events").getPublicUrl(fileName);
      finalBannerUrl = urlData.publicUrl;
    }

    const payload = {
      title: eventTitle,
      description: eventDescription,
      date: eventDate,
      time: backendCategory === "upcoming" ? eventTime : "",
      category: backendCategory,
      bannerUrl: finalBannerUrl, 
      tags: eventTags
    };

    try {
      const method = editingEventId ? "PUT" : "POST";
      const url = editingEventId ? `/api/admin/events/${editingEventId}` : "/api/admin/events";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAlert({ type: "success", message: "Evento salvo com sucesso!" });
        clearEventForm();
        fetchEvents();
      } else {
        setAlert({ type: "error", message: "Erro ao salvar evento." });
      }
    } catch (err) {
      setAlert({ type: "error", message: "Erro de conexão." });
    }
  };

  const deleteEvent = async (id) => {
    if (!confirm("Deletar este evento?")) return;
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAlert({ type: "success", message: "Evento excluído!" });
      if (editingEventId === id) clearEventForm();
      fetchEvents();
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


  // ==========================================
  // FUNÇÕES: JOGOS
  // ==========================================
  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/games"); 
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
    } catch (error) {
      console.error("Erro ao buscar jogos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGameVisibility = async (item) => {
    try {
      const newStatus = !item.is_visible;
      const payload = { ...item, is_visible: newStatus };
      const response = await fetch(`/api/games/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Falha ao atualizar.");
      setGames(games.map(g => g.id === item.id ? { ...g, is_visible: newStatus } : g));
      setAlert({ type: "success", message: `Jogo ${newStatus ? 'visível' : 'ocultado'}!` });
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao alterar visibilidade do jogo." });
    }
  };

  const handleGameSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: "success", message: "Processando..." });
    let finalImageUrl = gameImageUrl;

    if (gameImageFile) {
      const fileName = `${Date.now()}-${gameImageFile.name}`;
      const { data, error } = await supabase.storage.from("games").upload(fileName, gameImageFile);
      if (error) return setAlert({ type: "error", message: "Erro no upload da imagem do jogo." });
      
      const { data: urlData } = supabase.storage.from("games").getPublicUrl(fileName);
      finalImageUrl = urlData.publicUrl;
    }

    const payload = {
      title: gameTitle,
      category: gameCategory,
      image: finalImageUrl,
      badge: gameBadge,
    };

    try {
      const method = editingGameId ? "PUT" : "POST";
      const url = editingGameId ? `/api/games/${editingGameId}` : "/api/games";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setAlert({ type: "success", message: "Jogo salvo com sucesso!" });
        clearGameForm();
        fetchGames();
      } else {
        setAlert({ type: "error", message: "Erro ao salvar jogo." });
      }
    } catch (err) {
      setAlert({ type: "error", message: "Erro de conexão." });
    }
  };

  const deleteGame = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este jogo?")) return;
    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAlert({ type: "success", message: "Jogo excluído!" });
      if (editingGameId === id) clearGameForm();
      fetchGames();
    }
  };

  const startGameEdit = (game) => {
    setEditingGameId(game.id);
    setGameTitle(game.title);
    setGameCategory(game.category || "Online");
    setGameBadge(game.badge || "");
    setGameImageUrl(game.image || "");
    setGameImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearGameForm = () => {
    setEditingGameId(null);
    setGameTitle("");
    setGameCategory("Online");
    setGameBadge("");
    setGameImageUrl("");
    setGameImageFile(null);
  };

  // ==========================================
  // FUNÇÕES: REORDENAÇÃO (DRAG & DROP)
  // ==========================================
  const handleDragStart = (e, index, category) => {
    e.dataTransfer.setData("dragIndex", index);
    e.dataTransfer.setData("dragCategory", category);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, dropIndex, dropCategory) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("dragIndex"));
    const dragCategory = e.dataTransfer.getData("dragCategory");

    // Só permite reordenar dentro da mesma categoria
    if (dragCategory !== dropCategory || dragIndex === dropIndex) return;

    // 1. Isola os itens da categoria em questão e ordena pelo campo 'order'
    const itemsToReorder = games
      .filter(g => g.category === dropCategory)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // 2. Remove o item arrastado da posição antiga e insere na nova
    const draggedItem = itemsToReorder[dragIndex];
    itemsToReorder.splice(dragIndex, 1);
    itemsToReorder.splice(dropIndex, 0, draggedItem);

    // 3. Atribui os novos valores de 'order' baseados no novo índice (0, 1, 2...)
    const updatedCategoryItems = itemsToReorder.map((item, index) => ({
      ...item,
      order: index
    }));

    // 4. Atualiza o estado visual na tela imediatamente (Otimista)
    const newGames = games.map(g => {
      const updated = updatedCategoryItems.find(u => u.id === g.id);
      return updated ? updated : g;
    });
    setGames(newGames);

    // 5. Salva silenciosamente no banco de dados
    try {
      const payload = updatedCategoryItems.map(item => ({ id: item.id, order: item.order }));
      await fetch("/api/games/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });
    } catch (error) {
      setAlert({ type: "error", message: "Erro ao salvar a nova ordem no banco." });
      fetchGames(); // Desfaz a mudança visual se der erro
    }
  };


  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================
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
          <button className={`menu-item ${activeMenu === "jogos" ? "active" : ""}`} onClick={() => { setActiveMenu("jogos"); clearGameForm(); }}>Jogos</button>
        </nav>
      </aside>

      <main className="admin-content-wrapper">
        {alert.message && <div className={`admin-alert ${alert.type}`}><span>{alert.message}</span></div>}

        <div className="admin-sections-vertical">
          
          {/* ==========================================
              SEÇÃO: EVENTOS (Próximos e Últimos)
             ========================================== */}
          {(activeMenu === "proximos" || activeMenu === "ultimos") && (
            <>
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
                        <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Capa / Banner do Evento (Upload)</label>
                    <input type="file" accept="image/*" onChange={(e) => setEventImageFile(e.target.files[0])} className="admin-file-input" />
                    {(eventImageFile || eventBannerUrl) && (
                      <div style={{ marginTop: '10px' }}>
                        <img src={eventImageFile ? URL.createObjectURL(eventImageFile) : eventBannerUrl} alt="Prévia" style={{ height: "100px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
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
                    <button type="submit" className="btn-primary">{editingEventId !== null ? "Aplicar Alterações" : "Salvar e Enviar"}</button>
                    {editingEventId !== null && <button type="button" className="btn-secondary" onClick={clearEventForm}>Cancelar</button>}
                  </div>
                </form>
              </section>

              <section className="existing-records-section">
                <h2 className="section-title">Eventos Ativos ({displayedEvents.length})</h2>
                {isLoading ? <p className="empty-state">Buscando dados...</p> : (
                  <div className="records-table-wrapper">
                    <table className="records-table">
                      <thead>
                        <tr>
                          <th>Título</th>
                          <th>Data {activeMenu === "proximos" && "/ Horário"}</th>
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
                            {activeMenu !== "proximos" && (
                              <td>
                                <div className="table-tags-flex">
                                  {item.tags?.map((t, idx) => <span key={idx} className="table-tag-mini">{t}</span>)}
                                </div>
                              </td>
                            )}
                            <td>
                              <div className="table-actions-flex">
                                <button type="button" className="action-btn-toggle" onClick={() => toggleEventVisibility(item)} title="Visibilidade">
                                  {item.is_visible === false ? (
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                                  ) : (
                                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                  )}
                                </button>
                                <button type="button" className="action-btn-edit" onClick={() => startEditEvent(item)}><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                                <button type="button" className="action-btn-delete" onClick={() => deleteEvent(item.id)}><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {/* ==========================================
              SEÇÃO: JOGOS
             ========================================== */}
          {activeMenu === "jogos" && (
            <>
              <section className="form-section-container">
                <h2 className="section-title">{editingGameId !== null ? "Editar Jogo" : "Novo Jogo"}</h2>
                <form onSubmit={handleGameSubmit} className="admin-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome do Jogo</label>
                      <input type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Categoria</label>
                      <select className="admin-select" value={gameCategory} onChange={(e) => setGameCategory(e.target.value)}>
                        <option value="Online">Online</option>
                        <option value="Tabuleiros">Tabuleiro</option>
                        <option value="Próprios">Próprio / Evento</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Tag em destaque (ex: MOBILE, PC) - Opcional</label>
                      <input type="text" value={gameBadge} onChange={(e) => setGameBadge(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Imagem do Jogo</label>
                      <input type="file" accept="image/*" onChange={(e) => setGameImageFile(e.target.files[0])} className="admin-file-input" />
                      {(gameImageFile || gameImageUrl) && (
                        <div style={{ marginTop: '10px' }}>
                          <img src={gameImageFile ? URL.createObjectURL(gameImageFile) : gameImageUrl} alt="Prévia Jogo" style={{ height: "80px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-actions-row">
                    <button type="submit" className="btn-primary">{editingGameId !== null ? "Aplicar Alterações" : "Salvar Jogo"}</button>
                    {editingGameId !== null && <button type="button" className="btn-secondary" onClick={clearGameForm}>Cancelar</button>}
                  </div>
                </form>
              </section>

              <section className="existing-records-section">
                <h2 className="section-title">Catálogo de Jogos ({games.length})</h2>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                  Arraste os itens pelo ícone pontilhado para alterar a ordem de exibição no site.
                </p>

                {isLoading ? <p className="empty-state">Buscando jogos...</p> : (
                  <div className="admin-sections-vertical" style={{ gap: "2rem" }}>
                    {["Online", "Tabuleiros", "Próprios"].map(cat => {
                      // Filtra e ordena os jogos dessa categoria
                      const categoryGames = games
                        .filter(g => g.category === cat)
                        .sort((a, b) => (a.order || 0) - (b.order || 0));

                      if (categoryGames.length === 0) return null;

                      return (
                        <div key={cat} className="records-table-wrapper" style={{ overflow: "visible" }}>
                          <h3 style={{ padding: "16px 20px", margin: 0, backgroundColor: "rgba(0,0,0,0.4)", color: "var(--accent)", fontSize: "1rem", borderBottom: "1px solid var(--border)" }}>
                            {cat === "Próprios" ? "Próprio / Evento" : cat}
                          </h3>
                          <table className="records-table">
                            <thead>
                              <tr>
                                <th style={{ width: "40px" }}></th>
                                <th>Jogo</th>
                                <th>Badge</th>
                                <th className="text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryGames.map((item, index) => (
                                <tr 
                                  key={item.id} 
                                  draggable 
                                  onDragStart={(e) => handleDragStart(e, index, cat)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDrop(e, index, cat)}
                                  className={`${editingGameId === item.id ? "row-highlight-editing" : ""} ${item.is_visible === false ? "item-hidden" : ""}`.trim()}
                                >
                                  <td style={{ cursor: "grab", color: "var(--text-muted)", textAlign: "center" }} title="Arraste para reordenar">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
                                      <circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
                                    </svg>
                                  </td>
                                  <td className="font-semibold" style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "none" }}>
                                    {item.image && <img src={item.image} alt={item.title} style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px" }}/>}
                                    {item.title}
                                  </td>
                                  <td>{item.badge ? <span className="table-tag-mini">{item.badge}</span> : "-"}</td>
                                  <td>
                                    <div className="table-actions-flex">
                                      <button type="button" className="action-btn-toggle" onClick={() => toggleGameVisibility(item)} title="Visibilidade">
                                        {item.is_visible === false ? (
                                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>
                                        ) : (
                                          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                        )}
                                      </button>
                                      <button type="button" className="action-btn-edit" onClick={() => startGameEdit(item)}><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                                      <button type="button" className="action-btn-delete" onClick={() => deleteGame(item.id)}><svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

        </div>
      </main>
    </div>
  );
}