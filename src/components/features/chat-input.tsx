"use client";

import { useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ChatInput() {
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // TODO: enviar mensagem
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-2">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-3">
        <Textarea
          ref={ref}
          name="message"
          placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          rows={1}
          onKeyDown={handleKeyDown}
          className="max-h-40 min-h-0 flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <Button type="button" size="sm">
          Enviar
        </Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Enter para enviar · Shift+Enter para quebrar linha
      </p>
    </div>
  );
}
