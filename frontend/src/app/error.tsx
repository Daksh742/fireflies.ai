'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Error caught:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem', gap: '1rem' }}>
      <AlertCircle size={40} color="var(--danger-text, #ef4444)" />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Application Error</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.875rem' }}>
        An unexpected error occurred while loading this view. You can try refreshing the page content or return to the Meetings Library.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button variant="secondary" onClick={() => reset()}>
          <RefreshCw size={14} />
          <span>Try Again</span>
        </Button>
        <Link href="/meetings">
          <Button variant="primary">Return to Meetings Library</Button>
        </Link>
      </div>
    </div>
  );
}
