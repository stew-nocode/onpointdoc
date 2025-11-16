import { describe, it, expect } from 'vitest';
import { userCreateInternalSchema, userUpdateSchema, contactCreateSchema } from '@/lib/validators/user';

describe('User Zod Schemas', () => {
  it('validates internal user create', () => {
    const parsed = userCreateInternalSchema.parse({
      fullName: 'Admin Test',
      email: 'admin@test.com',
      password: 'secret12',
      role: 'admin',
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      isActive: true,
      department: 'IT',
      moduleIds: []
    });
    expect(parsed.role).toBe('admin');
  });

  it('rejects invalid email', () => {
    expect(() =>
      userCreateInternalSchema.parse({
        fullName: 'X',
        email: 'bad-email',
        password: 'secret12',
        role: 'agent',
        companyId: '550e8400-e29b-41d4-a716-446655440000'
      })
    ).toThrow();
  });

  it('validates update', () => {
    const parsed = userUpdateSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      fullName: 'New Name',
      moduleIds: []
    });
    expect(parsed.fullName).toBe('New Name');
  });
});

describe('Contact Zod Schema', () => {
  it('validates contact create', () => {
    const parsed = contactCreateSchema.parse({
      fullName: 'Client A',
      email: 'client@test.com',
      password: 'secret12',
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      isActive: true
    });
    expect(parsed.fullName).toBe('Client A');
  });
});


