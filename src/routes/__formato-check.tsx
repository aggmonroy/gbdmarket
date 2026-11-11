import { createFileRoute } from "@tanstack/react-router";
import { FormatosPanel } from "@/components/portal/FormatosPanel";
export const Route = createFileRoute("/__formato-check")({ component: () => <FormatosPanel /> });
