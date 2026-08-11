interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
}

export function Header({ cartCount, onOpenCart }: HeaderProps) {
  return (
    <header className="top-header">
      <span className="top-header-title">Pokemon Proxy Printer</span>
      <button
        className="cart-toggle-btn"
        onClick={onOpenCart}
        aria-label="Abrir carrinho"
      >
        🛒
        {cartCount > 0 && (
          <span className="cart-toggle-badge">{cartCount}</span>
        )}
      </button>
    </header>
  );
}
