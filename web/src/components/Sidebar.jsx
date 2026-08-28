import { PlusIcon, TrashIcon, HelpIcon, SettingsIcon } from "./Icons";

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
}) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <button className="new-chat-btn" onClick={onNewChat}>
        <PlusIcon />
        <span>New chat</span>
      </button>

      <nav className="chat-list">
        {chats.length === 0 && (
          <p className="chat-list-empty">No chats yet — start one above.</p>
        )}
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`chat-list-item ${chat.id === activeChatId ? "chat-list-item-active" : ""}`}
          >
            <button className="chat-list-item-label" onClick={() => onSelectChat(chat.id)}>
              {chat.title}
            </button>
            <button
              className="chat-list-item-delete"
              title="Delete chat"
              aria-label={`Delete "${chat.title}"`}
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-footer-link" disabled title="Not implemented yet">
          <HelpIcon />
          <span>Help &amp; FAQ</span>
        </button>
        <button className="sidebar-footer-link" disabled title="Not implemented yet">
          <SettingsIcon />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
