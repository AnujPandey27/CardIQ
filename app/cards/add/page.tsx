"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";

export default function AddCardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [network, setNetwork] = useState("");
  const [variant, setVariant] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    if (!name.trim() || !bank.trim() || !network.trim()) {
      setError("Please fill in the card name, bank and network.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { error: insertError } = await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          name: name.trim(),
          bank: bank.trim(),
          network: network.trim(),
          variant: variant.trim() || null,
        });

      if (insertError) {
        throw insertError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while adding your card."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <CardIQHeader />

      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mb-5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Back to dashboard
          </button>

          <p className="mb-2 text-sm font-medium text-slate-500">
            Your card portfolio
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Add a card
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Add your credit card to CardIQ so we can help you track it and
            identify the best value for your spending.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-6">
            {/* Card Name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Card name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. HDFC Infinia"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </div>

            {/* Bank */}
            <div>
              <label
                htmlFor="bank"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Bank / issuer
              </label>

              <input
                id="bank"
                type="text"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="e.g. HDFC Bank"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </div>

            {/* Network */}
            <div>
              <label
                htmlFor="network"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Network
              </label>

              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              >
                <option value="">Select network</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="American Express">American Express</option>
                <option value="RuPay">RuPay</option>
                <option value="Diners Club">Diners Club</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Variant */}
            <div>
              <label
                htmlFor="variant"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Card variant
                <span className="ml-2 font-normal text-slate-400">
                  Optional
                </span>
              </label>

              <input
                id="variant"
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. Infinia Metal"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Adding card..." : "Add card"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
