'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Combobox } from '@/ui/combobox';
import type { BasicProfile } from '@/services/users/server';
import { cn } from '@/lib/utils';

type AgentSelectorProps = {
  agents: BasicProfile[];
  initialAgentId?: string;
  className?: string;
};

/**
 * Composant de sélection d'agent support pour les managers
 * 
 * Principe Clean Code - Niveau Senior :
 * - SRP : Responsabilité unique de sélection d'agent
 * - Évite la boucle infinie en comparant les valeurs avant router.push
 * - Utilise useRef pour stabiliser la valeur précédente
 * - Formatage cohérent : Nom avec première lettre en majuscule, sans entreprise
 * 
 * @param agents - Liste des agents support disponibles
 * @param initialAgentId - ID de l'agent initialement sélectionné depuis l'URL
 */
export function AgentSelector({ agents, initialAgentId, className }: AgentSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId || '');
  
  // ✅ Utiliser useRef pour suivre la dernière valeur mise à jour dans l'URL
  // Évite les appels router.push inutiles si l'URL contient déjà la valeur
  const lastUrlAgentIdRef = useRef<string>(initialAgentId || '');

  // ✅ OPTIMISÉ : Mettre à jour l'URL seulement si la valeur a réellement changé
  useEffect(() => {
    // ✅ Vérifier si on a déjà mis à jour l'URL avec cette valeur
    if (lastUrlAgentIdRef.current === selectedAgentId) {
      return; // Pas de changement nécessaire
    }
    
    // ✅ Récupérer la valeur actuelle dans l'URL pour comparaison
    const currentUrlAgentId = searchParams.get('agent') || '';
    
    // Si l'URL contient déjà la valeur souhaitée, ne pas appeler router.push
    if (currentUrlAgentId === selectedAgentId) {
      lastUrlAgentIdRef.current = selectedAgentId;
      return;
    }
    
    // ✅ Mettre à jour la référence avant de changer l'URL
    lastUrlAgentIdRef.current = selectedAgentId;
    
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedAgentId) {
      params.set('agent', selectedAgentId);
    } else {
      params.delete('agent');
    }

    // Réinitialiser l'offset quand on change d'agent
    params.delete('offset');

    const newUrl = params.toString() 
      ? `/gestion/tickets?${params.toString()}`
      : '/gestion/tickets';
    
    // ✅ CRITIQUE : scroll: false pour ne pas remonter en haut lors du changement
    router.push(newUrl, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgentId, router]); // ✅ searchParams lu dans le useEffect mais pas en dépendance

  /**
   * Formate un nom avec la première lettre en majuscule et le reste en minuscule
   * Exemple: "JEAN DUPONT" -> "Jean dupont", "jean-dupont" -> "Jean-dupont"
   */
  const capitalizeName = (name: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Formater les options pour le Combobox
  const options = agents.map((agent) => {
    // ✅ Afficher uniquement le nom, sans entreprise
    const displayName = agent.full_name
      ? capitalizeName(agent.full_name)
      : agent.email || 'Sans nom';
    
    return {
      value: agent.id,
      label: displayName,
      searchable: `${agent.full_name || ''} ${agent.email || ''} ${agent.company_name || ''}`.trim()
    };
  });

  const handleValueChange = useCallback((value: string) => {
    setSelectedAgentId(value);
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <Combobox
        options={options}
        value={selectedAgentId}
        onValueChange={handleValueChange}
        placeholder="agents support"
        searchPlaceholder="Rechercher un agent..."
        emptyText="Aucun agent trouvé"
      />
    </div>
  );
}

