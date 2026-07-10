import Link from "next/link";
import { LayoutDashboard, Users } from "lucide-react";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-border bg-card flex flex-col">
        <div className="px-4 py-5 text-lg font-semibold tracking-tight">
          Lead<span className="text-text-blue">Hunter</span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-table hover:text-foreground"
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link
            href="/leads"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-table hover:text-foreground"
          >
            <Users size={16} /> Leads
          </Link>
        </nav>
      </aside>
      <main className="flex-1 bg-background">{children}</main>
    </div>
  );
}
