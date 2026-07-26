import { DevelopmentFeature } from '@/components/ui/development-feature';

export default function ShippingPage() {
    return (
        <DevelopmentFeature
            eyebrow="Operação"
            title="Frete"
            description="A próxima etapa da operação do Astro já está em construção."
            kicker="O próximo capítulo da operação"
            headline="Do checkout à porta do cliente."
            body="Estamos desenhando uma experiência de frete simples de configurar, clara para quem compra e integrada a toda a sua operação."
            features={['Zonas de entrega', 'Tarifas flexíveis', 'Prazos claros']}
        />
    );
}
