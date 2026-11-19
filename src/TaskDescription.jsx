import React from 'react';

export default function TaskDescription({ description }) {
  const text = description?.trim();
  if (!text) return null;
  if (text.length <= 140 && !text.includes('\n')) return <p className="task-description">{text}</p>;
  return <details className="task-description">
    <summary>
      <span className="task-description-preview">{text}</span>
      <span className="task-description-more">Ver descrição</span>
      <span className="task-description-less">Recolher descrição</span>
    </summary>
    <p>{text}</p>
  </details>;
}
