import React from "react";
import "./EventCard.css";

export default function EventCard({ data }) {
  return (
    <div className="event-card">
      
      {/* O Wrapper abraça tanto a tag <img> quanto a data! */}
      <div className="event-image-wrapper">
        <img src={data.image} alt={data.title} className="event-image" />
        <div className="event-date">{data.date}</div>
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