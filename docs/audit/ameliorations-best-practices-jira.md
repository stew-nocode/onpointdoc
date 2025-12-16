# Améliorations Best Practices - Synchronisation JIRA ↔ Supabase

**Date :** 2025-01-27  
**Version :** 1.0

## 📋 Vue d'ensemble

Ce document liste toutes les améliorations à apporter pour parfaire la synchronisation JIRA ↔ Supabase selon les best practices.

---

## 🎯 Priorité 1 : Critiques (À faire en premier)

### 1.1 Retry Automatique pour les Appels JIRA

**Problème actuel** :
- Pas de retry si l'appel JIRA échoue (timeout, erreur réseau)
- Une erreur temporaire fait échouer tout le transfert

**Solution** :
```typescript
// src/lib/utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    retryableErrors?: number[];
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    retryableErrors = [429, 500, 502, 503, 504]
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Vérifier si l'erreur est retryable
      const statusCode = (error as any)?.status || (error as any)?.response?.status;
      if (statusCode && !retryableErrors.includes(statusCode)) {
        throw error; // Erreur non retryable
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Backoff exponentiel
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

**À modifier** :
- `src/services/jira/client.ts` : Wrapper les appels fetch avec retry
- `src/services/jira/sync-manual.ts` : Ajouter retry pour fetchJiraIssue

**Fichiers à créer** :
- `src/lib/utils/retry.ts`

---

### 1.2 Timeout sur les Appels API

**Problème actuel** :
- Pas de timeout sur les appels fetch vers JIRA
- Risque de blocage indéfini

**Solution** :
```typescript
// src/lib/utils/fetch-with-timeout.ts
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout après ${timeout}ms`);
    }
    throw error;
  }
}
```

**À modifier** :
- `src/services/jira/client.ts` : Remplacer fetch par fetchWithTimeout
- `src/services/jira/sync-manual.ts` : Idem

**Fichiers à créer** :
- `src/lib/utils/fetch-with-timeout.ts`

---

### 1.3 Gestion d'Erreurs Typées avec ApplicationError

**Problème actuel** :
- Utilisation de `throw new Error()` générique
- Pas de distinction entre types d'erreurs (réseau, validation, JIRA, etc.)

**Solution** :
```typescript
// src/services/jira/client.ts
import { createError } from '@/lib/errors/types';

// Au lieu de :
throw new Error('Configuration JIRA manquante');

// Utiliser :
throw createError.configurationError('Configuration JIRA manquante. Vérifiez JIRA_URL, JIRA_USERNAME et JIRA_TOKEN.');

// Pour les erreurs JIRA :
throw createError.jiraError('Erreur lors de la création du ticket JIRA', originalError);
```

**À modifier** :
- `src/services/jira/client.ts` : Remplacer tous les `throw new Error()`
- `src/services/tickets/jira-transfer.ts` : Idem
- `src/services/jira/sync.ts` : Idem

---

### 1.4 Logging Structuré

**Problème actuel** :
- Utilisation de `console.log/error/warn` partout
- Pas de logs structurés pour monitoring
- Difficile à filtrer/analyser

**Solution** :
```typescript
// src/lib/logger/jira.ts
import { createLogger } from '@/lib/logger';

export const jiraLogger = createLogger('jira', {
  context: 'jira-sync'
});

// Utilisation :
jiraLogger.info('Création ticket JIRA', { ticketId, jiraKey });
jiraLogger.error('Erreur création JIRA', { ticketId, error: error.message });
jiraLogger.warn('Retry création JIRA', { ticketId, attempt });
```

**À modifier** :
- Remplacer tous les `console.log/error/warn` dans `src/services/jira/`
- Utiliser le logger structuré

**Fichiers à créer** :
- `src/lib/logger/jira.ts` (si pas déjà existant)

---

### 1.5 Sécurité Webhook JIRA

**Problème actuel** :
- Webhook `/api/webhooks/jira` non sécurisé
- N'importe qui peut envoyer des données

**Solution** :
```typescript
// src/app/api/webhooks/jira/route.ts
import { verifyJiraWebhook } from '@/lib/security/jira-webhook';

export async function POST(request: NextRequest) {
  // Vérifier la signature JIRA (si configuré)
  const isValid = await verifyJiraWebhook(request);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... reste du code
}
```

**Fichiers à créer** :
- `src/lib/security/jira-webhook.ts`

**Note** : JIRA peut envoyer un secret dans les headers, à vérifier

---

## 🎯 Priorité 2 : Importantes (À faire ensuite)

### 2.1 Validation Zod pour les Webhooks

**Problème actuel** :
- Pas de validation du payload webhook JIRA
- Risque d'erreurs si format incorrect

