import type { Card } from "../types";
import { useCart } from "../state/CartContext";

interface CardTileProps {
  card: Card;
  onZoom: () => void;
}

export function CardTile({ card, onZoom }: CardTileProps) {
  const { qtyOf, add, setQty } = useCart();
  const qty = qtyOf(card.id);

  return (
    <div className="card-tile">
      <div className="card-tile-image-wrap" onClick={onZoom}>
        <img src={card.image} alt={card.name} loading="lazy" />
        {qty > 0 && <span className="card-tile-badge">{qty}</span>}
      </div>
      <div className="card-tile-info">
        <span className="card-tile-name" title={card.name}>
          {card.name}
        </span>
        <span className="card-tile-meta">
          {card.setLabel} · {card.setCode.toUpperCase()}-{card.number}
        </span>
      </div>
      {qty === 0 ? (
        <button className="btn btn-add" onClick={() => add(card)}>
          Adicionar
        </button>
      ) : (
        <div className="qty-stepper">
          <button
            className="btn btn-step"
            onClick={() => setQty(card, qty - 1)}
            aria-label="Diminuir quantidade"
          >
            −
          </button>
          <span className="qty-value">{qty}</span>
          <button
            className="btn btn-step"
            onClick={() => add(card)}
            aria-label="Aumentar quantidade"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
