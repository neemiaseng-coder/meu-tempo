import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const quotes = [
  [
    'Escolha uma prioridade e comece por ela.',
    'Dê atenção ao primeiro passo. O próximo fica mais claro depois.',
    'Quando o dia estiver cheio, anote o que realmente precisa da sua atenção.',
    'Comece pela parte da tarefa que você já sabe fazer.',
    'Uma lista curta ajuda a abrir espaço para o que importa.',
    'Reserve alguns minutos para decidir o que merece seu foco hoje.',
    'Antes de abrir outra demanda, veja se consegue concluir a que está em andamento.',
  ],
  [
    'O que você conclui aos poucos também faz diferença.',
    'Reorganizar a agenda é parte de cuidar do seu tempo.',
    'Uma pausa breve pode devolver clareza à próxima decisão.',
    'Se o plano mudou, ajuste a próxima ação e siga.',
    'Reconheça o que avançou, mesmo quando ainda falta terminar.',
    'Fazer uma coisa de cada vez ajuda a manter o ritmo.',
    'Uma tarefa difícil fica mais manejável quando você a divide em etapas.',
    'Deixe espaço na agenda para o que surgir ao longo do dia.',
  ],
  [
    'Ao encerrar o dia, anote o primeiro passo de amanhã.',
    'Uma pendência bem anotada ocupa menos espaço na cabeça.',
    'Olhe para o que foi concluído antes de reorganizar o que ficou.',
    'Volte ao que importa sempre que o dia puxar sua atenção para outro lado.',
    'Um ritmo que você consegue sustentar vale mais do que um dia corrido.',
    'Feche o que for possível e deixe o restante com um próximo passo claro.',
    'Cada tarefa concluída abre espaço para a próxima.',
    'Se precisar recomeçar, escolha um passo que caiba no tempo disponível.',
    'Faça o que está ao seu alcance hoje e planeje o restante com calma.',
  ],
];

export function quotesForDate(date) {
  const day = Math.floor(Date.parse(date + 'T00:00:00Z') / 86_400_000);
  return quotes.map((group, index) => group[((day + index) % group.length + group.length) % group.length]);
}

export default function DailyQuotes({ date }) {
  const [index, setIndex] = useState(0);
  const daily = quotesForDate(date);
  const move = offset => setIndex(current => (current + offset + daily.length) % daily.length);
  return <section className="aw-daily-quote" aria-label="Frases do dia">
    <Sparkles size={17} aria-hidden="true"/>
    <p aria-live="polite">{daily[index]}</p>
    <div className="aw-quote-controls">
      <button type="button" aria-label="Frase anterior" onClick={() => move(-1)}><ChevronLeft size={17}/></button>
      <span>{index + 1}/{daily.length}</span>
      <button type="button" aria-label="Próxima frase" onClick={() => move(1)}><ChevronRight size={17}/></button>
    </div>
  </section>;
}
