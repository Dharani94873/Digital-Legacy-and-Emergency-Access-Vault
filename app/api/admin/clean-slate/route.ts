import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Profile from '@/models/Profile';
import Document from '@/models/Document';
import Folder from '@/models/Folder';
import Nominee from '@/models/Nominee';
import EmergencyRequest from '@/models/EmergencyRequest';
import AuditLog from '@/models/AuditLog';
import Notification from '@/models/Notification';
import BlockchainTransaction from '@/models/BlockchainTransaction';
import Category from '@/models/Category';
import Settings from '@/models/Settings';
import { auth } from '@/lib/auth';

const CLEAN_SLATE_SECRET = 'clean_vault_slate';

async function performCleanSlate() {
  await connectToDatabase();

  const [
    users,
    profiles,
    docs,
    folders,
    nominees,
    requests,
    auditLogs,
    notifications,
    txs,
    categories,
    settings,
  ] = await Promise.all([
    User.deleteMany({}),
    Profile.deleteMany({}),
    Document.deleteMany({}),
    Folder.deleteMany({}),
    Nominee.deleteMany({}),
    EmergencyRequest.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
    BlockchainTransaction.deleteMany({}),
    Category.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  return {
    usersDeleted: users.deletedCount,
    profilesDeleted: profiles.deletedCount,
    documentsDeleted: docs.deletedCount,
    foldersDeleted: folders.deletedCount,
    nomineesDeleted: nominees.deletedCount,
    emergencyRequestsDeleted: requests.deletedCount,
    auditLogsDeleted: auditLogs.deletedCount,
    notificationsDeleted: notifications.deletedCount,
    transactionsDeleted: txs.deletedCount,
    categoriesDeleted: categories.deletedCount,
    settingsDeleted: settings.deletedCount,
  };
}

// GET /api/admin/clean-slate?secret=clean_vault_slate
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    const session = await auth();
    const isAdmin = session?.user && (session.user as { role?: string }).role === 'admin';

    if (!isAdmin && secret !== CLEAN_SLATE_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Provide ?secret=clean_vault_slate to wipe all accounts and data.',
        },
        { status: 401 }
      );
    }

    const report = await performCleanSlate();

    return NextResponse.json({
      success: true,
      message: 'All accounts, profiles, documents, and vault records have been completely wiped. The project is reset to a fresh state.',
      deletedCounts: report,
      nextStep: 'You can now visit /auth/register to create your fresh Vault Owner or Nominee account.',
    });
  } catch (error) {
    console.error('[Clean Slate GET]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset database accounts', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/clean-slate
export async function POST(request: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user && (session.user as { role?: string }).role === 'admin';

    let bodySecret = '';
    try {
      const body = await request.json();
      bodySecret = body?.secret;
    } catch {
      // body empty or not json
    }

    if (!isAdmin && bodySecret !== CLEAN_SLATE_SECRET) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Provide { secret: "clean_vault_slate" } to wipe all accounts and data.',
        },
        { status: 401 }
      );
    }

    const report = await performCleanSlate();

    return NextResponse.json({
      success: true,
      message: 'All accounts, profiles, documents, and vault records have been completely wiped. The project is reset to a fresh state.',
      deletedCounts: report,
      nextStep: 'You can now visit /auth/register to create your fresh Vault Owner or Nominee account.',
    });
  } catch (error) {
    console.error('[Clean Slate POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset database accounts', details: String(error) },
      { status: 500 }
    );
  }
}
