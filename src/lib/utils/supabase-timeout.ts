/**
 * Utilitaires pour gérer les timeouts sur les appels Supabase RPC
 * 
 * Problème : Les requêtes Supabase peuvent prendre plusieurs minutes avant de timeout,
 * ce qui bloque le chargement de la page. Ce wrapper force un timeout explicite.
 */

/**
 * Wrapper pour les appels RPC Supabase avec timeout
 * 
 * @param rpcPromise - Promise de l'appel RPC Supabase
 * @param timeoutMs - Timeout en millisecondes (défaut: 10000 = 10s)
 * @returns Le résultat de l'appel RPC ou null si timeout
 */
export async function withRpcTimeout<T>(
  rpcPromise: PromiseLike<{ data: T | null; error: any }>,
  timeoutMs: number = 10000
): Promise<{ data: T | null; error: any }> {
  return Promise.race([
    Promise.resolve(rpcPromise),
    new Promise<{ data: null; error: any }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: {
            message: `RPC timeout après ${timeoutMs}ms`,
            code: 'TIMEOUT'
          }
        });
      }, timeoutMs);
    })
  ]);
}

