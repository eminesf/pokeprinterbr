import { useEffect, useRef } from "react";
import type { Card } from "../types";
import { useCart } from "../state/CartContext";

const SWIPE_THRESHOLD_PX = 50;

interface CardZoomOverlayProps {
  cards: Card[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function CardZoomOverlay({
  cards,
  index,
  onClose,
  onIndexChange,
}: CardZoomOverlayProps) {
  const { qtyOf, add } = useCart();
  const card = cards[index];
  const qty = qtyOf(card.id);
  const touchStartX = useRef<number | null>(null);

  const canPrev = index > 0;
  const canNext = index < cards.length - 1;

  function goPrev() {
    if (canPrev) onIndexChange(index - 1);
  }

  function goNext() {
    if (canNext) onIndexChange(index + 1);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, cards.length]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (dx > SWIPE_THRESHOLD_PX) goPrev();
    else if (dx < -SWIPE_THRESHOLD_PX) goNext();
  }

  return (
    <div className="card-zoom-overlay" onClick={onClose}>
      <button
        type="button"
        className="card-zoom-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Fechar"
      >
        ×
      </button>

      <div className="card-zoom-stage" onClick={(e) => e.stopPropagation()}>
        {canPrev && (
          <button
            type="button"
            className="card-zoom-nav card-zoom-nav-prev"
            onClick={goPrev}
            aria-label="Carta anterior"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <polyline
                points="15 6 9 12 15 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div
          className="card-zoom-content"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img src={card.image} alt={card.name} />
          <div className="card-zoom-actions">
            <button
              type="button"
              className="btn btn-add card-zoom-add"
              onClick={() => add(card)}
            >
              Adicionar ao carrinho
            </button>
            {qty > 0 && (
              <span className="card-zoom-qty">{qty} no carrinho</span>
            )}
          </div>
        </div>

        {canNext && (
          <button
            type="button"
            className="card-zoom-nav card-zoom-nav-next"
            onClick={goNext}
            aria-label="Proxima carta"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <polyline
                points="9 6 15 12 9 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