**Solution** :
```typescript
// src/lib/validators/jira-webhook.ts
import { z } from 'zod';

export const jiraWebhookSchema = z.object({
  webhookEvent: z.string(),
  issue: z.object({
    key: z.string(),
    id: z.string(),
    fields: z.object({
      summary: z.string().optional(),
      status: z.object({
        name: z.string()
      }).optional(),
      // ... autres champs
    }).optional()
  }).optional()
});

// Utilisation :
const validationResult = jiraWebhookSchema.safeParse(body);
if (!validationResult.success) {
  return handleApiError(createError.validationError('Format webhook invalide', {
    issues: validationResult.error.issues
  }));
}
```

**Fichiers à créer** :
- `src/lib/validators/jira-webhook.ts`

**À modifier** :
- `src/app/api/webhooks/jira/route.ts` : Ajouter validation

---

### 2.2 Rate Limiting JIRA

**Problème actuel** :
- Pas de gestion du rate limiting JIRA
- Risque de dépasser les limites API

**Solution** :
```typescript
// src/lib/utils/rate-limiter.ts
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequest = 0;
  private minDelay = 100; // 100ms entre requêtes

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const now = Date.now();
    const delay = Math.max(0, this.minDelay - (now - this.lastRequest));
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    const fn = this.queue.shift();
    if (fn) {
      this.lastRequest = Date.now();
      await fn();
    }
    
    this.processing = false;
    this.process(); // Traiter le prochain
  }
}

export const jiraRateLimiter = new RateLimiter();
```

**À modifier** :
- `src/services/jira/client.ts` : Wrapper les appels avec rate limiter

**Fichiers à créer** :
- `src/lib/utils/rate-limiter.ts`

---

### 2.3 Idempotence pour les Créations JIRA

**Problème actuel** :
- Pas de vérification si le ticket JIRA existe déjà
- Risque de doublons en cas de retry

**Solution** :
```typescript
// src/services/jira/client.ts
export async function createJiraIssue(input: CreateJiraIssueInput): Promise<CreateJiraIssueResponse> {
  // Vérifier si le ticket a déjà une clé JIRA
  const supabase = await createSupabaseServerClient();
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('jira_issue_key')
    .eq('id', input.ticketId)
    .single();
  
  if (existingTicket?.jira_issue_key) {
    // Ticket déjà créé dans JIRA
    return {
      success: true,
      jiraIssueKey: existingTicket.jira_issue_key
    };
  }
  
  // ... reste de la création
}
```

**À modifier** :
- `src/services/jira/client.ts` : Ajouter vérification idempotence

---

### 2.4 Transaction/Rollback pour le Transfert

**Problème actuel** :
- Si la création JIRA échoue après mise à jour Supabase, l'état est incohérent
- Pas de rollback

**Solution** :
```typescript
// src/services/tickets/jira-transfer.ts
export const transferTicketToJira = async (ticketId: string) => {
  const supabase = await createSupabaseServerClient();
  
  // 1. Sauvegarder l'état initial
  const { data: originalTicket } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', ticketId)
    .single();
  
  const originalStatus = originalTicket?.status;
  
  try {
    // 2. Mettre à jour le statut
    await supabase
      .from('tickets')
      .update({ status: 'Transfere', last_update_source: 'supabase' })
      .eq('id', ticketId);
    
    // 3. Créer le ticket JIRA
    const jiraResponse = await createJiraIssue({...});
    
    if (!jiraResponse.success) {
      // Rollback : restaurer le statut original
      await supabase
        .from('tickets')
        .update({ status: originalStatus })
        .eq('id', ticketId);
      throw new Error(`Erreur création JIRA: ${jiraResponse.error}`);
    }
    
    // 4. Mettre à jour avec la clé JIRA
    await supabase
      .from('tickets')
      .update({ jira_issue_key: jiraResponse.jiraIssueKey })
      .eq('id', ticketId);
      
  } catch (error) {
    // Rollback en cas d'erreur
    if (originalStatus) {
      await supabase
        .from('tickets')
        .update({ status: originalStatus })
        .eq('id', ticketId);
    }
    throw error;
  }
};
```

**À modifier** :
- `src/services/tickets/jira-transfer.ts` : Ajouter rollback

---

### 2.5 Monitoring et Métriques

**Problème actuel** :
- Pas de tracking des erreurs de synchronisation
- Pas de métriques (temps de sync, taux de succès, etc.)

**Solution** :
```typescript
// src/lib/monitoring/jira-sync.ts
export async function trackJiraSync(
  action: 'create' | 'update' | 'sync',
  ticketId: string,
  success: boolean,
  duration: number,
  error?: string
) {
  const supabase = createSupabaseServiceRoleClient();
  
  await supabase.from('jira_sync_metrics').insert({
    action,
    ticket_id: ticketId,
    success,
    duration_ms: duration,
    error_message: error,
    created_at: new Date().toISOString()
  });
}

// Utilisation :
const startTime = Date.now();
try {
  await createJiraIssue(...);
  await trackJiraSync('create', ticketId, true, Date.now() - startTime);
} catch (error) {
  await trackJiraSync('create', ticketId, false, Date.now() - startTime, error.message);
  throw error;
}
```

