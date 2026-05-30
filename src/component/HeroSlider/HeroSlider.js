import React from "react";
import "./HeroSlider.css";

export default function HeroSlider() {
  return (
    <section className="hero-slider">
      <button className="arrow left-arrow">❮</button>
      <div className="slider-content">
        {/* Aqui entrarão as imagens dos Backrooms futuramente */}
      </div>
      <button className="arrow right-arrow">❯</button>
    </section>
  );
}