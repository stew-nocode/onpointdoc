/**
 * Composant pour l'upload de fichiers dans le formulaire de ticket
 * 
 * Extrait la logique de présentation de l'upload de fichiers selon les principes Clean Code
 */

'use client';

import { useFileUpload } from '@/hooks';

type TicketFormFileUploadProps = {
  onFilesChange?: (files: File[]) => void;
};

/**
 * Composant pour l'upload de fichiers dans le formulaire de ticket
 * 
 * @param onFilesChange - Callback appelé quand les fichiers changent
 */
export function TicketFormFileUpload({ onFilesChange }: TicketFormFileUploadProps) {
  const {
    files,
    isDragging,
    fileInputRef,
    addFiles,
    removeFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    openFileDialog
  } = useFileUpload({
    acceptTypes: ['image/*', 'application/pdf'],
    maxSizeBytes: 20 * 1024 * 1024 // 20MB
  });

  // Notifier le parent quand les fichiers changent
  // useEffect(() => {
  //   onFilesChange?.(files);
  // }, [files, onFilesChange]);

  return (
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
              onFilesChange?.(files);
            }
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.map((file, index) => {
            const key = `${file.name}:${file.size}`;
            const isImage = file.type.startsWith('image/');
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800">
                    {isImage && file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-full w-full object-cover"
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
                  onClick={() => {
                    removeFile(key);
                    onFilesChange?.(files.filter((f, i) => i !== index));
                  }}
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
  );
}

