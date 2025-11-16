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
import type { Product, Module } from '@/services/products';
import { Button } from '@/ui/button';

type TicketFormProps = {
  onSubmit: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  isSubmitting?: boolean;
  products: Product[];
  modules: Module[];
};

export const TicketForm = ({ onSubmit, isSubmitting, products, modules }: TicketFormProps) => {
  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      customerContext: '',
      priority: 'Medium'
    }
  });
  const { errors } = form.formState;
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const filteredModules = useMemo(
    () => modules.filter((module) => module.product_id === selectedProductId),
    [selectedProductId, modules]
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

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values, selectedFiles);
    form.reset({
      title: '',
      description: '',
      type: 'ASSISTANCE',
      channel: 'Whatsapp',
      productId: products[0]?.id ?? '',
      moduleId: modules[0]?.id ?? '',
      customerContext: '',
      priority: 'Medium'
    });
    setSelectedProductId(products[0]?.id ?? '');
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Titre</label>
        <input className={inputClass} placeholder="Résumé du besoin" {...form.register('title')} />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          rows={4}
          className={inputClass}
          placeholder="Détails fournis par le client"
          {...form.register('description')}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Type</label>
          <select className={inputClass} {...form.register('type')}>
            {ticketTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Canal</label>
          <select className={inputClass} {...form.register('channel')}>
            {ticketChannels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Produit concerné</label>
          <select
            className={inputClass}
            {...productField}
            onChange={(event) => {
              productField.onChange(event);
              setSelectedProductId(event.target.value);
            }}
          >
            {products.length === 0 && <option value="">Aucun produit disponible</option>}
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-xs text-status-danger">{errors.productId.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Module impacté</label>
          <select
            className={inputClass}
            {...form.register('moduleId')}
            disabled={!filteredModules.length}
          >
            {filteredModules.length === 0 && <option value="">Aucun module disponible</option>}
            {filteredModules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.name}
              </option>
            ))}
          </select>
          {errors.moduleId && (
            <p className="text-xs text-status-danger">{errors.moduleId.message}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">Priorité</label>
          <select className={inputClass} {...form.register('priority')}>
            {['Low', 'Medium', 'High', 'Critical'].map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-700">
            Durée de l’assistance (minutes)
          </label>
          <input
            type="number"
            min={0}
            className={inputClass}
            placeholder="Ex: 45"
            {...form.register('durationMinutes', { valueAsNumber: true })}
          />
          <p className="text-xs text-slate-500">
            Obligatoire pour les tickets Assistance afin d’alimenter les KPIs Support.
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

