import { MenuIcon, ChevronDownIcon } from "./Icons";

export default function Header({
  title,
  onToggleSidebar,
  models,
  selectedModel,
  onSelectModel,
}) {
  return (
    <header className="chat-header">
      <div className="chat-header-left">
        <button
          className="icon-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <MenuIcon />
        </button>
        <h1>{title}</h1>
      </div>

      <div className="model-select-wrap">
        <select
          className="model-select"
          value={selectedModel}
          onChange={(e) => onSelectModel(e.target.value)}
          aria-label="Model"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="model-select-chevron" />
      </div>
    </header>
  );
}
