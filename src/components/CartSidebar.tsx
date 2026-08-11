import { useState } from "react";
import { useCart } from "../state/CartContext";
import { CartItem } from "./CartItem";
import { exportCartToPdf, cardsPerPage, type PageSize } from "../lib/pdf";

interface CartSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function CartSidebar({ open, onClose }: CartSidebarProps) {
  const { lines, totalCopies, clear } = useCart();
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [cropMarks, setCropMarks] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const perPage = cardsPerPage(pageSize);
  const pageCount = totalCopies > 0 ? Math.ceil(totalCopies / perPage) : 0;

  async function handleExport() {
    setExporting(true);
    setProgress({ done: 0, total: totalCopies });
    try {
      await exportCartToPdf(lines, { pageSize, cropMarks }, setProgress);
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar o PDF. Veja o console para detalhes.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <div
        className={`cart-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`cart-sidebar ${open ? "open" : ""}`}>
        <div className="cart-header">
          <h2>Carrinho</h2>
          <div className="cart-header-right">
            <span className="cart-count">{totalCopies} copias</span>
            <button
              className="cart-close-btn"
              onClick={onClose}
              aria-label="Fechar carrinho"
            >
              ×
            </button>
          </div>
        </div>

        <div className="cart-items">
          {lines.length === 0 ? (
            <p className="empty-state">
              Adicione cartas na busca para monta a sua folha de proxies.
            </p>
          ) : (
            lines.map((line) => <CartItem key={line.card.id} line={line} />)
          )}
        </div>

        {lines.length > 0 && (
          <div className="cart-footer">
            <div className="export-options">
              <label>
                Papel
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSize)}
                >
                  <option value="a4">A4</option>
                  <option value="letter">Carta (Letter)</option>
                </select>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cropMarks}
                  onChange={(e) => setCropMarks(e.target.checked)}
                />
                Guias de corte
              </label>
            </div>

            <p className="page-estimate">
              {perPage} cartas por pagina · {pageCount}{" "}
              {pageCount === 1 ? "pagina" : "paginas"}
            </p>

            <button
              className="btn btn-export"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting
                ? `Gerando PDF... ${progress.done}/${progress.total}`
                : "Exportar PDF"}
            </button>
            <button
              className="btn btn-clear"
              onClick={clear}
              disabled={exporting}
            >
              Limpar carrinho
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
