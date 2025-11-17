import { contactCreateSchema, type ContactCreateInput } from '@/lib/validators/user';

export async function createContact(input: ContactCreateInput): Promise<string> {
  const payload = contactCreateSchema.parse(input);
  try {
    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        role: 'client',
        companyId: payload.companyId,
        isActive: payload.isActive
      })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Création contact échouée (${res.status})`);
    }
    const data = (await res.json()) as { profileId: string };
    return data.profileId;
  } catch (error: any) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion réseau.');
    }
    throw error;
  }
}


