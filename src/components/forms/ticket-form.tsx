'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTicketSchema,
  type CreateTicketInput,
  ticketChannels,
  ticketTypes
} from '@/lib/validators/ticket';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import { Button } from '@/ui/button';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Combobox } from '@/ui/combobox';
import type { BasicProfile } from '@/services/users';
import { Bug, FileText, HelpCircle, MessageSquare, Mail, Phone, MoreHorizontal, AlertCircle, AlertTriangle, Zap, Shield } from 'lucide-react';

type TicketFormProps = {
  onSubmit: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  isSubmitting?: boolean;
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
};

export const TicketForm = ({
  onSubmit,
  isSubmitting,
  products,
  modules,
  submodules,
  features,
  contacts
}: TicketFormProps) => {
  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      submoduleId: '',
      featureId: '',
      customerContext: '',
      priority: 'Medium',
      contactUserId: contacts[0]?.id ?? ''
    }
  });
  const { errors } = form.formState;
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id ?? '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const filteredModules = useMemo(
    () => modules.filter((module) => module.product_id === selectedProductId),
    [selectedProductId, modules]
  );
  const filteredSubmodules = useMemo(
    () => submodules.filter((sm) => sm.module_id === selectedModuleId),
    [selectedModuleId, submodules]
  );
  const filteredFeatures = useMemo(
    () => features.filter((f) => filteredSubmodules.some((sm) => sm.id === f.submodule_id) && f.submodule_id === form.getValues('submoduleId')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [features, filteredSubmodules, form.watch('submoduleId')]
  );
  const inputClass =
    'rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';

  useEffect(() => {
    if (filteredModules.length > 0) {
      form.setValue('moduleId', filteredModules[0].id);
    } else {
      form.setValue('moduleId', '');
    }
  }, [filteredModules, form]);

  const productField = form.register('productId');
  const moduleField = form.register('moduleId');

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, selectedFiles);
    form.reset({
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      submoduleId: '',
      featureId: '',
      customerContext: '',
      priority: 'Medium',
      contactUserId: contacts[0]?.id ?? ''
    });
    setSelectedProductId(products[0]?.id ?? '');
    setSelectedModuleId(modules[0]?.id ?? '');
    setSelectedFiles([]);
  });

  function handleFilesAdded(filesList: FileList | File[]) {
    const incoming = Array.from(filesList);
    const sanitized = incoming.filter((f) => {
      const isOkType = f.type.startsWith('image/') || f.type === 'application/pdf';
      // 20MB max file size (ajustable)
      const isOkSize = f.size <= 20 * 1024 * 1024;
      return isOkType && isOkSize;
    });
    // éviter doublons par nom+taille
    const currentKeys = new Set(selectedFiles.map((f) => `${f.name}:${f.size}`));
    const merged = [...selectedFiles];
    for (const f of sanitized) {
      const key = `${f.name}:${f.size}`;
      if (!currentKeys.has(key)) {
        merged.push(f);
        currentKeys.add(key);
      }
    }
    setSelectedFiles(merged);
  }

  function removeFile(fileKey: string) {
    setSelectedFiles((prev) => prev.filter((f) => `${f.name}:${f.size}` !== fileKey));
  }

  function openFileDialog() {
    fileInputRef.current?.click();
  }

  return (
    <form className="space-y-4 w-full" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Titre</label>
        <input className={inputClass} placeholder="Résumé du besoin" {...form.register('title')} />
        {errors.title && <p className="text-xs text-status-danger">{errors.title.message}</p>}
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Contact</label>
        <Combobox
          options={contacts.map((c) => ({
            value: c.id,
            label: c.full_name ?? c.email ?? 'Utilisateur',
            searchable: `${c.full_name ?? ''} ${c.email ?? ''}`.trim()
          }))}
          value={form.watch('contactUserId')}
          onValueChange={(v) => form.setValue('contactUserId', v)}
          placeholder="Sélectionner un contact"
          searchPlaceholder="Rechercher un contact..."
          emptyText="Aucun contact disponible"
          disabled={!contacts.length}
        />
        {errors.contactUserId && (
          <p className="text-xs text-status-danger">{errors.contactUserId.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          rows={4}
          className={inputClass}
          placeholder="Détails fournis par le client"
          {...form.register('description')}
        />
        {errors.description && (
          <p className="text-xs text-status-danger">{errors.description.message}</p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3 min-w-0">
          <label className="text-sm font-medium text-slate-700">Type de ticket</label>
          <RadioGroup 
            value={form.watch('type')} 
            onValueChange={(v) => form.setValue('type', v as CreateTicketInput['type'])} 
            className="grid grid-cols-radio-3 gap-2 w-full"
          >
            <RadioCard
              value="BUG"
              label="BUG"
              icon={<Bug className="h-4 w-4" />}
            />
            <RadioCard
              value="REQ"
              label="Requête"
              icon={<FileText className="h-4 w-4" />}
            />
            <RadioCard
              value="ASSISTANCE"
              label="Assistance"
              icon={<HelpCircle className="h-4 w-4" />}
            />
          </RadioGroup>
        </div>
        <div className="grid gap-3 min-w-0">
          <label className="text-sm font-medium text-slate-700">Canal de contact</label>
          <RadioGroup 
            value={form.watch('channel')} 
            onValueChange={(v) => form.setValue('channel', v as CreateTicketInput['channel'])} 
            className="grid grid-cols-radio-4 gap-2 w-full"
          >
            <RadioCard
              value="Whatsapp"
              label="WhatsApp"
              icon={<MessageSquare className="h-4 w-4" />}
            />
            <RadioCard
              value="Email"
              label="Email"
              icon={<Mail className="h-4 w-4" />}
            />
            <RadioCard
              value="Appel"
              label="Appel"
              icon={<Phone className="h-4 w-4" />}
            />
            <RadioCard
              value="Autre"
              label="Autre"
              icon={<MoreHorizontal className="h-4 w-4" />}
            />
          </RadioGroup>
        </div>
      </div>
      <div className="grid gap-3 min-w-0">
        <label className="text-sm font-medium text-slate-700">Produit concerné</label>
        <RadioGroup
          value={form.watch('productId')}
          onValueChange={(v) => {
            form.setValue('productId', v);
            setSelectedProductId(v);
          }}
          className="grid grid-cols-3 gap-2 w-full"
        >
          {products.map((product) => (
            <RadioCard
              key={product.id}
              value={product.id}
              label={product.name}
              icon={<Shield className="h-4 w-4" />}
            />
          ))}
        </RadioGroup>
        {errors.productId && (
          <p className="text-xs text-status-danger">{errors.productId.message}</p>
        )}
      </div>
      <div className="grid gap-2 min-w-0">
        <label className="text-sm font-medium text-slate-700">Module / Sous-module / Fonctionnalité</label>
        <div className="grid gap-2 md:grid-cols-3 w-full">
          <Combobox
            options={filteredModules.map((m) => ({ value: m.id, label: m.name }))}
            value={form.watch('moduleId')}
            onValueChange={(v) => {
              form.setValue('moduleId', v);
              setSelectedModuleId(v);
              form.setValue('submoduleId', '');
              form.setValue('featureId', '');
            }}
            placeholder="Module"
            searchPlaceholder="Rechercher un module..."
            emptyText="Aucun module disponible"
            disabled={!filteredModules.length}
          />
          <Combobox
            options={filteredSubmodules.map((sm) => ({ value: sm.id, label: sm.name }))}
            value={form.watch('submoduleId') || ''}
            onValueChange={(v) => {
              form.setValue('submoduleId', v);
              form.setValue('featureId', '');
            }}
            placeholder="Sous-module"
            searchPlaceholder="Rechercher un sous-module..."
            emptyText="Aucun sous-module disponible"
            disabled={!filteredSubmodules.length}
          />
          <Combobox
            options={filteredFeatures.map((f) => ({ value: f.id, label: f.name }))}
            value={form.watch('featureId') || ''}
            onValueChange={(v) => form.setValue('featureId', v)}
            placeholder="Fonctionnalité"
            searchPlaceholder="Rechercher une fonctionnalité..."
            emptyText="Aucune fonctionnalité disponible"
            disabled={!form.getValues('submoduleId') || !filteredFeatures.length}
          />
        </div>
        {errors.moduleId && (
          <p className="text-xs text-status-danger">{errors.moduleId.message}</p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-3 min-w-0">
          <label className="text-sm font-medium text-slate-700">Priorité</label>
          <RadioGroup 
            value={form.watch('priority')} 
            onValueChange={(v) => form.setValue('priority', v as CreateTicketInput['priority'])} 
            className="grid grid-cols-radio-4 gap-2 w-full"
          >
            <RadioCard
              value="Low"
              label="Faible"
              icon={<Zap className="h-4 w-4" />}
            />
            <RadioCard
              value="Medium"
              label="Moyenne"
              icon={<AlertCircle className="h-4 w-4" />}
            />
            <RadioCard
              value="High"
              label="Élevée"
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <RadioCard
              value="Critical"
              label="Critique"
              icon={<Shield className="h-4 w-4" />}
            />
          </RadioGroup>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">
            Durée de l'assistance (minutes)
          </label>
          <input
            type="number"
            min={0}
            className={inputClass}
            placeholder="Ex: 45"
            {...form.register('durationMinutes', { valueAsNumber: true })}
          />
          {errors.durationMinutes && (
            <p className="text-xs text-status-danger">{errors.durationMinutes.message}</p>
          )}
          <p className="text-xs text-slate-500">
            Obligatoire pour les tickets Assistance afin d'alimenter les KPIs Support.
          </p>
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Contexte client</label>
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Entreprise, point focal, environnement, relance..."
          {...form.register('customerContext')}
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Pièces jointes</label>
        <div
          className={`group relative rounded-xl border-2 border-dashed p-4 transition
            ${isDragging ? 'border-brand bg-brand/5' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
          `}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesAdded(e.dataTransfer.files);
              e.dataTransfer.clearData();
            }
          }}
          onClick={openFileDialog}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFileDialog();
            }
          }}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center text-slate-600 dark:text-slate-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
              {/* simple upload icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 118 0v1h1a3 3 0 110 6H6a3 3 0 110-6h1v-1z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 12V3m0 0l-3 3m3-3l3 3" />
              </svg>
            </div>
            <div className="text-sm">
              Glissez-déposez vos fichiers ici, ou
              <button
                type="button"
                className="ml-1 underline decoration-dotted underline-offset-4 hover:text-slate-800 dark:hover:text-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
              >
                cliquez pour sélectionner
              </button>
            </div>
            <div className="text-xs text-slate-500">Formats acceptés: images et PDF. 20 Mo max par fichier.</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            accept="image/*,application/pdf"
            onChange={(event) => {
              if (event.target.files) handleFilesAdded(event.target.files);
              // ne pas nettoyer la value pour permettre re-sélection des mêmes fichiers si besoin
            }}
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedFiles.map((file) => {
              const key = `${file.name}:${file.size}`;
              const isImage = file.type.startsWith('image/');
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {isImage ? (
                        // preview image
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-full w-full object-cover"
                          onLoad={(e) => {
                            // libère l'URL après chargement pour éviter fuites mémoire
                            try {
                              URL.revokeObjectURL((e.target as HTMLImageElement).src);
                            } catch {}
                          }}
                        />
                      ) : (
                        <span className="text-xs">PDF</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {file.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} Mo
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ml-2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    onClick={() => removeFile(key)}
                    aria-label="Retirer le fichier"
                    title="Retirer le fichier"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        Enregistrer le ticket
      </Button>
    </form>
  );
};

