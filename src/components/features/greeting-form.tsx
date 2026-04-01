"use client";

import { useActionState } from "react";
import { greetAction, type GreetingState } from "@/app/actions/greeting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: GreetingState = { message: null, error: null };

export function GreetingForm() {
  const [state, formAction, isPending] = useActionState(
    greetAction,
    initialState
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Enter your name"
          required
        />
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Greet"}
      </Button>
      {state.message && (
        <p className="rounded-lg border border-accent bg-accent/20 p-3 text-center text-accent-foreground">
          {state.message}
        </p>
      )}
    </form>
  );
}
