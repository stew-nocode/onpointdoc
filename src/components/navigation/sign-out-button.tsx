'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/ui/button';

type SignOutButtonProps = {
  size?: 'sm' | 'default';
  className?: string;
};

export function SignOutButton({ size = 'sm', className }: SignOutButtonProps) {
  const router = useRouter();
  const pathname = usePathname() || '/';

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    router.refresh();
  }

  return (
    <Button variant="outline" size={size} onClick={handleSignOut} className={className}>
      <LogOut className="mr-2 h-4 w-4" />
      Se déconnecter
    </Button>
  );
}


