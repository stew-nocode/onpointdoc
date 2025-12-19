'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Combobox } from '@/ui/combobox';
import type { BasicCompany } from '@/services/companies/server';
import { cn } from '@/lib/utils';

type CompanySelectorProps = {
  companies: BasicCompany[];
  initialCompanyId?: string;
  className?: string;
};

/**
 * Composant de sélection d'entreprise pour filtrer les tickets
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Responsabilité unique de sélection d'entreprise
 * - Évite la boucle infinie en comparant les valeurs avant router.push
 * - Utilise useRef pour stabiliser la valeur précédente
 * - Formatage cohérent : Nom de l'entreprise avec première lettre en majuscule
 * 
 * @param companies - Liste des entreprises disponibles
 * @param initialCompanyId - ID de l'entreprise initialement sélectionnée depuis l'URL
 */
export function CompanySelector({ companies, initialCompanyId, className }: CompanySelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId || '');
  
  // ✅ Utiliser useRef pour suivre la dernière valeur mise à jour dans l'URL
  // Évite les appels router.push inutiles si l'URL contient déjà la valeur
  const lastUrlCompanyIdRef = useRef<string>(initialCompanyId || '');

  // ✅ OPTIMISÉ : Mettre à jour l'URL seulement si la valeur a réellement changé
  useEffect(() => {
    // ✅ Vérifier si on a déjà mis à jour l'URL avec cette valeur
    if (lastUrlCompanyIdRef.current === selectedCompanyId) {
      return; // Pas de changement nécessaire
    }
    
    // ✅ Récupérer la valeur actuelle dans l'URL pour comparaison
    const currentUrlCompanyId = searchParams.get('company') || '';
    
    // Si l'URL contient déjà la valeur souhaitée, ne pas appeler router.push
    if (currentUrlCompanyId === selectedCompanyId) {
      lastUrlCompanyIdRef.current = selectedCompanyId;
      return;
    }
    
    // ✅ Mettre à jour la référence avant de changer l'URL
    lastUrlCompanyIdRef.current = selectedCompanyId;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedCompanyId) {
      params.set('company', selectedCompanyId);
    } else {
      params.delete('company');
    }

    // Réinitialiser l'offset quand on change d'entreprise
    params.delete('offset');

    const newUrl = params.toString() 
      ? `/gestion/tickets?${params.toString()}`
      : '/gestion/tickets';
    
    // ✅ CRITIQUE : scroll: false pour ne pas remonter en haut lors du changement
    router.push(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId, router]); // ✅ searchParams lu dans le useEffect mais pas en dépendance

  /**
   * Formate un nom d'entreprise avec la première lettre en majuscule et le reste en minuscule
   * Exemple: "ONPOINT" -> "Onpoint", "CILAGRI" -> "Cilagri"
   */
  const capitalizeName = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Formater les options pour le Combobox
  const options = companies.map((company) => {
    // ✅ Afficher le nom de l'entreprise formaté
    const displayName = company.name
      ? capitalizeName(company.name)
      : 'Sans nom';
    
    return {
      value: company.id,
      label: displayName,
      searchable: company.name.toLowerCase()
    };
  });

  const handleValueChange = useCallback((value: string) => {
    setSelectedCompanyId(value);
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <Combobox
        options={options}
        value={selectedCompanyId}
        onValueChange={handleValueChange}
        placeholder="entreprises"
        searchPlaceholder="Rechercher une entreprise..."
        emptyText="Aucune entreprise trouvée"
      />
    </div>
  );
}

