"use client";

import React, { useState, useEffect, useRef } from "react";
import "./Galeria.css";
import { photosData } from "../../data/photos";

// Componentes SVG para ícones
const ChevronDownIcon = () => (
  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L6 6L11 1" stroke="#00D2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Galeria() {
  const [activeFilters, setActiveFilters] = useState([]);
  // Agora rastreamos o ID da foto selecionada
  const [selectedPhotoId, setSelectedPhotoId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const allTags = Array.from(new Set(photosData.flatMap(photo => photo.tags))).sort();
  const availableTags = allTags.filter(tag => !activeFilters.includes(tag));

  const filteredPhotos = activeFilters.length === 0
    ? photosData
    : photosData.filter(photo =>
      activeFilters.every(filter => photo.tags.includes(filter))
    );

  const hallOfFamePhotos = photosData.filter(photo => photo.isHallOfFame);

  // Encontra a foto atualmente selecionada e seu índice na lista filtrada
  const selectedPhoto = photosData.find(photo => photo.id === selectedPhotoId);
  const currentPhotoIndex = filteredPhotos.findIndex(photo => photo.id === selectedPhotoId);

  // Funções de Navegação do Carrossel
  const showNext = (e) => {
    e.stopPropagation(); // Impede fechar o lightbox
    const nextIndex = (currentPhotoIndex + 1) % filteredPhotos.length;
    setSelectedPhotoId(filteredPhotos[nextIndex].id);
  };

  const showPrev = (e) => {
    e.stopPropagation(); // Impede fechar o lightbox
    const prevIndex = (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
    setSelectedPhotoId(filteredPhotos[prevIndex].id);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    // Adiciona navegação por teclado (setas)
    const handleKeyDown = (event) => {
      if (selectedPhotoId === null) return;
      if (event.key === "ArrowRight") showNext(event);
      if (event.key === "ArrowLeft") showPrev(event);
      if (event.key === "Escape") setSelectedPhotoId(null);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedPhotoId, currentPhotoIndex, filteredPhotos]); // Dependências atualizadas

  const handleAddFilter = (tag) => {
    if (!activeFilters.includes(tag)) {
      setActiveFilters([...activeFilters, tag]);
    }
    setIsDropdownOpen(false);
  };

  const handleRemoveFilter = (tagToRemove) => {
    setActiveFilters(activeFilters.filter(tag => tag !== tagToRemove));
  };

  return (
    <section className="galeria-page">

      {/* CABEÇALHO */}
      <div className="galeria-header">
        <h1 className="galeria-main-title">Mural de Evidências</h1>
        <p className="galeria-intro">
          Registros de momentos que talvez não devessem ser registrados.
        </p>
      </div>

      {/* SISTEMA DE FILTROS: DROPDOWN + TAGS ATIVAS */}
      <div className="galeria-filters-modern">

        {/* Seletor à Esquerda com Ícone SVG */}
        <div className="custom-dropdown" ref={dropdownRef}>
          <button
            className="dropdown-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>Filtrar evidências...</span>
            <span className={`galeria-dropdown-arrow ${isDropdownOpen ? "open" : ""}`}>
              <ChevronDownIcon />
            </span>
          </button>

          {isDropdownOpen && availableTags.length > 0 && (
            <ul className="dropdown-menu">
              {availableTags.map(tag => (
                <li key={tag} onClick={() => handleAddFilter(tag)}>
                  {tag}
                </li>
              ))}
            </ul>
          )}
          {isDropdownOpen && availableTags.length === 0 && (
            <ul className="dropdown-menu">
              <li style={{ pointerEvents: "none", color: "#666" }}>Nenhuma tag restante</li>
            </ul>
          )}
        </div>

        {/* Tags Ativas à Direita */}
        <div className="active-filters-container">
          {activeFilters.map(tag => (
            <span key={tag} className="filter-chip">
              {tag}
              <button
                className="filter-chip-remove"
                onClick={() => handleRemoveFilter(tag)}
                title={`Remover filtro ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>

      </div>

      {/* GRID MASONRY OU MENSAGEM VAZIA */}
      {filteredPhotos.length > 0 ? (
        <div className="masonry-grid">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="masonry-item"
              onClick={() => setSelectedPhotoId(photo.id)} // Seleciona por ID
            >
              <img src={photo.img} alt="Momento Gruta" className="masonry-img" />
              {/* O overlay de hover foi atualizado no CSS */}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-photos-message">
          <p>Nenhuma evidência encontrada com essa exata combinação de filtros.</p>
        </div>
      )}

      <div className="galeria-separator"></div>

      {/* HALL DA FAMA */}
      <div className="hall-of-fame-section">
        <h2 className="section-subtitle">Hall da Fama</h2>
        <p className="section-tagline">Os momentos mais icônicos da Gruta.</p>

        <div className="hall-of-fame-grid">
          {hallOfFamePhotos.map((photo) => (
            <div
              key={`hof-${photo.id}`}
              className="hof-card"
              onClick={() => setSelectedPhotoId(photo.id)} // Seleciona por ID
            >
              <img src={photo.img} alt="Hall da Fama" className="hof-img" />
              <div className="hof-frame"></div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX COM NAVEGAÇÃO DE CARROSSEL */}
      {selectedPhoto && (
        <div className="lightbox-overlay" onClick={() => setSelectedPhotoId(null)}>
          <button className="close-lightbox" onClick={() => setSelectedPhotoId(null)}>×</button>

          {/* Setas de Navegação */}
          {filteredPhotos.length > 1 && (
            <>
              <button className="lightbox-nav-btn prev" onClick={showPrev} title="Anterior (Seta Esquerda)">
                <ArrowLeftIcon />
              </button>
              <button className="lightbox-nav-btn next" onClick={showNext} title="Próxima (Seta Direita)">
                <ArrowRightIcon />
              </button>
            </>
          )}

          <div className="lightbox-content polaroid-in" onClick={e => e.stopPropagation()}>
            <div className="lightbox-img-wrapper">
              <img src={selectedPhoto.img} alt="Ampliada" className="lightbox-img" />
              <span className="photo-date-stamp">{selectedPhoto.date}</span>
            </div>
            <div className="lightbox-caption">
              <p>{selectedPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}