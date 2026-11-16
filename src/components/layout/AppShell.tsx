import { Suspense } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { CheckSquare, LayoutDashboard, ListChecks, LogOut, UserCog, Users, KeyRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Badges';
import { Loading } from '@/components/ui/States';

const link = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' active' : ''}`;

/** Sidebar + page area for signed-in users. Admin-only routes pass adminOnly. */
export function AppShell({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user, isAdmin, signOut, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="center-screen"><Loading /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="shell">
      <nav className="sidebar glass" aria-label="Main">
        <div className="brand">
          <div className="brand-mark"><CheckSquare size={20} /></div>
          <div>
            <div className="brand-name">Work Tracker</div>
            <div className="brand-sub">ESOL Premier Campus</div>
          </div>
        </div>
        <NavLink to="/" end className={link}><ListChecks size={18} /><span>My Tasks</span></NavLink>
        {isAdmin && (
          <>
            <div className="nav-label">Admin</div>
            <NavLink to="/team" className={link}><LayoutDashboard size={18} /><span>Team Overview</span></NavLink>
            <NavLink to="/all" className={link}><Users size={18} /><span>All Tasks</span></NavLink>
            <NavLink to="/employees" className={link}><UserCog size={18} /><span>Employees</span></NavLink>
          </>
        )}
        <NavLink to="/account" className={link}><KeyRound size={18} /><span>Account</span></NavLink>
        <div className="sidebar-user">
          <Avatar name={user.full_name} />
          <div className="who">
            <div className="small strong">{user.full_name}</div>
            <div className="small faint">{user.job_title || (isAdmin ? 'Admin' : 'Employee')}</div>
          </div>
          <button className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </nav>
      <main className="main">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
