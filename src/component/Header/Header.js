import React, { useState, useEffect } from "react";
import "./Header.css";
import logoGruta from "../../assets/logo.png";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Esse estado guarda qual botão está selecionado. 
  // O número 0 representa o primeiro botão ("HOME").
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsScrolled(true);
      } else if (window.scrollY < 20) {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lista dos botões do seu menu
  const navItems = ["HOME", "CALENDÁRIO", "GALERIA", "GALERIA", "SOBRE"];

  return (
    <header className={`header-container ${isScrolled ? "scrolled" : ""}`}>
      <div className="top-bar">
        
        <div className="menu-container">
        </div>
        
        <div className="logo-container">
          <img src={logoGruta} alt="Logo Gruta" className="logo-img" />
        </div>

        <div className="user-actions">
          {/* Botão de Perfil em SVG*/}
          <button className="profile-btn" title="Perfil (Em Breve)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Círculo externo */}
              <circle cx="12" cy="12" r="10"></circle>
              {/* Ombros (arco que toca exatamente na borda do círculo) */}
              <path d="M18 20a6 6 0 0 0-12 0"></path>
              {/* Cabeça */}
              <circle cx="12" cy="10" r="4"></circle>
            </svg>
          </button>
        </div>

      </div>
      
      {/* Aqui entra a linha fina divisória */}
      <div className="separator"></div>

      <nav className="bottom-nav">
        <ul>
          {/* O map desenha todos os botões e testa se ele é o ativo para mudar a cor */}
          {navItems.map((item, index) => (
            <li 
              key={index} 
              className={activeTab === index ? "active" : ""}
              onClick={() => setActiveTab(index)}
            >
              {item}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}