import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Card, CartLine } from "../types";

const STORAGE_KEY = "proxy-printer-cart";

interface CartContextValue {
  lines: CartLine[];
  totalCopies: number;
  qtyOf: (cardId: string) => number;
  add: (card: Card, amount?: number) => void;
  remove: (cardId: string) => void;
  setQty: (card: Card, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadInitial(): Record<string, CartLine> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CartLine>;
  } catch {
    return {};
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [byId, setById] = useState<Record<string, CartLine>>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(byId));
  }, [byId]);

  const add = useCallback((card: Card, amount = 1) => {
    setById((prev) => {
      const existing = prev[card.id];
      const qty = (existing?.qty ?? 0) + amount;
      return { ...prev, [card.id]: { card, qty } };
    });
  }, []);

  const remove = useCallback((cardId: string) => {
    setById((prev) => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    });
  }, []);

  const setQty = useCallback((card: Card, qty: number) => {
    setById((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[card.id];
        return next;
      }
      return { ...prev, [card.id]: { card, qty } };
    });
  }, []);

  const clear = useCallback(() => setById({}), []);

  // Object.values preserva a ordem de insercao das chaves (ids sao strings
  // nao-numericas), entao o carrinho fica na ordem em que as cartas foram
  // adicionadas.
  const lines = useMemo(() => Object.values(byId), [byId]);

  const totalCopies = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines]
  );

  const qtyOf = useCallback((cardId: string) => byId[cardId]?.qty ?? 0, [byId]);

  const value: CartContextValue = {
    lines,
    totalCopies,
    qtyOf,
    add,
    remove,
    setQty,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
