'use client';

import { MultiSelectFilter } from './multi-select-filter';

type BasicProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type AssignedToFilterProps = {
  users: BasicProfile[];
  selectedUserIds: string[];
  onUserIdsChange: (userIds: string[]) => void;
};

/**
 * Construit les options d'utilisateurs pour le filtre
 * 
 * @param users - Liste des utilisateurs
 * @returns Liste des options d'utilisateurs
 */
function buildUserOptions(users: BasicProfile[]): Array<{ value: string; label: string }> {
  return users.map((user) => ({
    value: user.id,
    label: user.full_name || user.email || 'Utilisateur sans nom'
  }));
}

/**
 * Composant pour filtrer par utilisateur assigné
 * 
 * @param users - Liste des utilisateurs disponibles
 * @param selectedUserIds - IDs des utilisateurs sélectionnés
 * @param onUserIdsChange - Callback appelé lors du changement de sélection
 */
export function AssignedToFilter({
  users,
  selectedUserIds,
  onUserIdsChange
}: AssignedToFilterProps) {
  const options = buildUserOptions(users);

  return (
    <MultiSelectFilter
      options={options}
      selectedValues={selectedUserIds}
      onSelectionChange={onUserIdsChange}
      placeholder="Tous les assignés"
      searchPlaceholder="Rechercher un utilisateur..."
      emptyText="Aucun utilisateur trouvé"
      label="Assigné à"
    />
  );
}

