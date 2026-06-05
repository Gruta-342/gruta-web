import React from "react";
import "./EventCard.css";

export default function EventCard({ data }) {
  return (
    <article className="event-card-vertical">
      
      {/* IMAGEM E DATA FLUTUANTE */}
      <div className="card-image-wrapper">
        <img src={data.image} alt={data.title} className="card-image" />
        <div className="floating-date">
          {data.date}
        </div>
      </div>
      
      {/* CONTEÚDO (TÍTULO, TAGS E DESCRIÇÃO) */}
      <div className="card-content">
        <h3 className="card-title">{data.title}</h3>
        
        {/* Renderiza as tags apenas se elas existirem no seu data */}
        {data.tags && data.tags.length > 0 && (
          <div className="card-tags">
            {data.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
        
        <p className="card-description">{data.description}</p>
      </div>
      
    </article>
  );
}