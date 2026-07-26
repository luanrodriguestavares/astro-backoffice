import { DevelopmentFeature } from '@/components/ui/development-feature';

export default function InventoryPage() {
    return (
        <DevelopmentFeature
            eyebrow="Catálogo"
            title="Estoque"
            description="O controle de estoque chegará junto com o suporte completo a produtos físicos."
            kicker="Preparando a operação física"
            headline="Seu estoque, sempre sob controle."
            body="Estamos construindo uma visão simples dos seus saldos, reservas e movimentações, integrada aos pedidos e aos futuros fluxos de entrega."
            features={['Saldos em tempo real', 'Reservas automáticas', 'Alertas de estoque']}
        />
    );
}
