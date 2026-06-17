"use client";

import React, { useState, useEffect } from "react";
import "./admin.css";

export default function AdminPanel() {
  // Controle de Navegação Lateral
  const [activeMenu, setActiveMenu] = useState("proximos");

  // Alertas do Painel
  const [alert, setAlert] = useState({ type: "", message: "" });

  // Estados de Controle de Edição (Armazenam o ID do item sendo editado)
  const [editingEventId, setEditingEventId] = useState(null);
  const [editingAlbumId, setEditingAlbumId] = useState(null);
  const [editingGameId, setEditingGameId] = useState(null);

  // --- ESTADOS DE DADOS ---
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Noite do Tabuleiro",
      description: "Traga seu jogo favorito e participe das mesas abertas.",
      date: "2026-07-15",
      time: "19:00",
      bannerUrl: "",
      tags: ["Boardgames", "Social"],
      category: "proximos"
    },
    {
      id: 2,
      title: "Campeonato de Magic",
      description: "Torneio formato Commander com premiação para o Top 4.",
      date: "2026-05-10",
      time: "14:00",
      bannerUrl: "",
      tags: ["Cardgames", "Torneio"],
      category: "ultimos"
    }
  ]);

  const [galleryAlbums, setGalleryAlbums] = useState([
    {
      id: 1,
      title: "Fotos da Inauguração da Gruta",
      date: "2026-02-20",
      tags: ["Inauguração", "Espaço"],
      images: [] 
    }
  ]);

  const [games, setGames] = useState([
    {
      id: 1,
      name: "Catan",
      category: "Boardgame",
      players: "3-4",
      status: "Disponível"
    },
    {
      id: 2,
      name: "Magic: The Gathering (Decks)",
      category: "Cardgame",
      players: "2-4",
      status: "Em Uso"
    }
  ]);

  // --- ESTADOS DOS FORMULÁRIOS ---
  // Formulário de Eventos
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventBanner, setEventBanner] = useState(null);
  const [eventTags, setEventTags] = useState([]);
  const [eventTagInput, setEventTagInput] = useState("");

  // Formulário de Galeria
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDate, setGalleryDate] = useState("");
  const [galleryTags, setGalleryTags] = useState([]);
  const [galleryTagInput, setGalleryTagInput] = useState("");
  const [galleryFiles, setGalleryFiles] = useState([]);

  // Formulário de Jogos
  const [gameName, setGameName] = useState("");
  const [gameCategory, setGameCategory] = useState("");
  const [gamePlayers, setGamePlayers] = useState("");
  const [gameStatus, setGameStatus] = useState("Disponível");

  // Temporizador para limpar os alertas automaticamente após 4 segundos
  useEffect(() => {
    if (alert.message) {
      const timer = setTimeout(() => setAlert({ type: "", message: "" }), 4000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Auxiliar para obter a data de hoje no formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // --- GERENCIAMENTO DE TAGS ---
  const handleAddTag = (type) => {
    if (type === "event" && eventTagInput.trim()) {
      if (!eventTags.includes(eventTagInput.trim())) {
        setEventTags([...eventTags, eventTagInput.trim()]);
      }
      setEventTagInput("");
    } else if (type === "gallery" && galleryTagInput.trim()) {
      if (!galleryTags.includes(galleryTagInput.trim())) {
        setGalleryTags([...galleryTags, galleryTagInput.trim()]);
      }
      setGalleryTagInput("");
    }
  };

  const handleRemoveTag = (type, tagToRemove) => {
    if (type === "event") {
      setEventTags(eventTags.filter((t) => t !== tagToRemove));
    } else if (type === "gallery") {
      setGalleryTags(galleryTags.filter((t) => t !== tagToRemove));
    }
  };

  // --- TRATAMENTO DE MÚLTIPLOS ARQUIVOS (GALERIA) ---
  const handleGalleryFileChange = (e) => {
    const files = Array.from(e.target.files);
    const filesWithPreview = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setGalleryFiles([...galleryFiles, ...filesWithPreview]);
  };

  const handleRemoveGalleryFile = (idToRemove) => {
    setGalleryFiles(galleryFiles.filter((f) => f.id !== idToRemove));
  };

  // --- AÇÕES: EVENTOS ---
  const handleEventSubmit = (e) => {
    e.preventDefault();
    const today = getTodayDate();

    if (activeMenu === "proximos" && eventDate < today) {
      setAlert({ type: "error", message: "Erro: A data de um Próximo Evento não pode ser retroativa." });
      return;
    }
    if (activeMenu === "ultimos" && eventDate >= today) {
      setAlert({ type: "error", message: "Erro: A data de Últimos Eventos precisa ser uma data passada." });
      return;
    }

    if (editingEventId !== null) {
      // Modo Edição
      setEvents(events.map(evt => evt.id === editingEventId ? {
        ...evt,
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        bannerUrl: eventBanner ? URL.createObjectURL(eventBanner) : evt.bannerUrl,
        tags: eventTags
      } : evt));
      setAlert({ type: "success", message: "Evento atualizado com sucesso!" });
      setEditingEventId(null);
    } else {
      // Modo Inclusão
      const newEvent = {
        id: Date.now(),
        title: eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        bannerUrl: eventBanner ? URL.createObjectURL(eventBanner) : "",
        tags: eventTags,
        category: activeMenu
      };
      setEvents([newEvent, ...events]);
      setAlert({ type: "success", message: "Evento registrado com sucesso!" });
    }

    clearEventForm();
  };

  const startEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDescription(evt.description);
    setEventDate(evt.date);
    setEventTime(evt.time);
    setEventTags(evt.tags);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(evt => evt.id !== id));
    setAlert({ type: "success", message: "Evento excluído do catálogo." });
    if (editingEventId === id) setEditingEventId(null);
  };

  const clearEventForm = () => {
    setEventTitle("");
    setEventDescription("");
    setEventDate("");
    setEventTime("");
    setEventBanner(null);
    setEventTags([]);
    setEditingEventId(null);
  };

  // --- AÇÕES: GALERIA ---
  const handleGallerySubmit = (e) => {
    e.preventDefault();

    if (editingAlbumId !== null) {
      setGalleryAlbums(galleryAlbums.map(album => album.id === editingAlbumId ? {
        ...album,
        title: galleryTitle,
        date: galleryDate,
        tags: galleryTags,
        images: galleryFiles.length > 0 ? galleryFiles.map(f => f.preview) : album.images
      } : album));
      setAlert({ type: "success", message: "Álbum atualizado com sucesso!" });
      setEditingAlbumId(null);
    } else {
      if (galleryFiles.length === 0) {
        setAlert({ type: "error", message: "Erro: Selecione ao menos uma foto para a galeria." });
        return;
      }
      const newAlbum = {
        id: Date.now(),
        title: galleryTitle,
        date: galleryDate,
        tags: galleryTags,
        images: galleryFiles.map((f) => f.preview)
      };
      setGalleryAlbums([newAlbum, ...galleryAlbums]);
      setAlert({ type: "success", message: "Álbum de fotos publicado com sucesso!" });
    }

    clearGalleryForm();
  };

  const startEditAlbum = (album) => {
    setEditingAlbumId(album.id);
    setGalleryTitle(album.title);
    setGalleryDate(album.date);
    setGalleryTags(album.tags);
    setGalleryFiles(album.images.map(imgUrl => ({ id: Math.random().toString(), preview: imgUrl })));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteAlbum = (id) => {
    setGalleryAlbums(galleryAlbums.filter(album => album.id !== id));
    setAlert({ type: "success", message: "Álbum removido da galeria." });
    if (editingAlbumId === id) setEditingAlbumId(null);
  };

  const clearGalleryForm = () => {
    setGalleryTitle("");
    setGalleryDate("");
    setGalleryTags([]);
    setGalleryFiles([]);
    setEditingAlbumId(null);
  };

  // --- AÇÕES: JOGOS ---
  const handleGameSubmit = (e) => {
    e.preventDefault();

    if (editingGameId !== null) {
      setGames(games.map(game => game.id === editingGameId ? {
        ...game,
        name: gameName,
        category: gameCategory,
        players: gamePlayers,
        status: gameStatus
      } : game));
      setAlert({ type: "success", message: "Informações do jogo atualizadas!" });
      setEditingGameId(null);
    } else {
      const newGame = {
        id: Date.now(),
        name: gameName,
        category: gameCategory,
        players: gamePlayers,
        status: gameStatus
      };
      setGames([newGame, ...games]);
      setAlert({ type: "success", message: "Novo jogo adicionado ao acervo!" });
    }

    clearGameForm();
  };

  const startEditGame = (game) => {
    setEditingGameId(game.id);
    setGameName(game.name);
    setGameCategory(game.category);
    setGamePlayers(game.players);
    setGameStatus(game.status);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteGame = (id) => {
    setGames(games.filter(game => game.id !== id));
    setAlert({ type: "success", message: "Jogo removido do acervo." });
    if (editingGameId === id) setEditingGameId(null);
  };

  const clearGameForm = () => {
    setGameName("");
    setGameCategory("");
    setGamePlayers("");
    setGameStatus("Disponível");
    setEditingGameId(null);
  };

  // Filtragem dinâmica dos eventos com base no menu lateral ativo
  const displayedEvents = events.filter((evt) => evt.category === activeMenu);

  return (
    <div className="admin-container">
      {/* MENU LATERAL DA ESQUERDA */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <h2>Painel Admin</h2>
          <span>Gruta 342</span>
        </div>
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeMenu === "proximos" ? "active" : ""}`}
            onClick={() => { setActiveMenu("proximos"); clearEventForm(); }}
          >
            <svg viewBox="0 0 24 24" className="menu-icon"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm-7-3h5v-5h-5v5z"/></svg>
            Próximos Eventos
          </button>
          <button
            className={`menu-item ${activeMenu === "ultimos" ? "active" : ""}`}
            onClick={() => { setActiveMenu("ultimos"); clearEventForm(); }}
          >
            <svg viewBox="0 0 24 24" className="menu-icon"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8z"/></svg>
            Últimos Eventos
          </button>
          <button
            className={`menu-item ${activeMenu === "galeria" ? "active" : ""}`}
            onClick={() => { setActiveMenu("galeria"); clearGalleryForm(); }}
          >
            <svg viewBox="0 0 24 24" className="menu-icon"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/></svg>
            Galeria
          </button>
          <button
            className={`menu-item ${activeMenu === "jogos" ? "active" : ""}`}
            onClick={() => { setActiveMenu("jogos"); clearGameForm(); }}
          >
            <svg viewBox="0 0 24 24" className="menu-icon"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
            Jogos
          </button>
        </nav>
      </aside>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (VERTICAL STACK) */}
      <main className="admin-content-wrapper">
        {alert.message && (
          <div className={`admin-alert ${alert.type}`}>
            <span>{alert.message}</span>
          </div>
        )}

        <header className="content-header">
          <h1>
            {activeMenu === "proximos" && "Gerenciar Próximos Eventos"}
            {activeMenu === "ultimos" && "Histórico de Últimos Eventos"}
            {activeMenu === "galeria" && "Galeria de Fotos da Comunidade"}
            {activeMenu === "jogos" && "Catálogo de Jogos"}
          </h1>
        </header>

        <div className="admin-sections-vertical">
          
          {/* ================= PARTE 1: FORMULÁRIOS DE INCLUSÃO/EDIÇÃO ================= */}
          <section className="form-section-container">
            <h2 className="section-title">
              {activeMenu === "proximos" || activeMenu === "ultimos" ? (editingEventId !== null ? "Editar Evento" : "Incluir Novo Evento") : ""}
              {activeMenu === "galeria" && (editingAlbumId !== null ? "Editar Álbum de Fotos" : "Criar Novo Álbum de Fotos")}
              {activeMenu === "jogos" && (editingGameId !== null ? "Editar Informações do Jogo" : "Adicionar Novo Jogo ao Acervo")}
            </h2>

            {/* FORMULÁRIO DE EVENTOS */}
            {(activeMenu === "proximos" || activeMenu === "ultimos") && (
              <form onSubmit={handleEventSubmit} className="admin-form">
                <div className="form-group">
                  <label>Título do Evento</label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                    placeholder="Ex: Noite Mágica Commander"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Data</label>
                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label>Horário</label>
                    <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group">
                  <label>Banner Informativo (Arte do Evento)</label>
                  <input type="file" accept="image/*" onChange={(e) => setEventBanner(e.target.files[0])} />
                </div>

                <div className="form-group">
                  <label>Descrição Curta</label>
                  <textarea
                    rows="3"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    required
                    placeholder="Descreva brevemente a dinâmica ou regras do evento..."
                  />
                </div>

                <div className="form-group">
                  <label>Tags do Evento</label>
                  <div className="tag-input-wrapper">
                    <input
                      type="text"
                      value={eventTagInput}
                      onChange={(e) => setEventTagInput(e.target.value)}
                      placeholder="Adicionar palavra-chave"
                    />
                    <button type="button" onClick={() => handleAddTag("event")}>Adicionar</button>
                  </div>
                  <div className="tags-container">
                    {eventTags.map((tag, idx) => (
                      <span key={idx} className="tag-badge">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag("event", tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn-primary">
                    {editingEventId !== null ? "Atualizar Registro" : "Salvar Registro"}
                  </button>
                  {editingEventId !== null && (
                    <button type="button" className="btn-secondary" onClick={clearEventForm}>Cancelar Edição</button>
                  )}
                </div>
              </form>
            )}

            {/* FORMULÁRIO DE GALERIA */}
            {activeMenu === "galeria" && (
              <form onSubmit={handleGallerySubmit} className="admin-form">
                <div className="form-group">
                  <label>Título do Álbum / Nome do Evento</label>
                  <input
                    type="text"
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    required
                    placeholder="Ex: Torneio Mensal de RPG - Junho/2026"
                  />
                </div>

                <div className="form-group">
                  <label>Data das Fotos</label>
                  <input type="date" value={galleryDate} onChange={(e) => setGalleryDate(e.target.value)} required className="input-half" />
                </div>

                <div className="form-group">
                  <label>Anexar Imagens (Múltiplos arquivos)</label>
                  <div className="multiple-upload-zone">
                    <input type="file" accept="image/*" multiple onChange={handleGalleryFileChange} id="gallery-file-input" className="hidden-file-input" />
                    <label htmlFor="gallery-file-input" className="file-upload-trigger">
                      <svg viewBox="0 0 24 24" className="upload-svg"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>
                      Clique para escolher múltiplas fotos
                    </label>
                  </div>

                  {galleryFiles.length > 0 && (
                    <div className="gallery-preview-grid">
                      {galleryFiles.map((fileObj) => (
                        <div key={fileObj.id} className="preview-thumbnail-container">
                          <img src={fileObj.preview} alt="Preview" className="preview-img" />
                          <button type="button" className="btn-remove-thumbnail" onClick={() => handleRemoveGalleryFile(fileObj.id)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Tags do Álbum</label>
                  <div className="tag-input-wrapper">
                    <input type="text" value={galleryTagInput} onChange={(e) => setGalleryTagInput(e.target.value)} placeholder="Ex: RPG, Presencial" />
                    <button type="button" onClick={() => handleAddTag("gallery")}>Adicionar</button>
                  </div>
                  <div className="tags-container">
                    {galleryTags.map((tag, idx) => (
                      <span key={idx} className="tag-badge">
                        {tag}
                        <button type="button" onClick={() => handleRemoveTag("gallery", tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn-primary">
                    {editingAlbumId !== null ? "Atualizar Álbum" : "Publicar na Galeria"}
                  </button>
                  {editingAlbumId !== null && (
                    <button type="button" className="btn-secondary" onClick={clearGalleryForm}>Cancelar Edição</button>
                  )}
                </div>
              </form>
            )}

            {/* FORMULÁRIO DE JOGOS */}
            {activeMenu === "jogos" && (
              <form onSubmit={handleGameSubmit} className="admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome do Jogo</label>
                    <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)} required placeholder="Ex: Ticket to Ride" />
                  </div>
                  <div className="form-group">
                    <label>Categoria</label>
                    <input type="text" value={gameCategory} onChange={(e) => setGameCategory(e.target.value)} required placeholder="Ex: Boardgame, Cooperativo" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nº de Jogadores</label>
                    <input type="text" value={gamePlayers} onChange={(e) => setGamePlayers(e.target.value)} required placeholder="Ex: 2-5 jogadores" />
                  </div>
                  <div className="form-group">
                    <label>Status Operacional</label>
                    <select value={gameStatus} onChange={(e) => setGameStatus(e.target.value)} className="admin-select">
                      <option value="Disponível">Disponível</option>
                      <option value="Em Uso">Em Uso</option>
                      <option value="Manutenção">Manutenção</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions-row">
                  <button type="submit" className="btn-primary">
                    {editingGameId !== null ? "Atualizar Jogo" : "Salvar Jogo no Catálogo"}
                  </button>
                  {editingGameId !== null && (
                    <button type="button" className="btn-secondary" onClick={clearGameForm}>Cancelar Edição</button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* ================= PARTE 2: GERENCIAMENTO DE REGISTROS EXISTENTES ================= */}
          <section className="existing-records-section">
            <h2 className="section-title">Alteração e Controle de Itens Ativos</h2>

            {/* LISTAGEM DE EVENTOS */}
            {(activeMenu === "proximos" || activeMenu === "ultimos") && (
              <div className="records-table-wrapper">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Título</th>
                      <th>Data / Hora</th>
                      <th>Tags</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEvents.map((item) => (
                      <tr key={item.id} className={editingEventId === item.id ? "row-highlight-editing" : ""}>
                        <td className="font-semibold">{item.title}</td>
                        <td>{item.date} às {item.time}</td>
                        <td>
                          <div className="table-tags-flex">
                            {item.tags.map((t, idx) => <span key={idx} className="table-tag-mini">{t}</span>)}
                          </div>
                        </td>
                        <td>
                          <div className="table-actions-flex">
                            <button type="button" className="action-btn-edit" onClick={() => startEditEvent(item)} title="Editar registro">
                              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button type="button" className="action-btn-delete" onClick={() => deleteEvent(item.id)} title="Excluir registro">
                              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {displayedEvents.length === 0 && (
                      <tr>
                        <td colSpan="4" className="table-empty-state">Nenhum evento registrado nesta categoria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* LISTAGEM DE ÁLBUNS DA GALERIA */}
            {activeMenu === "galeria" && (
              <div className="records-table-wrapper">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Nome do Álbum</th>
                      <th>Data de Registro</th>
                      <th>Mídias</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {galleryAlbums.map((album) => (
                      <tr key={album.id} className={editingAlbumId === album.id ? "row-highlight-editing" : ""}>
                        <td className="font-semibold">{album.title}</td>
                        <td>{album.date}</td>
                        <td>{album.images.length} foto(s)</td>
                        <td>
                          <div className="table-actions-flex">
                            <button type="button" className="action-btn-edit" onClick={() => startEditAlbum(album)} title="Editar álbum">
                              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button type="button" className="action-btn-delete" onClick={() => deleteAlbum(album.id)} title="Excluir álbum">
                              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {galleryAlbums.length === 0 && (
                      <tr>
                        <td colSpan="4" className="table-empty-state">A galeria de fotos está vazia.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* LISTAGEM DE JOGOS */}
            {activeMenu === "jogos" && (
              <div className="records-table-wrapper">
                <table className="records-table">
                  <thead>
                    <tr>
                      <th>Nome do Jogo</th>
                      <th>Categoria</th>
                      <th>Jogadores</th>
                      <th>Status</th>
                      <th className="text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
                      <tr key={game.id} className={editingGameId === game.id ? "row-highlight-editing" : ""}>
                        <td className="font-semibold">{game.name}</td>
                        <td>{game.category}</td>
                        <td>{game.players}</td>
                        <td>
                          <span className={`status-badge ${game.status.toLowerCase().replace(" ", "-")}`}>
                            {game.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions-flex">
                            <button type="button" className="action-btn-edit" onClick={() => startEditGame(game)} title="Editar jogo">
                              <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                            </button>
                            <button type="button" className="action-btn-delete" onClick={() => deleteGame(game.id)} title="Excluir jogo">
                              <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {games.length === 0 && (
                      <tr>
                        <td colSpan="5" className="table-empty-state">Nenhum jogo cadastrado no acervo.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}