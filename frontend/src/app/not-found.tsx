import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px' }}>
        The meeting resource or page you are looking for does not exist.
      </p>
      <Link href="/meetings">
        <Button variant="primary">Return to Meetings Library</Button>
      </Link>
    </div>
  );
}
