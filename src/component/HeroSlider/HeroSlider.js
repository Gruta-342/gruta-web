"use client";

import React, { useState } from "react";
import "./HeroSlider.css";

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const slides = [
    {
      id: 1,
      desktopImg: "/assets/copa.jpg",
      mobileImg: "/assets/copa-mob.jpg",
      alt: "Brasil vs. Marrocos"
    },
    {
      id: 2,
      desktopImg: "/assets/mafia.jpg", 
      mobileImg: "/assets/mafia-mob.jpg",
      alt: "Grotta Nostra"
    },
    {
      id: 3,
      desktopImg: "/assets/copa2.jpg",
      mobileImg: "/assets/copa2-mob.jpg",
      alt: "Brasil vs. Haiti"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide(currentSlide === slides.length - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1);
  };

  const onTouchStart = (e) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientX); 
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX); 
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide(); 
    }
  };

  return (
    <section 
      className="hero-slider"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
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