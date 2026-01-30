'use client';

import { useEffect, useState } from 'react';

async function enableMocking() {
  if (typeof window === 'undefined') {
    return;
  }

  const { worker } = await import('@/lib/mocks/browser');
  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    enableMocking().then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚙️</div>
          <h1 className="text-xl font-semibold text-gray-900">Inicializando...</h1>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
