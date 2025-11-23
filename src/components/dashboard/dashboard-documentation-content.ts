/**
 * Contenu de documentation pour chaque bloc du dashboard CEO
 * 
 * Chaque objet contient les informations nécessaires pour documenter
 * un KPI, graphique ou tableau de manière explicite pour le DG/CEO.
 */

export type DocumentationContent = {
  title: string;
  subtitle: string;
  definition: string;
  calculation: string;
  interpretation: string;
};

/**
 * Documentation pour le KPI MTTR Global
 */
export const MTTR_DOCUMENTATION: DocumentationContent = {
  title: 'MTTR Global',
  subtitle: 'Temps moyen pour résoudre un ticket (en jours)',
  definition: `Temps moyen nécessaire pour résoudre un ticket, du moment de sa création à sa résolution. Indicateur clé de l'efficacité opérationnelle.`,
  calculation: `1. Pour chaque ticket résolu dans la période :
   - Calculer : Date résolution - Date création (en jours)
2. Faire la moyenne de tous ces temps
3. Arrondir à 1 décimale

Exemple :
- Ticket A : 3 jours
- Ticket B : 5 jours
- Ticket C : 2 jours
→ MTTR = (3 + 5 + 2) / 3 = 3.3 jours

Note : Seuls les tickets résolus dans la période sont pris en compte.`,
  interpretation: `• MTTR bas (< 5 jours) = Résolution rapide ✅
• MTTR moyen (5-10 jours) = Délais acceptables
• MTTR élevé (> 10 jours) = Délais importants ⚠️
• Tendance négative = Amélioration (réduction du temps) 🟢
• Tendance positive = Dégradation (augmentation du temps) 🔴`
};

/**
 * Documentation pour le KPI Flux Tickets
 */
export const FLUX_TICKETS_DOCUMENTATION: DocumentationContent = {
  title: 'Flux de Tickets',
  subtitle: 'Évolution des tickets créés et résolus cette période',
  definition: `Compare le nombre de nouveaux tickets créés avec le nombre de tickets résolus sur la période sélectionnée. Permet de détecter une accumulation ou une résorption du stock de tickets.`,
  calculation: `Tickets Ouverts :
- Compte tous les tickets créés entre [date début période] et [date fin période]

Tickets Résolus :
- Compte tous les tickets dont la date de résolution est entre [date début période] et [date fin période]

Taux de Résolution :
- (Tickets Résolus / Tickets Ouverts) × 100
- Exemple : 80 résolus / 100 ouverts = 80%

Tendance :
- Comparaison avec la période précédente en pourcentage
- Exemple : +15% = 15% de tickets en plus que la période précédente`,
  interpretation: `• Taux > 100% = Plus de résolus que d'ouverts ✅ (bon signe si stock initial élevé)
• Taux 80-100% = Équilibre optimal ✅
• Taux < 50% = Accumulation de tickets ⚠️ (risque de retard)
• Tendance positive (ouverts) = Plus de nouveaux tickets ⚠️
• Tendance positive (résolus) = Plus de tickets résolus ✅`
};

/**
 * Documentation pour le KPI Charge de Travail
 */
export const WORKLOAD_DOCUMENTATION: DocumentationContent = {
  title: 'Charge de Travail',
  subtitle: 'Nombre de tickets en cours par équipe',
  definition: `Répartition des tickets actuellement en cours de traitement, organisée par équipe et par agent. Permet d'identifier les surcharges et déséquilibres.`,
  calculation: `Tickets Actifs :
- Tickets non résolus (résolved_at = null)
- OU tickets résolus après la fin de la période

Par Équipe :
- Regroupe les tickets actifs selon le rôle de l'agent assigné :
  * Support : rôle "agent", "manager", "support"
  * IT : rôle contenant "it"
  * Marketing : rôle contenant "marketing"

Par Agent :
- Compte les tickets actifs assignés à chaque agent
- Calcule le % de charge : (Tickets agent / Max tickets agent) × 100
- Affiche aussi le nombre résolu dans la période`,
  interpretation: `• Répartition équilibrée = Charge bien distribuée ✅
• Agent > 150% du max = Surcharge ⚠️
• Équipe disproportionnée = Déséquilibre organisationnel 🔴
• Charge uniforme = Organisation optimale ✅`
};

/**
 * Documentation pour le KPI Santé Produit
 */
export const HEALTH_DOCUMENTATION: DocumentationContent = {
  title: 'Santé des Produits',
  subtitle: 'Taux de bugs par produit (indicateur de stabilité)',
  definition: `Mesure la proportion de bugs parmi tous les tickets d'un produit. Indicateur de stabilité et qualité. Un taux élevé indique des problèmes récurrents nécessitant une attention prioritaire.`,
  calculation: `Pour chaque produit :
1. Compter tous les tickets créés dans la période
2. Compter uniquement les tickets de type "BUG"
3. Calculer le taux : (Nombre de BUGs / Total tickets) × 100

Exemple :
- Produit A : 100 tickets totaux, 25 BUGs
- Taux = (25 / 100) × 100 = 25%

Statut de Santé :
- 🟢 Bon (< 20%) : Peu de bugs, produit stable
- 🟠 Avertissement (20-40%) : Proportion de bugs à surveiller
- 🔴 Critique (> 40%) : Taux élevé, action requise

Top Modules :
- Affiche les 10 modules avec le plus de bugs
- Compare avec la période précédente pour la tendance`,
  interpretation: `• Taux bas (< 20%) = Produit stable et fiable ✅
• Taux moyen (20-40%) = Surveillance nécessaire 🟠
• Taux élevé (> 40%) = Problèmes récurrents nécessitant analyse 🔴
• Tendance positive = Dégradation de la qualité ⚠️
• Tendance négative = Amélioration en cours ✅`
};

