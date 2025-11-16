'use client';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Layout minimal pour éviter d'afficher la navigation globale
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}


