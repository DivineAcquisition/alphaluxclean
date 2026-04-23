'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/App'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen w-full items-center justify-center">
      <div className="text-muted-foreground">Loading…</div>
    </div>
  ),
});

export default function ClientApp() {
  return <App />;
}
