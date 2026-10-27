"use client";

import React from "react";
import { usePathname } from "next/navigation";
import "./Footer.css";

export default function Footer() {
  const pathname = usePathname();

  // Se a rota incluir "termo", oculta o rodapé completamente
  if (pathname?.includes("/termo")) return null;

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <img src="/assets/landscape.png" alt="Paisagem Gruta" className="footer-landscape" />
        <p className="footer-slogan">Onde o caos vira história e a zoeira é tradição.</p>
      </div>
      
      <div className="footer-bottom">
        <p>© 2025 Gruta Game House — Todos os direitos reservados (mais ou menos).</p>
      </div>
    </footer>
  );
}