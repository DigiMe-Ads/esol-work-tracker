import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { PeopleProvider } from '@/context/PeopleContext';
import { ToastProvider } from '@/context/ToastContext';
import { AppShell } from '@/components/layout/AppShell';
import { Loading } from '@/components/ui/States';

// Each page is its own chunk, so the first screen only downloads what it shows.
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const MyTasksPage = lazy(() => import('@/pages/MyTasksPage'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const AllTasksPage = lazy(() => import('@/pages/AllTasksPage'));
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <PeopleProvider>
            <Suspense fallback={<div className="center-screen"><Loading /></div>}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<AppShell />}>
                  <Route index element={<MyTasksPage />} />
                  <Route path="account" element={<AccountPage />} />
                </Route>
                <Route element={<AppShell adminOnly />}>
                  <Route path="team" element={<TeamPage />} />
                  <Route path="all" element={<AllTasksPage />} />
                  <Route path="employees" element={<EmployeesPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </PeopleProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
