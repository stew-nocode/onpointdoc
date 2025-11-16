import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  moduleCreateSchema,
  type ModuleCreateInput,
  moduleUpdateSchema,
  type ModuleUpdateInput,
  submoduleCreateSchema,
  type SubmoduleCreateInput,
  submoduleUpdateSchema,
  type SubmoduleUpdateInput,
  featureCreateSchema,
  type FeatureCreateInput,
  featureUpdateSchema,
  type FeatureUpdateInput
} from '@/lib/validators/product';

export async function createModule(input: ModuleCreateInput): Promise<string> {
  const payload = moduleCreateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from('modules').insert({
    name: payload.name,
    product_id: payload.productId
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Création module échouée');
  return data.id as string;
}

export async function updateModule(input: ModuleUpdateInput): Promise<void> {
  const payload = moduleUpdateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.productId !== undefined) update.product_id = payload.productId;
  const { error } = await supabase.from('modules').update(update).eq('id', payload.id);
  if (error) throw new Error(error.message);
}

export async function createSubmodule(input: SubmoduleCreateInput): Promise<string> {
  const payload = submoduleCreateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from('submodules').insert({
    name: payload.name,
    module_id: payload.moduleId
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Création sous-module échouée');
  return data.id as string;
}

export async function updateSubmodule(input: SubmoduleUpdateInput): Promise<void> {
  const payload = submoduleUpdateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.moduleId !== undefined) update.module_id = payload.moduleId;
  const { error } = await supabase.from('submodules').update(update).eq('id', payload.id);
  if (error) throw new Error(error.message);
}

export async function createFeature(input: FeatureCreateInput): Promise<string> {
  const payload = featureCreateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.from('features').insert({
    name: payload.name,
    submodule_id: payload.submoduleId
  }).select('id').single();
  if (error || !data) throw new Error(error?.message ?? 'Création fonctionnalité échouée');
  return data.id as string;
}

export async function updateFeature(input: FeatureUpdateInput): Promise<void> {
  const payload = featureUpdateSchema.parse(input);
  const supabase = createSupabaseBrowserClient();
  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.name = payload.name;
  if (payload.submoduleId !== undefined) update.submodule_id = payload.submoduleId;
  const { error } = await supabase.from('features').update(update).eq('id', payload.id);
  if (error) throw new Error(error.message);
}


