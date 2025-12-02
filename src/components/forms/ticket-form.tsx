/**
 * Formulaire de création de ticket
 * 
 * Composant principal : orchestration des sections atomiques
 * Respecte les principes Clean Code (< 100 lignes)
 */

'use client';

import { useCallback, useMemo } from 'react';
import type { CreateTicketInput } from '@/lib/validators/ticket';
import type { Product, Module, Submodule, Feature } from '@/services/products';
import type { BasicCompany } from '@/services/companies';
import type { BasicProfile } from '@/services/users';
import { useTicketForm, useFileUpload } from '@/hooks';
import { useTicketFormSubmit } from './ticket-form/hooks/use-ticket-form-submit';
import {
  TicketTypeSection,
  TicketTitleSection,
  TicketContactSection,
  TicketScopeSection,
  TicketDescriptionSection,
  TicketBugTypeSection,
  TicketProductSection,
  TicketModuleSection,
  PrioritySection,
  TicketDepartmentSection,
  TicketStatusSection,
  TicketDurationSection,
  TicketContextSection,
  TicketAttachmentsSection,
  TicketSubmitButtons,
  type BasicDepartment
} from './ticket-form/sections';

type TicketFormProps = {
  onSubmit: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  onSubmitAndContinue?: (values: CreateTicketInput, files?: File[]) => Promise<void | string>;
  isSubmitting?: boolean;
  products: Product[];
  modules: Module[];
  submodules: Submodule[];
  features: Feature[];
  contacts: BasicProfile[];
  companies: BasicCompany[];
  departments: BasicDepartment[];
  initialValues?: Partial<CreateTicketInput>;
  mode?: 'create' | 'edit';
  onContactsRefresh?: () => void;
};

/**
 * Formulaire de création de ticket
 * 
 * Orchestrateur des sections atomiques selon les principes Clean Code
 */
export const TicketForm = ({
  onSubmit,
  onSubmitAndContinue,
  isSubmitting = false,
  products,
  modules,
  submodules,
  features,
  contacts,
  companies,
  departments,
  initialValues,
  mode = 'create',
  onContactsRefresh
}: TicketFormProps) => {
  // Gestion des fichiers avec le hook personnalisé
  const fileUpload = useFileUpload({
    acceptTypes: ['image/*', 'application/pdf'],
    maxSizeBytes: 20 * 1024 * 1024 // 20MB
  });

  // Gestion du formulaire avec le hook personnalisé
  const ticketForm = useTicketForm({
    products,
    modules,
    submodules,
    features,
    contacts,
    initialValues,
    onSubmit: async (values: CreateTicketInput) => {
      await onSubmit(values, fileUpload.files);
    }
  });

  // Gestion de la soumission avec hook dédié
  const { handleSubmit, handleSubmitAndContinue } = useTicketFormSubmit({
    form: ticketForm.form,
    products,
    contacts,
    modules,
    mode,
    onSubmit,
    onSubmitAndContinue,
    files: fileUpload.files,
    clearFiles: fileUpload.clearFiles,
    setSelectedProductId: ticketForm.setSelectedProductId,
    setSelectedModuleId: ticketForm.setSelectedModuleId
  });

  // Handlers mémorisés pour éviter les re-renders
  const handleProductChange = useCallback(
    (productId: string) => {
      ticketForm.setSelectedProductId(productId);
    },
    [ticketForm]
  );

  const handleModuleChange = useCallback(
    (moduleId: string) => {
      ticketForm.setSelectedModuleId(moduleId);
    },
    [ticketForm]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        fileUpload.addFiles(e.target.files);
      }
    },
    [fileUpload]
  );

  return (
    <form className="space-y-3 w-full" onSubmit={handleSubmit}>
      <TicketTypeSection form={ticketForm.form} />
      <TicketTitleSection form={ticketForm.form} />
      <TicketContactSection
        form={ticketForm.form}
        contacts={contacts}
        isSubmitting={isSubmitting}
        onContactsRefresh={onContactsRefresh}
      />
      <TicketScopeSection
        form={ticketForm.form}
        contacts={contacts}
        companies={companies}
        selectedContactId={ticketForm.form.watch('contactUserId')}
        channel={ticketForm.form.watch('channel')}
      />
      <TicketDescriptionSection form={ticketForm.form} isSubmitting={isSubmitting} />
      <TicketBugTypeSection form={ticketForm.form} />
      <TicketProductSection
        form={ticketForm.form}
        products={products}
        onProductChange={handleProductChange}
      />
      <TicketModuleSection
        form={ticketForm.form}
        filteredModules={ticketForm.filteredModules}
        filteredSubmodules={ticketForm.filteredSubmodules}
        filteredFeatures={ticketForm.filteredFeatures}
        onModuleChange={handleModuleChange}
      />
      <PrioritySection form={ticketForm.form} />
      <TicketDepartmentSection
        form={ticketForm.form}
        departments={departments}
        isSubmitting={isSubmitting}
      />
      <TicketStatusSection form={ticketForm.form} mode={mode} />
      <TicketDurationSection form={ticketForm.form} />
      <TicketContextSection form={ticketForm.form} />
      <TicketAttachmentsSection
        selectedFiles={fileUpload.files}
        isDragging={fileUpload.isDragging}
        fileInputRef={fileUpload.fileInputRef}
        onDragOver={fileUpload.handleDragOver}
        onDragLeave={fileUpload.handleDragLeave}
        onDrop={fileUpload.handleDrop}
        onFileDialogOpen={fileUpload.openFileDialog}
        onFileInputChange={handleFileInputChange}
        onRemoveFile={fileUpload.removeFile}
      />
      <TicketSubmitButtons
        mode={mode}
        isSubmitting={isSubmitting}
        onSubmitAndContinue={handleSubmitAndContinue}
      />
    </form>
  );
};
