import Link from "next/link";

import { GatewayCenter } from "@/components/gateways/gateway-center";
import type { GatewayDefinition } from "@/components/gateways/gateway-connect-card";
import { Icon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { apiFetch } from "@/lib/api/server";
import type { GatewayConnection, Payment } from "@/lib/api/types";

const gateways: GatewayDefinition[] = [
  {
    provider: "stripe",
    name: "Stripe",
    description: "Cartões, Pix e assinaturas recorrentes.",
    initials: "S",
    color: "bg-[#635bff]",
    logo: "/gateways/stripe.png",
    logoFill: true,
    methods: ["Cartão", "Pix", "Recorrência"],
  },
  {
    provider: "mercado_pago",
    name: "Mercado Pago",
    description: "Cartões, boleto, Pix e carteira digital.",
    initials: "MP",
    color: "bg-[#009ee3]",
    logo: "/gateways/mercado-pago.png",
    methods: ["Cartão", "Pix", "Boleto"],
  },
  {
    provider: "abacate_pay",
    name: "AbacatePay",
    description: "Checkout transparente para Pix e boleto.",
    initials: "A",
    color: "bg-[#79b943]",
    logo: "/gateways/abacate-pay.png",
    methods: ["Pix", "Boleto"],
  },
  {
    provider: "mock",
    name: "Ambiente de testes",
    description: "Simule pagamentos antes de entrar em produção.",
    initials: "M",
    color: "bg-[#55576b]",
    logo: "/gateways/astro-mock.png",
    logoFill: true,
    methods: ["Sandbox", "Testes"],
  },
];

export default async function GatewaysPage() {
  const [connections, payments] = await Promise.all([
    apiFetch<GatewayConnection[]>("/api/v1/gateway-connections"),
    apiFetch<Payment[]>("/api/v1/payments"),
  ]);

  const active = connections.filter(
    (connection) => connection.status === "active",
  );
  const current = period(payments, 0);
  const previous = period(payments, 30);
  const currency = payments[0]?.currency ?? "BRL";

  return (
    <>
      <PageHeader
        eyebrow="Pagamentos"
        title="Gateways"
        description="Conecte e gerencie seus provedores de pagamento em um só lugar."
      />

      <section
        aria-label="Indicadores dos gateways"
        className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Gateways conectados"
          value={String(active.length)}
          detail={`${connections.length} configurações no total`}
          icon="plug"
          href="#gateways-conectados"
        />
        <StatCard
          label="Transações (30 dias)"
          value={formatNumber(current.total)}
          detail="Tentativas processadas"
          icon="chart"
          href="/payments"
          change={variation(current.total, previous.total)}
        />
        <StatCard
          label="Volume processado"
          value={money(current.volume, currency)}
          detail="Pagamentos aprovados"
          icon="card"
          href="/payments"
          tone="success"
          change={variation(current.volume, previous.volume)}
        />
        <StatCard
          label="Taxa de aprovação"
          value={percentage(current.rate)}
          detail="Média dos últimos 30 dias"
          icon="check"
          href="/payments"
          tone="warning"
          change={(current.rate - previous.rate) * 100}
        />
      </section>

      <GatewayCenter
        connections={connections}
        payments={payments}
        gateways={gateways}
      />
    </>
  );
}

const successful = new Set(["approved", "paid", "captured", "succeeded"]);

function period(payments: Payment[], offset: number) {
  const end = Date.now() - offset * 86_400_000;
  const start = end - 30 * 86_400_000;
  const selected = payments.filter((item) => {
    const time = new Date(item.createdAt).getTime();
    return time >= start && time < end;
  });
  const approved = selected.filter((item) => successful.has(item.status));

  return {
    total: selected.length,
    volume: approved.reduce(
      (sum, item) => sum + (item.capturedMinor || item.amountMinor),
      0,
    ),
    rate: selected.length ? approved.length / selected.length : 0,
  };
}

function variation(current: number, previous: number) {
  if (!previous) return current ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value / 100);
}

function percentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}
