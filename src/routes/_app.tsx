import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});
