/**
 * Utilitaires pour gérer les timeouts sur les requêtes Supabase (non-RPC)
 * 
 * Problème : Les requêtes Supabase peuvent prendre plusieurs minutes avant de timeout,
 * ce qui bloque le chargement de la page. Ce wrapper force un timeout explicite.
 */

/**
 * Wrapper pour les requêtes Supabase avec timeout
 * 
 * @param queryPromise - Promise de la requête Supabase
 * @param timeoutMs - Timeout en millisecondes (défaut: 10000 = 10s)
 * @returns Le résultat de la requête ou null si timeout
 */
export async function withQueryTimeout<T>(
  queryPromise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs: number = 10000
): Promise<{ data: T | null; error: any }> {
  return Promise.race([
    Promise.resolve(queryPromise),
    new Promise<{ data: null; error: any }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: {
            message: `Query timeout après ${timeoutMs}ms`,
            code: 'TIMEOUT'
          }
        });
      }, timeoutMs);
    })
  ]);
}

