import { describe, it, expect } from 'vitest';
import { companyCreateSchema, companyUpdateSchema } from '@/lib/validators/company';

describe('Company Zod Schemas', () => {
  it('validates create payload', () => {
    const parsed = companyCreateSchema.parse({
      name: 'Onpoint',
      countryId: null,
      focalUserId: undefined,
      sectorIds: []
    });
    expect(parsed.name).toBe('Onpoint');
  });

  it('rejects too short name', () => {
    expect(() => companyCreateSchema.parse({ name: 'A' })).toThrow();
  });

  it('validates update payload', () => {
    const parsed = companyUpdateSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'New Name'
    });
    expect(parsed.name).toBe('New Name');
  });
});


