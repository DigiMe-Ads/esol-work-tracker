import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usersApi } from '@/api/users';
import type { Person } from '@/types';
import { useAuth } from './AuthContext';

interface PeopleState {
  people: Person[];
  byId: Map<string, Person>;
  nameOf: (id: string | null | undefined) => string;
  refresh: () => Promise<void>;
}

const PeopleContext = createContext<PeopleState | null>(null);

/** Colleague names, loaded once per sign-in and shared by every screen (assignees, comment authors). */
export function PeopleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);

  const refresh = useCallback(async () => {
    setPeople(await usersApi.people());
  }, []);

  useEffect(() => {
    if (user) refresh().catch(() => setPeople([]));
    else setPeople([]);
  }, [user?.id, refresh]);

  const value = useMemo(() => {
    const byId = new Map(people.map((p) => [p.id, p]));
    return { people, byId, nameOf: (id: string | null | undefined) => (id ? byId.get(id)?.full_name ?? 'Former user' : 'Unassigned'), refresh };
  }, [people, refresh]);

  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

export function usePeople(): PeopleState {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error('usePeople must be used inside PeopleProvider');
  return ctx;
}
