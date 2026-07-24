"use client";

import { Render } from "@puckeditor/core";

import { checkoutBuilderConfig } from "@/components/checkout-builder/config";
import { documentToPuck } from "@/lib/checkout/puck-data";
import type { Checkout, CheckoutDraft } from "@/lib/api/types";

export function CheckoutPreview({ checkout, draft }: { checkout: Checkout; draft: CheckoutDraft }) {
  return (
    <div className="min-h-screen bg-white">
      <div className="fixed right-4 top-4 z-50 rounded-full border border-white/80 bg-[#1d1d2a]/80 px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg backdrop-blur-md">
        Preview · {checkout.name}
      </div>
      <Render config={checkoutBuilderConfig} data={documentToPuck(draft.document)} />
    </div>
  );
}
