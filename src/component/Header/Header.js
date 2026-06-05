import React, { useState, useEffect } from "react";
// Importamos o NavLink do router
import { NavLink } from "react-router-dom"; 
import "./Header.css";
import logoGruta from "../../assets/logo.png";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Agora nosso array de menu tem o nome E o caminho do link!
  const navItems = [
    { name: "HOME", path: "/" },
    { name: "CALENDÁRIO", path: "/calendario" },
    { name: "JOGOS", path: "/jogos" },
    { name: "GALERIA", path: "/galeria" },
    { name: "SOBRE", path: "/sobre" }
  ];

  return (
    <header className={`header-container ${isScrolled ? "scrolled" : ""}`}>
      <div className="top-bar">
        
        {/* ESQUERDA: Slogan no PC / Perfil no Celular */}
        <div className="left-section">
          <p className="header-slogan desktop-slogan">
            Onde o caos vira história<br />
            e a zoeira é tradição.
          </p>
          <button className="profile-btn mobile-profile-left" title="Perfil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M18 20a6 6 0 0 0-12 0"></path>
              <circle cx="12" cy="10" r="4"></circle>
            </svg>
          </button>
        </div>
        
        {/* CENTRO: Logo */}
        <div className="center-section">
          <img src={logoGruta} alt="Logo Gruta" className="desktop-logo" />
          <img src={logoGruta} alt="Logo Gruta" className="mobile-logo" />
        </div>

        {/* DIREITA: Perfil no PC / Hambúrguer no Celular */}
        <div className="right-section">
          <button className="profile-btn desktop-profile" title="Perfil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M18 20a6 6 0 0 0-12 0"></path>
              <circle cx="12" cy="10" r="4"></circle>
            </svg>
          </button>
          
          <button 
            className="hamburger-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>

      </div>
      
      <div className="separator"></div>

      {/* MENU NAVEGAÇÃO */}
      <nav className={`bottom-nav ${isMobileMenuOpen ? "open" : ""}`}>
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              {/* O NavLink substitui o evento de clique manual */}
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? "active" : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}