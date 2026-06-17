"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import "./admin.css";

const SUGGESTED_TAGS = ["MÁFIA", "FESTA TEMÁTICA", "GAMEPLAY", "CINEMA", "BOARDGAME", "SOBREVIVÊNCIA", "INVESTIGAÇÃO", "CERVEJA", "DARDOS", "DEAD BY DAYLIGHT", "DECEPTION", "ELMI", "NORONHA", "SAMUEL", "YASMIN"];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("upcoming");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [bannerUrl, setBannerUrl] = useState("");
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Temporizador automático para limpar as mensagens de feedback
  useEffect(() => {
    if (message && message !== "Subindo imagem para o Storage...") {
      const timer = setTimeout(() => {
        setMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleAddTag = (e) => {
    e.preventDefault();
    const newTag = tagInput.trim().toUpperCase();
    if (newTag && tags.length < 2 && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const uploadImage = async (file) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`; 
      
      const { data, error } = await supabase.storage.from("events").upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("events").getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error("Erro no upload:", error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsUploading(true);

    // Validação estrita de datas baseada no dia atual
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    const dataAtualStr = `${ano}-${mes}-${dia}`;

    if (activeTab === "past" && date > dataAtualStr) {
      setMessage("Erro: A data de um evento passado nao pode ser posterior ao dia de hoje.");
      setIsUploading(false);
      return;
    }

    if (activeTab === "upcoming" && date < dataAtualStr) {
      setMessage("Erro: A data de um proximo evento nao pode ser anterior ao dia de hoje.");
      setIsUploading(false);
      return;
    }

    try {
      let finalImageUrl = bannerUrl;

      if (imageFile) {
        setMessage("Subindo imagem para o Storage...");
        const uploadedUrl = await uploadImage(imageFile);
        if (!uploadedUrl) {
          setMessage("Falha ao fazer upload da imagem.");
          setIsUploading(false);
          return;
        }
        finalImageUrl = uploadedUrl;
      }

      const payload = { 
        title, description, date, 
        time: activeTab === "upcoming" ? time : "", 
        category: activeTab,
        bannerUrl: finalImageUrl,
        tags 
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
        setMessage(editingId ? "Evento atualizado com sucesso!" : "Evento criado com sucesso!");
        limparFormulario();
        fetchEvents();
      } else {
        setMessage("Falha ao salvar o evento.");
      }
    } catch (err) {
      setMessage("Ocorreu um erro ao processar a requisicao.");
    } finally {
      setIsUploading(false);
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
    setTags(evt.tags || []);
    setImageFile(null);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja apagar este evento?")) {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) fetchEvents();
    }
  };

  const limparFormulario = () => {
    setEditingId(null); setTitle(""); setDescription("");
    setDate(""); setTime(""); setImageFile(null);
    setBannerUrl(""); setTags([]); setTagInput("");
  };

  // Filtra dinamicamente a lista lateral baseado na aba ativa no momento
  const displayedSidebarEvents = events.filter(evt => evt.category === activeTab);

  return (
    <div className="admin-container">
      <div className="admin-grid">
        
        {/* Painel de Criação/Edição */}
        <div className="admin-card">
          <h2 className="admin-subtitle">
            {editingId ? "Editando Evento" : "Criar Novo Evento"}
          </h2>

          {!editingId && (
            <div className="admin-tabs">
              <button className={activeTab === "upcoming" ? "tab active" : "tab"} onClick={() => { setActiveTab("upcoming"); limparFormulario(); }}>
                Próximos Eventos
              </button>
              <button className={activeTab === "past" ? "tab active" : "tab"} onClick={() => { setActiveTab("past"); limparFormulario(); }}>
                Últimos Eventos
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Título do Evento</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              {activeTab === "upcoming" && (
                <div className="form-group">
                  <label>Horário</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                </div>
              )}
            </div>

            {activeTab === "past" && (
              <div className="form-group tag-group">
                <label>Tags (Máx 2)</label>
                <div className="selected-tags">
                  {tags.map(t => (
                    <span key={t} className="tag-pill">
                      {t} 
                      <button type="button" onClick={() => handleRemoveTag(t)}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </span>
                  ))}
                </div>
                {tags.length < 2 && (
                  <div className="tag-input-wrapper">
                    <input 
                      type="text" list="sugestoes-tags" value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Ex: BOARDGAME"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
                    />
                    <datalist id="sugestoes-tags">
                      {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                        <option key={tag} value={tag} />
                      ))}
                    </datalist>
                    <button type="button" onClick={handleAddTag} className="tag-add-btn">Add</button>
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Imagem do Evento {activeTab === "upcoming" ? "(4:3)" : "(1:1)"}</label>
              <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) { setImageFile(e.target.files[0]); } }} />
              {bannerUrl && !imageFile && <p style={{ fontSize: "0.8rem", color: "#00a8ff" }}>Usando imagem existente.</p>}
            </div>

            <div className="form-group">
              <label>Descrição Breve</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="3" required />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit" className="admin-submit-btn" style={{ flex: 1 }} disabled={isUploading}>
                {isUploading ? "Processando..." : editingId ? "Salvar Alterações" : "Publicar no Site"}
              </button>
              {editingId && <button type="button" onClick={limparFormulario} className="admin-cancel-btn">Cancelar</button>}
            </div>
            {message && <p className="admin-message">{message}</p>}
          </form>
        </div>

        {/* Lista Lateral Dinâmica */}
        <div className="admin-card">
          <h2 className="admin-subtitle">
            {activeTab === "upcoming" ? "Próximos Eventos Cadastrados" : "Últimos Eventos Cadastrados"}
          </h2>
          <div className="events-list">
            {displayedSidebarEvents.length > 0 ? (
              displayedSidebarEvents.map((evt) => (
                <div key={evt.id} className="event-item-mini" style={{ borderLeft: evt.category === "upcoming" ? "4px solid #00a8ff" : "4px solid #888" }}>
                  <div>
                    <strong>{evt.title}</strong>
                    <p>{evt.date?.split('-').reverse().join('/')} {evt.time && `às ${evt.time}`}</p>
                    {evt.tags && evt.tags.length > 0 && (
                      <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                        {evt.tags.map(t => <span key={t} style={{ fontSize: "0.7rem", background: "#005f8f", padding: "2px 6px", borderRadius: "4px", color: "white", fontWeight: "bold" }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="event-actions">
                    {/* Botão Editar (SVG Lápis) */}
                    <button onClick={() => handleEdit(evt)} className="edit-btn" title="Editar Evento">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00a8ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    {/* Botão Deletar (SVG Lixeira) */}
                    <button onClick={() => handleDelete(evt.id)} className="delete-btn" title="Excluir Evento">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#aaa", fontSize: "0.9rem", textAlign: "center", padding: "20px 0" }}>
                Nenhum evento registrado nesta categoria.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}