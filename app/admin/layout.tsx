import Link from 'next/link';
import { FileText, FileSignature, Building2, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-indigo-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Complif</h1>
              <p className="text-xs text-gray-500">Signature Platform</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-3">
          <NavLink href="/admin/templates" icon={FileText} label="Templates" />
          <NavLink href="/admin/requests" icon={FileSignature} label="Signature Requests" />
          <NavLink href="/admin/accounts" icon={Building2} label="Cuentas" />
          <NavLink href="/admin/schemas" icon={Settings} label="Schemas" />
        </nav>

        <div className="absolute bottom-0 w-64 border-t p-4">
          <p className="text-xs text-gray-500">Challenge Complif 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
