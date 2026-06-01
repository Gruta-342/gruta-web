import React from "react";
import "./HeroSlider.css";
// Importando a imagem da pasta assets (dois níveis acima)
import scapeImg from "../../assets/scape.jpg";

export default function HeroSlider() {
  return (
    <section className="hero-slider">
      <button className="arrow left-arrow">❮</button>
      
      <div className="slider-content">
        <img src={scapeImg} alt="Banner Escape the Backrooms" className="slide-image" />
      </div>
      
      <button className="arrow right-arrow">❯</button>
    </section>
  );
}