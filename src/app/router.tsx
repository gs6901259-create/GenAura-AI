import { createBrowserRouter, RouterProvider, Navigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CreatorsPage, CreatorDetailPage } from '@/features/creators';
import { DiscoveryPage, ShortlistPage } from '@/features/discovery';
import { BriefsPage, BriefNewPage, BriefDetailPage } from '@/features/briefs';
import { ProjectsPage, ProjectDetailPage } from '@/features/projects';
import { CreatorStudioPage } from '@/features/studio/CreatorStudioPage';
import { AdminVerificationQueue } from '@/features/admin/AdminVerificationQueue';
import { SettingsPage } from '@/features/settings';
import { Button } from '@/components/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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

/**
 * Application router — owned by Member 1 (Team Lead).
 * Feature owners: do NOT add routes here directly.
 * Open a PR with your route requirements and the Team Lead will integrate.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Dashboard
      { index: true, element: <DashboardPage /> },

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

      // Settings
      { path: 'settings', element: <SettingsPage /> },

      // Catch-all
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
