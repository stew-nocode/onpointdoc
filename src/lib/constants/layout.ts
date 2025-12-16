/**
 * Constantes de layout pour l'application
 *
 * Centralise les valeurs hardcodées pour faciliter
 * la maintenance et garantir la cohérence visuelle
 */

/**
 * Dimensions et espacements du layout principal
 */
export const LAYOUT = {
  /**
   * Hauteur de la page (viewport - header)
   */
  PAGE_HEIGHT: 'h-[calc(100vh-4rem)]',

  /**
   * Hauteur du header principal
   */
  HEADER_HEIGHT: '4rem',

  /**
   * Largeur de la timeline (colonne droite desktop)
   */
  TIMELINE_WIDTH: 'w-96',

  /**
   * Largeur maximale pour les formulaires
   */
  FORM_MAX_WIDTH: 'max-w-2xl',

  /**
   * Largeur maximale pour le contenu principal
   */
  CONTENT_MAX_WIDTH: 'max-w-7xl',
} as const;

/**
 * Breakpoints responsive (Tailwind)
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

/**
 * Classes CSS pour les breakpoints
 */
export const RESPONSIVE = {
  /**
   * Caché sur mobile, visible sur desktop (≥ lg)
   */
  DESKTOP_ONLY: 'hidden lg:block',

  /**
   * Visible sur mobile, caché sur desktop
   */
  MOBILE_ONLY: 'lg:hidden',

  /**
   * Flex sur desktop uniquement
   */
  DESKTOP_FLEX: 'hidden lg:flex',

  /**
   * Grille responsive standard (1 col mobile, 2 cols tablet, 3 cols desktop)
   */
  GRID_RESPONSIVE: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
} as const;

/**
 * Espacements standard
 */
export const SPACING = {
  /**
   * Espacement entre sections
   */
  SECTION_GAP: 'gap-4',

  /**
   * Espacement entre cartes
   */
  CARD_GAP: 'space-y-4',

  /**
   * Espacement entre éléments de formulaire
   */
  FORM_GAP: 'space-y-2',

  /**
   * Padding des cartes
   */
  CARD_PADDING: 'p-4',
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
} as const;
