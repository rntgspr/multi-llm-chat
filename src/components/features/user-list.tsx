"use client";

interface User {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  isActive?: boolean;
}

const MOCK_USERS: User[] = [
  { id: "1", name: "GPT-4o", lastMessage: "Como posso ajudar?", time: "agora", isActive: true },
  { id: "2", name: "Claude 3.5", lastMessage: "Olá! Tudo bem?", time: "2m" },
  { id: "3", name: "Gemini Pro", lastMessage: "Claro, vou analisar.", time: "10m" },
  { id: "4", name: "Llama 3", lastMessage: "Entendido.", time: "1h" },
  { id: "5", name: "Mistral", lastMessage: "Posso te ajudar com isso!", time: "3h" },
];

export function UserList() {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-sidebar-foreground">Conversas</h2>
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          {MOCK_USERS.length}
        </span>
      </div>
      <ul className="flex flex-1 flex-col overflow-y-auto">
        {MOCK_USERS.map((user) => (
          <li key={user.id}>
            <button
              type="button"
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-sidebar-accent/30 data-[active=true]:bg-sidebar-accent/50"
              data-active={user.isActive}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                {user.name.slice(0, 2)}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-sidebar-foreground">
                    {user.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{user.time}</span>
                </div>
                <span className="truncate text-xs text-muted-foreground">{user.lastMessage}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
            EU
          </div>
          <span className="truncate">Minha conta</span>
        </button>
      </div>
    </aside>
  );
}
