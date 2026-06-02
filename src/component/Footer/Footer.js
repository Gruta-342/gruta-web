import React from "react";
import "./Footer.css";
import logoGruta from "../../assets/logo.png";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <img src={logoGruta} alt="Logo Gruta" className="footer-logo" />
        <p className="footer-slogan">"Onde o caos vira história e a zoeira é tradição."</p>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 Gruta Game House — Todos os direitos reservados (mais ou menos).</p>
      </div>
    </footer>
  );
}