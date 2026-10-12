/**
 * GenAura AI — Production Application Router
 * ===========================================
 * Registers all application routes including Animated Welcome & Login,
 * Aura Assistant, Notifications, Help & Support, and core marketplace features.
 */
import { createBrowserRouter, RouterProvider, Navigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CreatorsPage, CreatorDetailPage } from '@/features/creators';
import { DiscoveryPage, ShortlistPage } from '@/features/discovery';
import { BriefsPage, BriefNewPage, BriefDetailPage } from '@/features/briefs';
import { ProjectsPage, ProjectDetailPage } from '@/features/projects';
import { DealRoomOverview, DealDetailPage } from '@/features/dealRoom';
import { CreatorStudioPage } from '@/features/studio/CreatorStudioPage';
import { AdminVerificationQueue } from '@/features/admin/AdminVerificationQueue';
import { SettingsPage } from '@/features/settings';
import { WelcomeLoginPage } from '@/features/auth/WelcomeLoginPage';
import { AuraAssistantPage } from '@/features/assistant/AuraAssistantPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { HelpPage } from '@/features/help/HelpPage';
import { Button } from '@/components/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';

function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
    ? error.message
    : 'An unexpected application error occurred.';

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-xl font-bold text-navy-50 mb-2">Something went wrong</h1>
      <p className="text-sm text-navy-400 max-w-md mb-6">{message}</p>
      <div className="flex items-center gap-3">
        <Button variant="secondary" icon={RefreshCw} onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button onClick={() => (window.location.href = '/')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}

function DashboardOrWelcome() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }
  return <DashboardPage />;
}

const router = createBrowserRouter([
  // Full-screen Welcome and Authentication Portal
  {
    path: '/welcome',
    element: <WelcomeLoginPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/login',
    element: <WelcomeLoginPage />,
    errorElement: <RouteErrorBoundary />,
  },

  // Main Application Shell
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Dashboard (or redirect to welcome if unauthenticated)
      { index: true, element: <DashboardOrWelcome /> },

      // Creators (Member 2)
      { path: 'creators',     element: <CreatorsPage /> },
      { path: 'creators/:id', element: <CreatorDetailPage /> },

      // Creator Studio & Verification Engine (Core Flow)
      { path: 'studio',             element: <CreatorStudioPage /> },
      { path: 'verification',       element: <CreatorStudioPage /> },
      { path: 'admin/verification', element: <AdminVerificationQueue /> },

      // Discovery & Shortlist (Member 3)
      { path: 'discovery', element: <DiscoveryPage /> },
      { path: 'shortlist', element: <ShortlistPage /> },

      // Briefs (Member 4)
      { path: 'briefs',          element: <BriefsPage /> },
      { path: 'briefs/new',      element: <BriefNewPage /> },
      { path: 'briefs/:id',      element: <BriefDetailPage /> },
      { path: 'briefs/:id/edit', element: <BriefDetailPage /> },

      // Projects (Member 5)
      { path: 'projects',     element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },

      // Smart Deal Room
      { path: 'deals',     element: <DealRoomOverview /> },
      { path: 'deals/:id', element: <DealDetailPage /> },

      // Aura AI Assistant
      { path: 'assistant', element: <AuraAssistantPage /> },

      // Notifications
      { path: 'notifications', element: <NotificationsPage /> },

      // Settings
      { path: 'settings', element: <SettingsPage /> },

      // Help & Support
      { path: 'help', element: <HelpPage /> },

      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
