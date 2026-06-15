"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import "./Header.css";
import AuthButton from "../AuthButton/AuthButton";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "JOGOS", path: "/jogos" },
    { name: "GALERIA", path: "/galeria" },
    { name: "SOBRE", path: "/sobre" }
  ];

  return (
    <header className={`header-container ${isScrolled ? "scrolled" : ""}`}>
      <div className="top-bar">
        
        <div className="left-section">
          <p className="header-slogan desktop-slogan">
            Onde o caos vira história<br />
            e a zoeira é tradição.
          </p>
          {/* Botão de Autenticação na visualização Mobile */}
          <div className="mobile-profile-left">
            <AuthButton />
          </div>
        </div>
        
        <div className="center-section">
          <Link href="/" className="header-logo-link">
            <img src="/assets/logo.png" alt="Logo Gruta" className="desktop-logo" />
            <img src="/assets/logo.png" alt="Logo Gruta" className="mobile-logo" />
          </Link>
        </div>

        <div className="right-section">
          {/* Botão de Autenticação na visualização Desktop */}
          <div className="desktop-profile">
            <AuthButton />
          </div>
          
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

      <nav className={`bottom-nav ${isMobileMenuOpen ? "open" : ""}`}>
        <ul>
          {navItems.map((item, index) => (
            <li key={index}>
              <Link 
                href={item.path} 
                className={pathname === item.path ? "active" : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}