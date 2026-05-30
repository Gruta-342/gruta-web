import React from "react";
import "./Header.css";
import logoGruta from "../src/assets/Gruta Simplificado - Fundo Escuro.png";

export default function Header() {
  return (
    <header className="header-container">
      <div className="top-bar">
        <button className="menu-btn">☰ MENU</button>
        <div className="logo">
          {/* Substitua pela imagem real depois */}
          <h2>GRUTA</h2>
        </div>
        <div className="user-actions">
          <button>🔍</button>
          <button>👤</button>
        </div>
      </div>
      <nav className="bottom-nav">
        <ul>
          <li className="active">HOME</li>
          <li>CALENDÁRIO</li>
          <li>GALERIA</li>
          <li>GALERIA</li>
          <li>SOBRE</li>
        </ul>
      </nav>
    </header>
  );
}