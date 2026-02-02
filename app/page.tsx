'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/templates');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-6xl"></div>
        <h1 className="text-2xl font-bold text-gray-900">Cargando Complif...</h1>
      </div>
    </div>
  );
}
