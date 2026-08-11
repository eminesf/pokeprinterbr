import { useState } from "react";
import type { Card } from "../types";
import { CardTile } from "./CardTile";
import { CardZoomOverlay } from "./CardZoomOverlay";

interface CardGroup {
  label: string;
  items: { card: Card; index: number }[];
}

function groupBySet(cards: Card[]): CardGroup[] {
  const groups: CardGroup[] = [];
  const groupIndexByLabel = new Map<string, number>();

  cards.forEach((card, index) => {
    let groupIdx = groupIndexByLabel.get(card.setLabel);
    if (groupIdx === undefined) {
      groupIdx = groups.length;
      groupIndexByLabel.set(card.setLabel, groupIdx);
      groups.push({ label: card.setLabel, items: [] });
    }
    groups[groupIdx].items.push({ card, index });
  });

  return groups;
}

export function CardGrid({ cards }: { cards: Card[] }) {
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  if (cards.length === 0) {
    return <p className="empty-state">Nenhuma carta encontrada.</p>;
  }

  const groups = groupBySet(cards);

  return (
    <>
      {groups.map((group) => (
        <section key={group.label} className="card-group">
          <h2 className="card-group-title">
            {group.label}
            <span className="card-group-count">{group.items.length}</span>
          </h2>
          <div className="card-grid">
            {group.items.map(({ card, index }) => (
              <CardTile
                key={card.id}
                card={card}
                onZoom={() => setZoomIndex(index)}
              />
            ))}
          </div>
        </section>
      ))}

      {zoomIndex !== null && (
        <CardZoomOverlay
          cards={cards}
          index={zoomIndex}
          onClose={() => setZoomIndex(null)}
          onIndexChange={setZoomIndex}
        />
      )}
    </>
  );
}
