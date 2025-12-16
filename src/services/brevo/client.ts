/**
 * Client API Brevo
 *
 * Wrapper autour de l'API Brevo v3 pour gérer les appels REST
 * Pattern similaire à src/services/jira/client.ts
 *
 * Documentation API : https://developers.brevo.com/reference
 */

import { createError } from '@/lib/errors/types';
import type {
  BrevoCampaignResponse,
  BrevoCampaignsListResponse,
  BrevoContact,
  BrevoTemplate,
  CreateEmailCampaignPayload,
  SendTransactionalEmailPayload,
  BrevoOperationResult
} from '@/types/brevo';

/**
 * Configuration du client Brevo depuis les variables d'environnement
 */
function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const apiUrl = process.env.BREVO_API_URL || 'https://api.brevo.com/v3';

  if (!apiKey) {
    throw createError.internalError(
      'Configuration Brevo manquante. Veuillez définir BREVO_API_KEY dans les variables d\'environnement.'
    );
  }

  // Nettoyer les valeurs
  const cleanApiKey = apiKey.replace(/^["']|["']$/g, '').trim();
  const cleanApiUrl = apiUrl.replace(/^["']|["']$/g, '').replace(/\/$/, '').trim();

  return {
    apiKey: cleanApiKey,
    apiUrl: cleanApiUrl
  };
}

/**
 * Classe client pour l'API Brevo
 *
 * Gère les appels HTTP avec authentification, retry et gestion d'erreurs
 */
export class BrevoClient {
  private apiKey: string;
  private apiUrl: string;
  private timeout: number;

  constructor(config?: { apiKey?: string; apiUrl?: string; timeout?: number }) {
    const envConfig = getBrevoConfig();

    this.apiKey = config?.apiKey || envConfig.apiKey;
    this.apiUrl = config?.apiUrl || envConfig.apiUrl;
    this.timeout = config?.timeout || 30000; // 30 secondes par défaut
  }

  /**
   * Effectue une requête HTTP à l'API Brevo
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options?: { timeout?: number }
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options?.timeout || this.timeout
      );

      const response = await fetch(url, {
        method,
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Gérer les erreurs HTTP
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        // Messages d'erreur spécifiques selon le code HTTP
        let errorMessage = errorData.message || errorText;
        
        if (response.status === 401) {
          // Erreur d'authentification - peut être IP non autorisée
          if (errorMessage.includes('unrecognised IP') || errorMessage.includes('IP address')) {
            errorMessage = `Adresse IP non autorisée. Veuillez ajouter votre adresse IP dans les paramètres de sécurité Brevo : https://app.brevo.com/security/authorised_ips\n\nDétails : ${errorData.message || errorText}`;
          } else {
            errorMessage = `Clé API Brevo invalide ou expirée. Vérifiez votre configuration BREVO_API_KEY.\n\nDétails : ${errorData.message || errorText}`;
          }
        } else if (response.status === 403) {
          errorMessage = `Permissions insuffisantes. Vérifiez que votre clé API a les permissions nécessaires.\n\nDétails : ${errorData.message || errorText}`;
        } else if (response.status === 429) {
          // Lire les headers de rate limiting pour indiquer le temps d'attente
          const resetSeconds = response.headers.get('x-sib-ratelimit-reset');
          const waitTime = resetSeconds ? Math.ceil(parseInt(resetSeconds, 10) / 60) : 15;
          errorMessage = `Limite de taux dépassée. Attendez ${waitTime} minutes avant de réessayer.\n\nDétails : ${errorData.message || errorText}`;
        }

        throw createError.networkError(
          `Erreur API Brevo ${response.status}: ${errorMessage}`,
          new Error(errorData.code || 'BREVO_API_ERROR')
        );
      }

      // Parser la réponse JSON
      const data = await response.json();
      return data as T;

    } catch (error) {
      // Gérer les erreurs de timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw createError.networkError(
          `Timeout: l'API Brevo n'a pas répondu dans les ${this.timeout}ms`,
          error
        );
      }

      // Re-throw les erreurs déjà formatées
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      // Erreur inconnue
      throw createError.networkError(
        `Erreur lors de l'appel à l'API Brevo: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  // ========================================================================
  // CAMPAGNES EMAIL
  // ========================================================================

  /**
   * Récupère toutes les campagnes email
   *
   * GET /emailCampaigns
   */
  async getCampaigns(params?: {
    type?: 'classic' | 'trigger' | 'automated';
    status?: 'draft' | 'sent' | 'archive' | 'queued' | 'suspended' | 'inProcess';
    limit?: number;
    offset?: number;
  }): Promise<BrevoCampaignsListResponse> {
    const queryParams = new URLSearchParams();

    // IMPORTANT: Ajouter statistics=globalStats pour récupérer les vraies statistiques
    queryParams.append('statistics', 'globalStats');

    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `/emailCampaigns?${queryParams.toString()}`;

    return this.makeRequest<BrevoCampaignsListResponse>('GET', endpoint);
  }

  /**
   * Récupère une campagne email par son ID
   *
   * GET /emailCampaigns/{campaignId}
   */
  async getCampaign(campaignId: number): Promise<BrevoCampaignResponse> {
    // IMPORTANT: Ajouter statistics=globalStats pour récupérer les vraies statistiques
    return this.makeRequest<BrevoCampaignResponse>('GET', `/emailCampaigns/${campaignId}?statistics=globalStats`);
  }

  /**
   * Crée une nouvelle campagne email
   *
   * POST /emailCampaigns
   */
  async createCampaign(payload: CreateEmailCampaignPayload): Promise<{ id: number }> {
    // Mapper le payload vers le format Brevo
    const brevoPayload = {
      name: payload.name,
      subject: payload.subject,
      sender: payload.sender || {
        name: process.env.BREVO_DEFAULT_SENDER_NAME || 'Onpoint Business Cloud',
        email: process.env.BREVO_DEFAULT_SENDER_EMAIL || 'noreply@onpointbusinesscloud.com'
      },
      htmlContent: payload.htmlContent,
      templateId: payload.templateId,
      scheduledAt: payload.scheduledAt,
      recipients: payload.recipientLists ? {
        listIds: payload.recipientLists
      } : undefined,
      params: payload.utmParams
    };

    return this.makeRequest<{ id: number }>('POST', '/emailCampaigns', brevoPayload);
  }

  /**
   * Met à jour une campagne email
   *
   * PUT /emailCampaigns/{campaignId}
   */
  async updateCampaign(
    campaignId: number,
    payload: Partial<CreateEmailCampaignPayload>
  ): Promise<void> {
    const brevoPayload = {
      name: payload.name,
      subject: payload.subject,
      sender: payload.sender,
      htmlContent: payload.htmlContent,
      scheduledAt: payload.scheduledAt
    };

    await this.makeRequest('PUT', `/emailCampaigns/${campaignId}`, brevoPayload);
  }

  /**
   * Supprime une campagne email
   *
   * DELETE /emailCampaigns/{campaignId}
   */
  async deleteCampaign(campaignId: number): Promise<void> {
    await this.makeRequest('DELETE', `/emailCampaigns/${campaignId}`);
  }

  /**
   * Envoie une campagne email immédiatement
   *
   * POST /emailCampaigns/{campaignId}/sendNow
   */
  async sendCampaignNow(campaignId: number): Promise<void> {
    await this.makeRequest('POST', `/emailCampaigns/${campaignId}/sendNow`);
  }

  /**
   * Teste une campagne email (envoie à des adresses de test)
   *
   * POST /emailCampaigns/{campaignId}/sendTest
   */
  async sendTestCampaign(campaignId: number, emails: string[]): Promise<void> {
    await this.makeRequest('POST', `/emailCampaigns/${campaignId}/sendTest`, {
      emailTo: emails
    });
  }

  // ========================================================================
  // EMAILS TRANSACTIONNELS
  // ========================================================================

  /**
   * Envoie un email transactionnel
   *
   * POST /smtp/email
   */
  async sendTransactionalEmail(
    payload: SendTransactionalEmailPayload
  ): Promise<{ messageId: string }> {
    return this.makeRequest<{ messageId: string }>('POST', '/smtp/email', payload);
  }

  // ========================================================================
  // CONTACTS
  // ========================================================================

  /**
   * Récupère un contact par email
   *
   * GET /contacts/{email}
   */
  async getContact(email: string): Promise<BrevoContact> {
    const encodedEmail = encodeURIComponent(email);
    return this.makeRequest<BrevoContact>('GET', `/contacts/${encodedEmail}`);
  }

  /**
   * Crée ou met à jour un contact
   *
   * POST /contacts
   */
  async createOrUpdateContact(contact: {
    email: string;
    attributes?: Record<string, unknown>;
    listIds?: number[];
    updateEnabled?: boolean;
  }): Promise<{ id: number }> {
    return this.makeRequest<{ id: number }>('POST', '/contacts', contact);
  }

  /**
   * Met à jour un contact existant
   *
   * PUT /contacts/{email}
   */
  async updateContact(
    email: string,
    updates: {
      attributes?: Record<string, unknown>;
      listIds?: number[];
      unlinkListIds?: number[];
    }
  ): Promise<void> {
    const encodedEmail = encodeURIComponent(email);
    await this.makeRequest('PUT', `/contacts/${encodedEmail}`, updates);
  }

  /**
   * Supprime un contact
   *
   * DELETE /contacts/{email}
   */
  async deleteContact(email: string): Promise<void> {
    const encodedEmail = encodeURIComponent(email);
    await this.makeRequest('DELETE', `/contacts/${encodedEmail}`);
  }

  // ========================================================================
  // TEMPLATES
  // ========================================================================

  /**
   * Récupère tous les templates email
   *
   * GET /smtp/templates
   */
  async getTemplates(params?: {
    templateStatus?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ count: number; templates: BrevoTemplate[] }> {
    const queryParams = new URLSearchParams();

    if (params?.templateStatus !== undefined) {
      queryParams.append('templateStatus', params.templateStatus.toString());
    }
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `/smtp/templates?${queryParams.toString()}`;

    return this.makeRequest('GET', endpoint);
  }

  /**
   * Récupère un template par son ID
   *
   * GET /smtp/templates/{templateId}
   */
  async getTemplate(templateId: number): Promise<BrevoTemplate> {
    return this.makeRequest<BrevoTemplate>('GET', `/smtp/templates/${templateId}`);
  }

  // ========================================================================
  // LISTES DE CONTACTS
  // ========================================================================

  /**
   * Récupère toutes les listes de contacts
   *
   * GET /contacts/lists
   */
  async getLists(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ count: number; lists: Array<{ id: number; name: string }> }> {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `/contacts/lists?${queryParams.toString()}`;

    return this.makeRequest('GET', endpoint);
  }

  /**
   * Crée une nouvelle liste de contacts
   *
   * POST /contacts/lists
   */
  async createList(name: string, folderId?: number): Promise<{ id: number }> {
    return this.makeRequest<{ id: number }>('POST', '/contacts/lists', {
      name,
      folderId
    });
  }
}

// ========================================================================
// INSTANCE SINGLETON (optionnel)
// ========================================================================

let brevoClientInstance: BrevoClient | null = null;

/**
 * Récupère l'instance singleton du client Brevo
 */
export function getBrevoClient(): BrevoClient {
  if (!brevoClientInstance) {
    brevoClientInstance = new BrevoClient();
  }
  return brevoClientInstance;
}

/**
 * Crée une nouvelle instance du client Brevo avec une config personnalisée
 */
export function createBrevoClient(config?: {
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
}): BrevoClient {
  return new BrevoClient(config);
}
