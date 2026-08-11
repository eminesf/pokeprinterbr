import type { CartLine } from "../types";
import { useCart } from "../state/CartContext";

export function CartItem({ line }: { line: CartLine }) {
  const { setQty, remove } = useCart();
  const { card, qty } = line;

  return (
    <div className="cart-item">
      <img className="cart-item-thumb" src={card.image} alt={card.name} />
      <div className="cart-item-info">
        <span className="cart-item-name" title={card.name}>
          {card.name}
        </span>
        <span className="cart-item-meta">
          {card.setCode.toUpperCase()}-{card.number}
        </span>
      </div>
      <div className="qty-stepper qty-stepper-sm">
        <button
          className="btn btn-step"
          onClick={() => setQty(card, qty - 1)}
          aria-label="Diminuir quantidade"
        >
          −
        </button>
        <input
          className="qty-input"
          type="number"
          min={0}
          value={qty}
          onChange={(e) => setQty(card, Number(e.target.value) || 0)}
        />
        <button
          className="btn btn-step"
          onClick={() => setQty(card, qty + 1)}
          aria-label="Aumentar quantidade"
        >
          +
        </button>
      </div>
      <button
        className="btn btn-remove"
        onClick={() => remove(card.id)}
        aria-label={`Remover ${card.name}`}
        title="Remover"
      >
        ×
      </button>
    </div>
  );
}
