import Link from 'next/link';
import Image from 'next/image';
import { FileText, FileSignature, Building2, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col overflow-y-auto border-r bg-white shadow-sm">
        <div className="p-6">
          <div className="ml-2 flex items-center gap-2">
            <div>
              <Image src="/logos/complif-logo.svg" alt="Complif Logo" width={120} height={32} />
              <p className="text-xs text-gray-500">Signature Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          <NavLink href="/admin/templates" icon={FileText} label="Plantillas" />
          <NavLink href="/admin/requests" icon={FileSignature} label="Solicitudes de Firma" />
          <NavLink href="/admin/accounts" icon={Building2} label="Cuentas" />
          <NavLink href="/admin/schemas" icon={Settings} label="Configuración de Reglas" />
        </nav>

        <div className="border-t p-4">
          <p className="text-xs text-gray-500">Challenge Complif 2026</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
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