/**
 * Documentation pour le graphique MTTR Evolution
 */
export const MTTR_EVOLUTION_DOCUMENTATION: DocumentationContent = {
  title: 'Évolution MTTR par Produit',
  subtitle: 'Évolution du temps moyen de résolution par produit au fil du temps',
  definition: `Visualise l'évolution du temps moyen de résolution pour chaque produit sur différentes périodes. Permet d'identifier les tendances et les écarts entre produits.`,
  calculation: `Pour chaque période dans la plage :
- Applique le même calcul MTTR (voir KPI MTTR Global)
- Mais uniquement pour les tickets du produit sélectionné
- Affiche une courbe par produit avec dégradé de couleur

La courbe montre l'évolution temporelle, permettant de détecter :
- Des pics de délais
- Des améliorations progressives
- Des différences entre produits`,
  interpretation: `• Courbe descendante = Amélioration (réduction des délais) ✅
• Courbe ascendante = Dégradation (augmentation des délais) ⚠️
• Courbe stable = Performance constante
• Comparaison produits = Identifier ceux qui nécessitent attention
• Écart important entre produits = Déséquilibre de traitement 🔴`
};

/**
 * Documentation pour le graphique Distribution Tickets
 */
export const DISTRIBUTION_TICKETS_DOCUMENTATION: DocumentationContent = {
  title: 'Distribution des Tickets',
  subtitle: 'Répartition des tickets par produit et type',
  definition: `Affiche la répartition proportionnelle des tickets par produit. Permet de visualiser rapidement la distribution de la charge entre les différents produits.`,
  calculation: `Pour chaque produit :
1. Compter tous les tickets créés dans la période
2. Calculer le pourcentage : (Tickets produit / Total tickets) × 100
3. Afficher en segments de cercle (donut chart)

Les segments sont colorés différemment par produit pour faciliter la visualisation.`,
  interpretation: `• Distribution équilibrée = Charge bien répartie ✅
• Un produit dominant = Concentration importante ⚠️
• Comparaison avec période précédente = Évolution de la charge
• Permet d'identifier rapidement les produits les plus sollicités`
};

/**
 * Documentation pour le tableau Top Modules avec BUGs
 */
export const TOP_BUGS_MODULES_DOCUMENTATION: DocumentationContent = {
  title: 'Top Modules avec BUGs',
  subtitle: 'Les 10 modules avec le plus de bugs cette période',
  definition: `Liste des modules les plus problématiques en termes de bugs, pour identifier les zones nécessitant une attention prioritaire.`,
  calculation: `1. Groupe tous les tickets par module
2. Compte les BUGs par module
3. Calcule le taux : (BUGs module / Total tickets module) × 100
4. Trie par nombre de BUGs décroissant
5. Affiche les 10 premiers
6. Compare avec période précédente pour la tendance

Tendance :
- Calcul : ((BUGs actuels - BUGs précédents) / BUGs précédents) × 100
- Exemple : +50% = 50% de bugs en plus que la période précédente`,
  interpretation: `• Top 1-3 = Modules critiques nécessitant action immédiate 🔴
• Tendance positive = Dégradation, besoin d'investigation ⚠️
• Tendance négative = Amélioration en cours ✅
• Taux élevé (> 40%) = Module instable nécessitant refactoring
• Permet de prioriser les efforts de correction`
};

/**
 * Documentation pour le tableau Charge par Agent
 */
export const WORKLOAD_BY_AGENT_DOCUMENTATION: DocumentationContent = {
  title: 'Charge par Agent',
  subtitle: 'Répartition détaillée de la charge de travail par agent',
  definition: `Affiche la charge de travail individuelle de chaque agent : tickets actifs, tickets résolus dans la période, et pourcentage de charge relatif.`,
  calculation: `Pour chaque agent :
- Compte les tickets actifs assignés (non résolus)
- Compte les tickets résolus dans la période
- Calcule le % de charge : (Tickets actifs agent / Max tickets actifs) × 100

Le pourcentage de charge permet de comparer la charge relative entre agents.`,
  interpretation: `• Charge < 100% = Agent en dessous de la charge maximale
• Charge 100-150% = Charge normale à élevée
• Charge > 150% = Surcharge, risque de burnout ⚠️
• Écart important = Déséquilibre de répartition 🔴
• Permet d'identifier les agents surchargés ou sous-chargés`
};

