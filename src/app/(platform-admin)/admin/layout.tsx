import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/platform-admin/admin-shell';
import { apiFetch, AstroApiError } from '@/lib/api/server';
import type { CurrentUser, PlatformAdminSession } from '@/lib/api/types';

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
    const user = await adminContext();
    return <AdminShell user={user}>{children}</AdminShell>;
}

async function adminContext() {
    try {
        const [, user] = await Promise.all([
            apiFetch<PlatformAdminSession>('/api/v1/admin/session'),
            apiFetch<CurrentUser>('/api/v1/auth/me'),
        ]);
        return user;
    } catch (error) {
        if (error instanceof AstroApiError && error.problem.status === 401)
            redirect('/login?expired=1');
        if (error instanceof AstroApiError && [403, 404].includes(error.problem.status))
            redirect('/login?error=Acesso administrativo necessário.');
        throw error;
    }
}
