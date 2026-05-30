import React from "react";
import "./EventCard.css";

export default function EventCard({ data }) {
  return (
    <div className="event-card">
      <div className="card-image-container">
        <img src={data.image} alt={data.title} className="card-image" />
      </div>
      <div className="card-content">
        <h3 className="card-title">{data.title}</h3>
        <div className="tags">
          {data.tags.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
        <p className="card-description">{data.description}</p>
      </div>
    </div>
  );
}