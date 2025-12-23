/**
 * Utilitaires de validation pour les webhooks entrants
 * 
 * Implémente la sécurisation des webhooks avec :
 * - Validation de token secret (header ou query param)
 * - Validation d'IP source (optionnel)
 * - Rate limiting basique (en mémoire)
 */

import { createError } from '@/lib/errors/types';
import { createHmac } from 'crypto';

/**
 * Configuration pour la validation des webhooks
 */
type WebhookValidationConfig = {
  /** Token secret pour l'authentification (optionnel si pas configuré) */
  secretToken?: string;
  /** Nom du header contenant le token */
  tokenHeader?: string;
  /** Nom du query param contenant le token (fallback) */
  tokenQueryParam?: string;
  /** IPs autorisées (optionnel, vide = toutes autorisées) */
  allowedIps?: string[];
  /** Activer le rate limiting */
  enableRateLimit?: boolean;
  /** Limite de requêtes par minute par IP */
  rateLimitPerMinute?: number;
};

/**
 * Cache en mémoire pour le rate limiting
 * Map<ip, { count: number, resetAt: number }>
 */
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Nettoie le cache de rate limiting (entrées expirées)
 */
function cleanRateLimitCache(): void {
  const now = Date.now();
  for (const [ip, data] of rateLimitCache.entries()) {
    if (data.resetAt < now) {
      rateLimitCache.delete(ip);
    }
  }
}

/**
 * Vérifie le rate limiting pour une IP
 * 
 * @param ip - Adresse IP du client
 * @param limit - Nombre max de requêtes par minute
 * @returns true si la requête est autorisée
 */
function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  // Nettoyer le cache périodiquement
  if (rateLimitCache.size > 1000) {
    cleanRateLimitCache();
  }

  const entry = rateLimitCache.get(ip);
  
  if (!entry || entry.resetAt < now) {
    // Nouvelle fenêtre
    rateLimitCache.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Extrait l'IP du client depuis les headers
 * 
 * @param headers - Headers de la requête
 * @returns IP du client
 */
function extractClientIp(headers: Headers): string {
  // Headers standards pour reverse proxy
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Vercel
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    return vercelIp.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * Valide un webhook entrant
 * 
 * @param headers - Headers de la requête
 * @param url - URL de la requête
 * @param config - Configuration de validation
 * @throws ApplicationError si la validation échoue
 */
export function validateWebhook(
  headers: Headers,
  url: URL,
  config: WebhookValidationConfig
): void {
  const {
    secretToken,
    tokenHeader = 'x-webhook-secret',
    tokenQueryParam = 'secret',
    allowedIps = [],
    enableRateLimit = true,
    rateLimitPerMinute = 60
  } = config;

  // 1. Validation du token secret (si configuré)
  if (secretToken) {
    const headerToken = headers.get(tokenHeader);
    const queryToken = url.searchParams.get(tokenQueryParam);
    const providedToken = headerToken || queryToken;

    if (!providedToken) {
      throw createError.unauthorized(
        'Token de webhook manquant',
        { header: tokenHeader, queryParam: tokenQueryParam }
      );
    }

    if (providedToken !== secretToken) {
      throw createError.unauthorized('Token de webhook invalide');
    }
  }

  // 2. Validation de l'IP source (si configuré)
  if (allowedIps.length > 0) {
    const clientIp = extractClientIp(headers);
    
    if (!allowedIps.includes(clientIp) && clientIp !== 'unknown') {
      throw createError.forbidden(
        `IP non autorisée: ${clientIp}`,
        { clientIp, allowedIps }
      );
    }
  }

  // 3. Rate limiting
  if (enableRateLimit) {
    const clientIp = extractClientIp(headers);
    
    if (!checkRateLimit(clientIp, rateLimitPerMinute)) {
      throw createError.validationError(
        'Limite de requêtes dépassée',
        { clientIp, limit: rateLimitPerMinute }
      );
    }
  }
}

/**
 * Valide une signature HMAC (pour webhooks signés)
 * 
 * @param payload - Corps de la requête (string)
 * @param signature - Signature fournie dans le header
 * @param secret - Secret partagé
 * @param algorithm - Algorithme HMAC (défaut: sha256)
 * @returns true si la signature est valide
 */
export function validateHmacSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: string = 'sha256'
): boolean {
  const expectedSignature = createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  // Comparaison timing-safe
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Configuration par défaut pour le webhook JIRA
 */
export function getJiraWebhookConfig(): WebhookValidationConfig {
  return {
    secretToken: process.env.JIRA_WEBHOOK_SECRET,
    tokenHeader: 'x-jira-webhook-secret',
    tokenQueryParam: 'secret',
    allowedIps: process.env.JIRA_ALLOWED_IPS?.split(',').map(ip => ip.trim()) ?? [],
    enableRateLimit: true,
    rateLimitPerMinute: 120 // JIRA peut envoyer beaucoup de webhooks
  };
}

