"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; 
import { usePathname } from "next/navigation"; 
import "./Header.css";

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
    { name: "CALENDÁRIO", path: "/calendario" },
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
          <button className="profile-btn mobile-profile-left" title="Perfil">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M18 20a6 6 0 0 0-12 0"></path>
              <circle cx="12" cy="10" r="4"></circle>
            </svg>
          </button>
        </div>
        
        <div className="center-section">
          <Link href="/" className="header-logo-link">
            <img src="/assets/logo.png" alt="Logo Gruta" className="desktop-logo" />
            <img src="/assets/logo.png" alt="Logo Gruta" className="mobile-logo" />
          </Link>
        </div>

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