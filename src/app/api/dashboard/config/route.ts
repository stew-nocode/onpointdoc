import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserProfile } from '@/services/users/server';
import {
  getDashboardConfigurationFromDB,
  getAllDashboardConfigurations,
  updateDashboardConfiguration,
  resetDashboardConfigurationToDefaults,
} from '@/services/dashboard/config';
import type { DashboardConfigurationInput } from '@/types/dashboard';
import { handleApiError } from '@/lib/errors/handlers';

/**
 * GET /api/dashboard/config?role=direction
 * 
 * Récupère la configuration dashboard pour un rôle spécifique
 * Accessible à tous les utilisateurs authentifiés (pour afficher le dashboard)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') as 'direction' | 'manager' | 'agent' | 'admin' | null;

    if (role) {
      // Récupérer une configuration spécifique
      const config = await getDashboardConfigurationFromDB(role);
      return NextResponse.json(config);
    }

    // Récupérer toutes les configurations (admin uniquement)
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const allConfigs = await getAllDashboardConfigurations();
    return NextResponse.json(allConfigs);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/dashboard/config
 * 
 * Met à jour ou crée une configuration dashboard
 * Admin uniquement
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const input: DashboardConfigurationInput = {
      role: body.role,
      sections: body.sections || {},
    };

    // Validation basique
    if (!input.role || !['direction', 'manager', 'agent', 'admin'].includes(input.role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    const updatedConfig = await updateDashboardConfiguration(input, profile.id);
    return NextResponse.json(updatedConfig);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/dashboard/config?role=direction
 * 
 * Réinitialise une configuration aux valeurs par défaut
 * Admin uniquement
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role') as 'direction' | 'manager' | 'agent' | 'admin' | null;

    if (!role || !['direction', 'manager', 'agent', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    await resetDashboardConfigurationToDefaults(role, profile.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

