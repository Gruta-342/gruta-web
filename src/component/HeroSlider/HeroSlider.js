"use client";

import React, { useState, useEffect } from "react";
import "./HeroSlider.css";

// Ele agora recebe os controles vindos da Home
export default function HeroSlider({ currentSlide, setCurrentSlide, delay, setDelay }) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const slides = [
    {
      id: 1,
      desktopImg: "/assets/grottanostra43.png", 
      mobileImg: "/assets/grottanostra43.png",
      alt: "Grotta Nostra"
    },
    {
      id: 2,
      desktopImg: "/assets/copa2-mob.jpg",
      mobileImg: "/assets/copa2-mob.jpg",
      alt: "Brasil vs. Haiti"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide(prev => prev === slides.length - 1 ? 0 : prev + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => prev === 0 ? slides.length - 1 : prev - 1);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      nextSlide();
      
      if (delay !== 5000) {
        setDelay(5000);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [currentSlide, delay, setDelay]); 

  const handleInteraction = () => {
    setDelay(30000); 
  };

  const manualNextSlide = () => {
    handleInteraction();
    nextSlide();
  };

  const manualPrevSlide = () => {
    handleInteraction();
    prevSlide();
  };

  const manualGoToSlide = (index) => {
    handleInteraction();
    setCurrentSlide(index);
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
      manualNextSlide(); 
    }
    if (isRightSwipe) {
      manualPrevSlide(); 
    }
  };

  return (
    <section 
      className="hero-slider"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <button className="arrow left-arrow" onClick={manualPrevSlide}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      <div 
        className="slider-content"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="slide">
            <picture>
              <source media="(max-width: 768px)" srcSet={slide.mobileImg} />
              <img src={slide.desktopImg} alt={slide.alt} className="slide-image" />
            </picture>
          </div>
        ))}
      </div>
      
      <button className="arrow right-arrow" onClick={manualNextSlide}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      <div className="dots-container">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => manualGoToSlide(index)}
          ></button>
        ))}
      </div>
    </section>
  );
}