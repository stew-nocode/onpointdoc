/**
 * Formulaire de création de ticket
 * 
 * Utilise les hooks personnalisés pour la logique métier (useTicketForm, useFileUpload)
 * Séparant la logique métier de la présentation selon les principes Clean Code
 * 
 * Composant principal : orchestration des sous-composants
 */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type {
  CreateTicketInput,
} from '@/lib/validators/ticket';
import { BUG_TYPES, ASSISTANCE_LOCAL_STATUSES } from '@/lib/constants/tickets';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import { Button } from '@/ui/button';
import { RadioGroup, RadioCard } from '@/ui/radio-group';
import { Combobox } from '@/ui/combobox';
import type { BasicProfile } from '@/services/users';
import { Bug, FileText, HelpCircle, MessageSquare, Mail, Phone, MoreHorizontal, AlertCircle, AlertTriangle, Zap, Shield } from 'lucide-react';
import { useTicketForm, useFileUpload, type FileWithPreview } from '@/hooks';
import { RichTextEditor } from '@/components/editors/rich-text-editor';

type TicketFormProps = {
  onSubmit: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  isSubmitting?: boolean;
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
  initialValues?: Partial<CreateTicketInput>;
  mode?: 'create' | 'edit';
};

/**
 * Formulaire de création de ticket
 * 
 * @param onSubmit - Fonction appelée lors de la soumission
 * @param isSubmitting - État de soumission
 * @param products - Liste des produits
 * @param modules - Liste des modules
 * @param submodules - Liste des sous-modules
 * @param features - Liste des fonctionnalités
 * @param contacts - Liste des contacts
 */
