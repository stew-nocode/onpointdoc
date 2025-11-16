import { contactCreateSchema, type ContactCreateInput } from '@/lib/validators/user';

export async function createContact(input: ContactCreateInput): Promise<string> {
  const payload = contactCreateSchema.parse(input);
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
    throw new Error(text || 'Création contact échouée');
  }
  const data = (await res.json()) as { profileId: string };
  return data.profileId;
}


