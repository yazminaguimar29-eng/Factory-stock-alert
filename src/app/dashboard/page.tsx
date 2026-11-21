import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dataStore } from '@/lib/data-store';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardLiveWrapper } from '@/components/dashboard/DashboardLiveWrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const [metricas, productos] = await Promise.all([
    dataStore.getDashboardMetricas(),
    dataStore.getProductos(),
  ]);

  return (
    <AppShell user={session}>
      <DashboardLiveWrapper
        initialMetricas={metricas}
        initialProductos={productos}
        session={session}
      />
    </AppShell>
  );
}
