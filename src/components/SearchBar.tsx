interface SearchBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  setLabel: string;
  onSetChange: (value: string) => void;
  setOptions: string[];
  resultCount: number;
}

export function SearchBar({
  query,
  onQueryChange,
  setLabel,
  onSetChange,
  setOptions,
  resultCount,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="search"
        className="search-input"
        placeholder="Buscar carta por nome ou numero..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      <select
        className="set-select"
        value={setLabel}
        onChange={(e) => onSetChange(e.target.value)}
      >
        <option value="">Todos os sets</option>
        {setOptions.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span className="result-count">{resultCount} cartas</span>
    </div>
  );
}