export const TicketForm = ({
  onSubmit,
  isSubmitting,
  products,
  modules,
  submodules,
  features,
  contacts,
  initialValues,
  mode = 'create'
}: TicketFormProps) => {
  // Gestion des fichiers avec le hook personnalisé
  const {
    files: selectedFiles,
    addFiles,
    removeFile: removeFileByKey,
    clearFiles,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFileDialog,
    isDragging,
    fileInputRef
  } = useFileUpload({
    acceptTypes: ['image/*', 'application/pdf'],
    maxSizeBytes: 20 * 1024 * 1024 // 20MB
  });

  // Gestion du formulaire avec le hook personnalisé
  const {
    form,
    selectedProductId,
    selectedModuleId,
    filteredModules,
    filteredSubmodules,
    filteredFeatures,
    setSelectedProductId,
    setSelectedModuleId
  } = useTicketForm({
    products,
    modules,
    submodules,
    features,
    contacts,
    initialValues,
    onSubmit: async (values: CreateTicketInput) => {
      await onSubmit(values, selectedFiles);
    }
  });

  // Handler de soumission du formulaire
  const handleSubmit = form.handleSubmit(async (values: CreateTicketInput) => {
    await onSubmit(values, selectedFiles);
    clearFiles();
    // Réinitialiser le formulaire après soumission uniquement en mode création
    if (mode === 'create') {
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
        contactUserId: contacts[0]?.id ?? '',
        bug_type: null
      });
      setSelectedProductId(products[0]?.id ?? '');
      setSelectedModuleId(modules[0]?.id ?? '');
    }
  });

  const { errors } = form.formState;
  const inputClass =
    'rounded-lg border border-slate-200 px-3 py-2 text-sm focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';

  const productField = form.register('productId');
  const ticketType = form.watch('type');

  return (
    <form className="space-y-3 w-full" onSubmit={handleSubmit}>
      {/* Type et Canal */}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium text-slate-700">Type de ticket</label>
          <RadioGroup
            value={form.watch('type')}
            onValueChange={(v) => form.setValue('type', v as CreateTicketInput['type'])}
            className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full"
          >
            <RadioCard variant="compact" value="BUG" label="BUG" icon={<Bug className="h-3 w-3" />} />
            <RadioCard variant="compact" value="REQ" label="Requête" icon={<FileText className="h-3 w-3" />} />
            <RadioCard variant="compact" value="ASSISTANCE" label="Assistance" icon={<HelpCircle className="h-3 w-3" />} />
          </RadioGroup>
        </div>
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium text-slate-700">Canal de contact</label>
          <RadioGroup
            value={form.watch('channel')}
            onValueChange={(v) => form.setValue('channel', v as CreateTicketInput['channel'])}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
          >
            <RadioCard variant="compact" value="Whatsapp" label="WhatsApp" icon={<MessageSquare className="h-3 w-3" />} />
            <RadioCard variant="compact" value="Email" label="Email" icon={<Mail className="h-3 w-3" />} />
            <RadioCard variant="compact" value="Appel" label="Appel" icon={<Phone className="h-3 w-3" />} />
            <RadioCard variant="compact" value="Autre" label="Autre" icon={<MoreHorizontal className="h-3 w-3" />} />
          </RadioGroup>
        </div>
      </div>

      {/* Titre */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Titre</label>
        <input className={inputClass} placeholder="Résumé du besoin" {...form.register('title')} />
        {errors.title && <p className="text-xs text-status-danger">{errors.title.message}</p>}
      </div>

      {/* Contact */}
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

      {/* Description */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <RichTextEditor
          value={form.watch('description') || ''}
          onChange={(value) => form.setValue('description', value, { shouldValidate: true })}
          placeholder="Détails fournis par le client"
          disabled={isSubmitting}
          format="html"
          minHeight={150}
        />
        {errors.description && (
          <p className="text-xs text-status-danger">{errors.description.message}</p>
        )}
      </div>

      {/* Type de bug (conditionnel) */}
      {ticketType === 'BUG' && (
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Type de bug <span className="text-status-danger">*</span>
          </label>
          <Combobox
            options={BUG_TYPES.map((bugType) => ({
              value: bugType,
              label: bugType,
              searchable: bugType
            }))}
            value={form.watch('bug_type') ?? ''}
            onValueChange={(v) => form.setValue('bug_type', v as CreateTicketInput['bug_type'])}
            placeholder="Sélectionner un type de bug"
            searchPlaceholder="Rechercher un type de bug..."
            emptyText="Aucun type de bug disponible"
          />
          {errors.bug_type && (
            <p className="text-xs text-status-danger">{errors.bug_type.message}</p>
          )}
        </div>
      )}

      {/* Produit */}
      {products.length === 1 ? (
        <input type="hidden" {...productField} />
      ) : (
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium text-slate-700">Produit concerné</label>
          <RadioGroup
            value={form.watch('productId')}
            onValueChange={(v) => {
              form.setValue('productId', v);
              setSelectedProductId(v);
            }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full"
          >
            {products.map((product) => (
              <RadioCard
                key={product.id}
                value={product.id}
                label={product.name}
                icon={<Shield className="h-3 w-3" />}
                variant="compact"
              />
            ))}
          </RadioGroup>
          {errors.productId && (
            <p className="text-xs text-status-danger">{errors.productId.message}</p>
          )}
        </div>
      )}

      {/* Module / Sous-module / Fonctionnalité */}
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

      {/* Priorité */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Priorité</label>
        <RadioGroup
          value={form.watch('priority')}
          onValueChange={(v) => form.setValue('priority', v as CreateTicketInput['priority'])}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full"
        >
          <RadioCard variant="compact" value="Low" label="Faible" icon={<Zap className="h-3 w-3" />} />
          <RadioCard variant="compact" value="Medium" label="Moyenne" icon={<AlertCircle className="h-3 w-3" />} />
          <RadioCard variant="compact" value="High" label="Élevée" icon={<AlertTriangle className="h-3 w-3" />} />
          <RadioCard variant="compact" value="Critical" label="Critique" icon={<Shield className="h-3 w-3" />} />
        </RadioGroup>
      </div>

      {/* Statut (uniquement pour ASSISTANCE en mode édition) */}
      {mode === 'edit' && ticketType === 'ASSISTANCE' && (
        <div className="grid gap-2 min-w-0">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Statut
          </label>
          <Combobox
            options={ASSISTANCE_LOCAL_STATUSES.map((status: (typeof ASSISTANCE_LOCAL_STATUSES)[number]) => ({
              value: status,
              label: status.replace('_', ' '),
              searchable: status
            }))}
            value={form.watch('status') ?? ''}
            onValueChange={(v) => form.setValue('status', v as CreateTicketInput['status'])}
            placeholder="Sélectionner un statut"
            searchPlaceholder="Rechercher un statut..."
            emptyText="Aucun statut disponible"
          />
          {errors.status && (
            <p className="text-xs text-status-danger">{errors.status.message}</p>
          )}
        </div>
      )}

      {/* Durée */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-4">
          <label htmlFor="durationMinutes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Durée de l&apos;assistance (minutes)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="durationMinutes"
              type="number"
              min={0}
              className={`${inputClass} w-24`}
              placeholder="Ex: 45"
              {...form.register('durationMinutes', { valueAsNumber: true })}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">min</span>
          </div>
        </div>
        {errors.durationMinutes && (
          <p className="text-xs text-status-danger">{errors.durationMinutes.message}</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Obligatoire pour les tickets Assistance.
        </p>
      </div>

      {/* Contexte client */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Contexte client</label>
        <textarea
          rows={3}
          className={inputClass}
          placeholder="Entreprise, point focal, environnement, relance..."
          {...form.register('customerContext')}
        />
      </div>

      {/* Pièces jointes */}
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-700">Pièces jointes</label>
        <div
          className={`group relative rounded-xl border-2 border-dashed p-4 transition
            ${isDragging ? 'border-brand bg-brand/5' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            multiple
            className="sr-only"
            accept="image/*,application/pdf"
            onChange={(event) => {
              if (event.target.files) {
                addFiles(event.target.files);
              }
            }}
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {selectedFiles.map((file) => {
              const key = file.id || `${file.name}:${file.size}`;
              const isImage = file.type.startsWith('image/');
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                      {isImage && file.preview ? (
                        <Image
                          src={file.preview}
                          alt={file.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <span className="text-xs">{isImage ? 'IMG' : 'PDF'}</span>
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
                    onClick={() => removeFileByKey(key)}
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

      {/* Bouton de soumission */}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting 
          ? (mode === 'edit' ? 'Enregistrement...' : 'Création...') 
          : (mode === 'edit' ? 'Enregistrer les modifications' : 'Créer le ticket')}
      </Button>
    </form>
  );
};
