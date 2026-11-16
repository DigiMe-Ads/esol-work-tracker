import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ListChecks, Pencil, Power, Trash2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { Avatar } from '@/components/ui/Badges';
import { EmptyState, Loading } from '@/components/ui/States';
import { EmployeeFormModal } from '@/components/admin/EmployeeFormModal';
import { PasswordResetModal } from '@/components/admin/PasswordResetModal';
import type { User } from '@/types';

/** Admin: create employees and their logins, edit, deactivate, reset passwords, delete. */
export default function EmployeesPage() {
  const { user: me } = useAuth();
  const { users, save, setActive, resetPassword, remove } = useEmployees();
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);

  const confirmDelete = (u: User) => {
    const msg = `Delete ${u.full_name}? Their login is removed for good. Tasks they own stay but become unassigned.`;
    if (window.confirm(msg)) remove(u);
  };

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Employees <span className="accent">&amp; logins</span></h1>
          <p>Create accounts, update roles and manage access.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setEditing('new')}>
          <UserPlus size={17} /> Add employee
        </button>
      </header>

      {!users ? (
        <Loading />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" />
      ) : (
        <div className="table-wrap glass">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hide-sm">Username</th>
                <th>Role</th>
                <th className="hide-sm">Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} style={u.is_active ? undefined : { opacity: 0.6 }}>
                    <td>
                      <div className="row" style={{ gap: 10 }}>
                        <Avatar name={u.full_name} />
                        <div>
                          <div className="strong">{u.full_name}{self && <span className="faint small"> (you)</span>}</div>
                          <div className="small muted">{u.job_title || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted hide-sm">@{u.username}</td>
                    <td><span className={`role-tag${u.role === 'admin' ? ' role-tag--admin' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Employee'}</span></td>
                    <td className="small hide-sm">{u.is_active ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="actions">
                        <Link className="icon-btn" to={`/all?assignee=${u.id}`} title="View tasks" aria-label="View tasks"><ListChecks size={16} /></Link>
                        <button className="icon-btn" onClick={() => setEditing(u)} title="Edit" aria-label="Edit"><Pencil size={16} /></button>
                        <button className="icon-btn" onClick={() => setResetting(u)} title="Reset password" aria-label="Reset password"><KeyRound size={16} /></button>
                        {!self && (
                          <>
                            <button className="icon-btn" onClick={() => setActive(u, !u.is_active)} title={u.is_active ? 'Deactivate' : 'Activate'} aria-label={u.is_active ? 'Deactivate' : 'Activate'}>
                              <Power size={16} />
                            </button>
                            <button className="icon-btn" style={{ color: 'var(--danger)' }} onClick={() => confirmDelete(u)} title="Delete" aria-label="Delete"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EmployeeFormModal target={editing} onClose={() => setEditing(null)} onSave={(f) => save(editing!, f)} />
      <PasswordResetModal target={resetting} onClose={() => setResetting(null)} onSave={resetPassword} />
    </>
  );
}
