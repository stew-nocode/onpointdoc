import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

/**
 * Schéma de validation pour la connexion
 */
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

/**
 * Route API pour la connexion
 * 
 * Gère l'authentification côté serveur pour éviter les problèmes CORS.
 * Les cookies sont gérés correctement dans les Route Handlers.
 * 
 * @param request - Requête HTTP contenant email et password
 * @returns Réponse avec les données utilisateur ou une erreur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[API Login] Variables d\'environnement manquantes');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante. Vérifiez les variables d\'environnement.' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Corps de requête invalide' },
        { status: 400 }
      );
    }
    
    // Valider les données d'entrée
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Créer le client Supabase avec gestion des cookies pour Route Handler
    let cookieStore;
    try {
      cookieStore = await cookies();
    } catch (cookieErr) {
      console.error('[API Login] Erreur lors de l\'accès aux cookies:', cookieErr);
      return NextResponse.json(
        { error: 'Erreur lors de l\'accès aux cookies' },
        { status: 500 }
      );
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Dans les Route Handlers, on peut modifier les cookies
            try {
              cookieStore.set(name, value, options);
            } catch (setErr) {
              console.error('[API Login] Erreur lors de la définition du cookie:', setErr);
            }
          },
          remove(name: string, options: CookieOptions) {
            // Dans les Route Handlers, on peut supprimer les cookies
            try {
              cookieStore.delete(name);
            } catch (removeErr) {
              console.error('[API Login] Erreur lors de la suppression du cookie:', removeErr);
            }
          }
        }
      }
    );

    // Tenter la connexion
    console.log('[API Login] Tentative de connexion pour:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('[API Login] Erreur Supabase:', error);
      console.error('[API Login] Code erreur:', error.status);
      console.error('[API Login] Message erreur:', error.message);
      
      // Messages d'erreur plus explicites selon le type d'erreur
      let errorMessage = error.message;
      if (error.status === 400) {
        errorMessage = 'Email ou mot de passe invalide';
      } else if (error.status === 401) {
        errorMessage = 'Identifiants incorrects';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Aucun utilisateur retourné' },
        { status: 401 }
      );
    }

    // Retourner les données utilisateur
    // Les cookies de session sont déjà définis par Supabase SSR
    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email
      }
    });

  } catch (err: any) {
    console.error('[API Login] Erreur inattendue:', err);
    console.error('[API Login] Stack:', err?.stack);
    return NextResponse.json(
      { error: err?.message ?? 'Erreur inattendue lors de la connexion' },
      { status: 500 }
    );
  }
}