**Fichiers à créer** :
- `src/lib/monitoring/jira-sync.ts`
- Migration Supabase : Table `jira_sync_metrics`

**À modifier** :
- Tous les appels JIRA : Ajouter tracking

---

## 🎯 Priorité 3 : Améliorations (Nice to have)

### 3.1 Cache pour les Mappings

**Problème actuel** :
- Requêtes répétées pour les mêmes mappings (statuts, priorités)
- Performance sous-optimale

**Solution** :
```typescript
// src/lib/cache/jira-mappings.ts
import { unstable_cache } from 'next/cache';

export const getCachedStatusMapping = unstable_cache(
  async (jiraStatus: string, ticketType: TicketType) => {
    return await getSupabaseStatusFromJira(jiraStatus, ticketType);
  },
  ['jira-status-mapping'],
  { revalidate: 3600 } // 1 heure
);
```

**À modifier** :
- `src/services/jira/mapping.ts` : Ajouter cache

---

### 3.2 Queue pour les Synchronisations en Masse

**Problème actuel** :
- Synchronisation en masse bloque le thread
- Pas de traitement asynchrone

**Solution** :
- Utiliser une queue (BullMQ, Inngest, ou simple table Supabase)
- Traiter les synchronisations en arrière-plan

**Fichiers à créer** :
- `src/services/jira/queue.ts`
- Route API pour déclencher les syncs en queue

---

### 3.3 Tests Unitaires et d'Intégration

**Problème actuel** :
- Pas de tests pour la synchronisation JIRA

**Solution** :
```typescript
// src/services/jira/__tests__/client.test.ts
describe('createJiraIssue', () => {
  it('should create a JIRA issue successfully', async () => {
    // Mock fetch
    // Test création
  });
  
  it('should retry on network error', async () => {
    // Test retry
  });
});
```

**Fichiers à créer** :
- Tests pour tous les services JIRA

---

### 3.4 Documentation des Mappings

**Problème actuel** :
- Mappings de statuts/priorités pas documentés
- Difficile de comprendre les correspondances

**Solution** :
- Créer un fichier de documentation des mappings
- Ajouter des commentaires dans le code

**Fichiers à créer** :
- `docs/jira/mappings.md`

---

## 📋 Checklist d'Implémentation

### Priorité 1 (Critiques)
- [ ] 1.1 Retry automatique pour appels JIRA
- [ ] 1.2 Timeout sur appels API
- [ ] 1.3 Gestion d'erreurs typées (ApplicationError)
- [ ] 1.4 Logging structuré
- [ ] 1.5 Sécurité webhook JIRA

### Priorité 2 (Importantes)
- [ ] 2.1 Validation Zod pour webhooks
- [ ] 2.2 Rate limiting JIRA
- [ ] 2.3 Idempotence créations
- [ ] 2.4 Transaction/rollback transfert
- [ ] 2.5 Monitoring et métriques

### Priorité 3 (Améliorations)
- [ ] 3.1 Cache pour mappings
- [ ] 3.2 Queue pour syncs en masse
- [ ] 3.3 Tests unitaires/intégration
- [ ] 3.4 Documentation mappings

---

## 🎯 Plan d'Action Recommandé

### Semaine 1 : Priorité 1
1. Implémenter retry automatique
2. Ajouter timeout sur appels API
3. Remplacer erreurs génériques par ApplicationError
4. Mettre en place logging structuré
5. Sécuriser le webhook JIRA

### Semaine 2 : Priorité 2
1. Validation Zod pour webhooks
2. Rate limiting JIRA
3. Idempotence créations
4. Transaction/rollback
5. Monitoring de base

### Semaine 3+ : Priorité 3
1. Cache pour mappings
2. Queue pour syncs (si besoin)
3. Tests (progressif)
4. Documentation

---

## ✅ Résumé

**Total d'améliorations** : 14

- **Priorité 1** : 5 (critiques)
- **Priorité 2** : 5 (importantes)
- **Priorité 3** : 4 (améliorations)

**Impact estimé** :
- **Fiabilité** : +80% (retry, timeout, rollback)
- **Sécurité** : +90% (webhook sécurisé, validation)
- **Observabilité** : +100% (logging, monitoring)
- **Performance** : +30% (cache, rate limiting)

**Effort estimé** :
- Priorité 1 : 2-3 jours
- Priorité 2 : 2-3 jours
- Priorité 3 : 3-5 jours

**Total** : 7-11 jours de développement


