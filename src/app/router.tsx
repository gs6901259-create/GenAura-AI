import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CreatorsPage, CreatorDetailPage } from '@/features/creators';
import { DiscoveryPage, ShortlistPage } from '@/features/discovery';
import { BriefsPage, BriefNewPage, BriefDetailPage } from '@/features/briefs';
import { ProjectsPage, ProjectDetailPage } from '@/features/projects';
import { SettingsPage } from '@/features/settings';

/**
 * Application router — owned by Member 1 (Team Lead).
 * Feature owners: do NOT add routes here directly.
 * Open a PR with your route requirements and the Team Lead will integrate.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Dashboard
      { index: true, element: <DashboardPage /> },

      // Creators (Member 2)
      { path: 'creators',     element: <CreatorsPage /> },
      { path: 'creators/:id', element: <CreatorDetailPage /> },

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
