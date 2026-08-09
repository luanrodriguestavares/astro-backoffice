'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
    permissionLabels,
    roleDescriptions,
    roleLabel,
} from '@/components/team/invite-member';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/custom-select';
import { Icon } from '@/components/ui/icon';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { showToast } from '@/components/ui/toast';
import type { InvitableRole, OrganizationMember } from '@/lib/api/types';

export function MemberRoleEditor({
    member,
    roles,
}: {
    member: OrganizationMember;
    roles: InvitableRole[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<InvitableRole['code']>(
        member.role as InvitableRole['code'],
    );
    const selected = roles.find((role) => role.code === selectedRole);

    function openEditor() {
        setSelectedRole(member.role as InvitableRole['code']);
        setOpen(true);
    }

    function close() {
        if (!loading) setOpen(false);
    }

    async function save() {
        if (selectedRole === member.role) return close();
        setLoading(true);
        const response = await fetch(`/api/team/members/${encodeURIComponent(member.id)}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ role: selectedRole }),
        });
        const body = (await response.json()) as { detail?: string };
        setLoading(false);
        if (!response.ok) {
            showToast({
                tone: 'error',
                description: body.detail ?? 'Não foi possível alterar o acesso deste membro.',
            });
            return;
        }
        setOpen(false);
        showToast({
            tone: 'success',
            title: 'Acesso atualizado',
            description: `${member.name} agora possui o perfil ${roleLabel(selectedRole)}.`,
        });
        router.refresh();
    }

    return (
        <>
            <Button
                type="button"
                variant="icon"
                aria-label={`Editar acesso de ${member.name}`}
                title="Editar tipo de acesso"
                onClick={openEditor}
                className="size-8"
            >
                <Icon name="edit" className="size-3.5" />
            </Button>
            <Modal
                open={open}
                onClose={close}
                labelledBy="member-role-editor-title"
                maxWidth="max-w-lg"
            >
                <ModalHeader
                    eyebrow="Permissões"
                    title="Alterar tipo de acesso"
                    description={`${member.name} · ${member.email}`}
                    titleId="member-role-editor-title"
                    onClose={close}
                />

                <ModalBody>
                <div>
                    <label className="text-[13px] font-semibold">
                        Perfil
                        <div className="mt-2">
                            <CustomSelect
                                name="role"
                                value={selectedRole}
                                disabled={loading}
                                onValueChange={(value) =>
                                    setSelectedRole(value as InvitableRole['code'])
                                }
                                options={roles.map((role) => ({
                                    value: role.code,
                                    label: roleLabel(role.code),
                                }))}
                            />
                        </div>
                    </label>

                    {selected && (
                        <div className="mt-4 rounded-2xl border border-brand/12 bg-brand-soft/35 p-4">
                            <p className="text-[12px] font-semibold text-brand-strong">
                                {roleDescriptions[selected.code]}
                            </p>
                            <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.12em] text-muted">
                                Permissões deste perfil
                            </p>
                            <ul className="mt-2 flex flex-wrap gap-1.5">
                                {selected.permissions.map((permission) => (
                                    <li
                                        key={permission}
                                        className="rounded-full border border-brand/12 bg-white/60 px-2.5 py-1 text-[10px] text-foreground"
                                    >
                                        {permissionLabels[permission] ?? permission}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                </ModalBody>

                <ModalFooter>
                    <Button type="button" variant="secondary" disabled={loading} onClick={close}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        disabled={loading || selectedRole === member.role}
                        onClick={save}
                    >
                        {loading ? 'Salvando...' : 'Salvar acesso'}
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
