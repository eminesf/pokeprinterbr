import { useMemo, useState } from "react";
import cardsData from "./data/cards.json";
import type { Card } from "./types";
import { CartProvider, useCart } from "./state/CartContext";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { CardGrid } from "./components/CardGrid";
import { CartSidebar } from "./components/CartSidebar";
import "./App.css";

const cards = cardsData as Card[];
const SET_OPTIONS = [...new Set(cards.map((c) => c.setLabel))].sort();

function AppContent() {
  const [query, setQuery] = useState("");
  const [setLabel, setSetLabel] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const { totalCopies } = useCart();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesSet = !setLabel || card.setLabel === setLabel;
      const matchesQuery =
        !q ||
        card.name.toLowerCase().includes(q) ||
        card.number.includes(q) ||
        `${card.setCode}-${card.number}`.toLowerCase().includes(q);
      return matchesSet && matchesQuery;
    });
  }, [query, setLabel]);

  return (
    <div className="app-shell">
      <Header cartCount={totalCopies} onOpenCart={() => setCartOpen(true)} />
      <div className="app-layout">
        <main className="main-content">
          <header className="app-header">
            <p>
              Monte sua folha de proxies: busque as cartas, adicione ao
              carrinho e exporte um PDF pronto pra imprimir (cartas 3%
              menores que o tamanho real, pra caber no sleeve por cima da
              original).
            </p>
          </header>
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            setLabel={setLabel}
            onSetChange={setSetLabel}
            setOptions={SET_OPTIONS}
            resultCount={filtered.length}
          />
          <CardGrid cards={filtered} />
        </main>
        <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
      </div>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <AppContent />
    </CartProvider>
  );
}

export default App;
