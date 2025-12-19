'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

type TasksSearchBarProps = {
  initialSearch?: string;
  className?: string;
};

/**
 * Composant de barre de recherche pour les tâches
 * 
 * Pattern similaire à ActivitiesSearchBar pour cohérence
 * 
 * ✅ OPTIMISÉ - Principe Clean Code :
 * - Évite la boucle infinie en comparant les valeurs avant router.push
 * - Retire searchParams des dépendances pour éviter les re-renders cycliques
 * - Utilise useRef pour stabiliser la valeur précédente
 * - Debounce de 500ms pour limiter les appels API
 * 
 * @param initialSearch - Valeur de recherche initiale depuis l'URL
 * @param className - Classes CSS additionnelles
 */
export function TasksSearchBar({ initialSearch, className }: TasksSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialSearch || '');
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch || '');
  
  // ✅ Utiliser useRef pour suivre la dernière valeur mise à jour dans l'URL
  // Évite les appels router.push inutiles si l'URL contient déjà la valeur
  const lastUrlSearchRef = useRef<string>(initialSearch || '');

  // Debounce de 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  // ✅ OPTIMISÉ : Mettre à jour l'URL seulement si la valeur a réellement changé
  // Retire searchParams des dépendances pour éviter la boucle infinie
  useEffect(() => {
    const trimmedDebouncedSearch = debouncedSearch.trim();
    
    // ✅ Vérifier si on a déjà mis à jour l'URL avec cette valeur
    // Si oui, ne pas appeler router.push (évite la boucle)
    if (lastUrlSearchRef.current === trimmedDebouncedSearch) {
      return; // Pas de changement nécessaire
    }
    
    // ✅ Récupérer la valeur actuelle dans l'URL pour comparaison
    // On lit searchParams directement dans le useEffect sans dépendance
    // car on veut seulement comparer, pas réagir à chaque changement
    const currentUrlSearch = searchParams.get('search') || '';
    
    // Si l'URL contient déjà la valeur souhaitée, ne pas appeler router.push
    if (currentUrlSearch === trimmedDebouncedSearch) {
      // Mettre à jour la référence pour éviter les appels futurs inutiles
      lastUrlSearchRef.current = trimmedDebouncedSearch;
      return;
    }
    
    // ✅ Mettre à jour la référence avant de changer l'URL
    lastUrlSearchRef.current = trimmedDebouncedSearch;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (trimmedDebouncedSearch) {
      params.set('search', trimmedDebouncedSearch);
    } else {
      params.delete('search');
    }

    // Réinitialiser l'offset quand on recherche
    params.delete('offset');

    const newUrl = params.toString() 
      ? `/gestion/taches?${params.toString()}`
      : '/gestion/taches';
    
    // ✅ CRITIQUE : scroll: false pour ne pas remonter en haut lors de la recherche
    router.push(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, router]); // ✅ searchParams lu dans le useEffect mais pas en dépendance

  const handleClear = useCallback(() => {
    setSearchValue('');
    setDebouncedSearch('');
  }, []);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Rechercher par titre ou description..."
          className="w-full rounded-md border border-slate-200 bg-white pl-10 pr-10 py-2 text-[0.7rem] placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand"
        />
        {searchValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
            onClick={handleClear}
            aria-label="Effacer la recherche"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        )}
      </div>
      {debouncedSearch && (
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Recherche : &quot;{debouncedSearch}&quot;
        </p>
      )}
    </div>
  );
}
