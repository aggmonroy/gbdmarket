import { createFileRoute } from "@tanstack/react-router";
import { FormatosPanel } from "@/components/portal/FormatosPanel";
export const Route = createFileRoute("/formato-check")({ component: () => <FormatosPanel /> });
