import React from "react";
import "./Footer.css";
// Trocando o logo pela nova paisagem
import landscapeImg from "../../assets/landscape.png";

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <img src={landscapeImg} alt="Paisagem Gruta" className="footer-landscape" />
        {/* Slogan sem as aspas, conforme a sua nova versão */}
        <p className="footer-slogan">Onde o caos vira história e a zoeira é tradição.</p>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 Gruta Game House — Todos os direitos reservados (mais ou menos).</p>
      </div>
    </footer>
  );
}