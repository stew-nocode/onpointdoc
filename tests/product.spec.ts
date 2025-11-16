import { describe, it, expect } from 'vitest';
import {
  moduleCreateSchema,
  moduleUpdateSchema,
  submoduleCreateSchema,
  submoduleUpdateSchema,
  featureCreateSchema,
  featureUpdateSchema
} from '@/lib/validators/product';

describe('Product-related Zod Schemas', () => {
  it('validates module create', () => {
    const parsed = moduleCreateSchema.parse({
      name: 'Module X',
      productId: '550e8400-e29b-41d4-a716-446655440000'
    });
    expect(parsed.name).toBe('Module X');
  });

  it('validates submodule create', () => {
    const parsed = submoduleCreateSchema.parse({
      name: 'Submodule X',
      moduleId: '550e8400-e29b-41d4-a716-446655440000'
    });
    expect(parsed.name).toBe('Submodule X');
  });

  it('validates feature update', () => {
    const parsed = featureUpdateSchema.parse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Feature Y'
    });
    expect(parsed.name).toBe('Feature Y');
  });
});


