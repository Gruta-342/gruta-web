"use client";

import React from "react";
import { usePathname } from "next/navigation";
import "./FloatingSocials.css";

export default function FloatingSocials() {
  const pathname = usePathname();
  
  const isPainelAdmin = pathname?.startsWith("/admin");
  const isTermo = pathname?.includes("/termo");

  // Se estivermos no Painel Admin ou no jogo Termo, não renderiza os botões
  if (isPainelAdmin || isTermo) {
    return null;
  }

  return (
    <div className="floating-socials">
      <a 
        href="https://instagram.com/gruta342" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="social-btn instagram"
        title="Siga nosso Instagram"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      </a>
    </div>
  );
}