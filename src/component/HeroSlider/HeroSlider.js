import React, { useState } from "react";
import "./HeroSlider.css";

import mafiaImg from "../../assets/mafia.jpg";
import mafiaMobImg from "../../assets/mafia-mob.jpg";
import copaImg from "../../assets/copa.jpg";
import copaMobImg from "../../assets/copa-mob.jpg";
import copa2Img from "../../assets/copa2.jpg";
import copaMob2Img from "../../assets/copa2-mob.jpg";

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Estados para calcular o arrastar do dedo (Swipe) no celular
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Distância mínima (em pixels) para considerar que foi um arrasto e não só um toque acidental
  const minSwipeDistance = 50;

  const slides = [
    {
      id: 1,
      desktopImg: copaImg,
      mobileImg: copaMobImg,
      alt: "Brasil vs. Marrocos"
    },
    {
      id: 2,
      desktopImg: mafiaImg, 
      mobileImg: mafiaMobImg,
      alt: "Grotta Nostra"
    },
    {
      id: 3,
      desktopImg: copa2Img,
      mobileImg: copaMob2Img,
      alt: "Brasil vs. Haiti"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
  };

  // --- FUNÇÕES DE SWIPE ---
  const onTouchStart = (e) => {
    setTouchEnd(null); // Zera o final toda vez que toca
    setTouchStart(e.targetTouches[0].clientX); // Salva a posição X (horizontal) inicial
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX); // Atualiza a posição X enquanto arrasta
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    // Calcula a distância percorrida
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide(); // Arrastou para a esquerda, vai pro próximo
    }
    if (isRightSwipe) {
      prevSlide(); // Arrastou para a direita, volta pro anterior
    }
  };

  return (
    <section 
      className="hero-slider"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Botão Esquerdo com SVG */}
      <button className="arrow left-arrow" onClick={prevSlide}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <div className="slider-content">
        {slides.map((slide, index) => (
          <div 
            key={slide.id} 
            className={`slide ${index === currentSlide ? "active" : ""}`}
          >
            <picture>
              <source media="(max-width: 768px)" srcSet={slide.mobileImg} />
              <img src={slide.desktopImg} alt={slide.alt} className="slide-image" />
            </picture>
          </div>
        ))}
      </div>
      
      {/* Botão Direito com SVG */}
      <button className="arrow right-arrow" onClick={nextSlide}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="dots-container">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          ></button>
        ))}
      </div>
    </section>
  );
}