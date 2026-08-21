"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";

type CardOption = {
  name: string;
  variant?: string;
  network?: string;
};

type BankOption = {
  name: string;
  cards: CardOption[];
};

/*
 * CardIQ card catalogue
 *
 * This is intentionally kept separate from the UI so that later we can
 * move this into a database and make it country/region specific.
 */
const BANKS: BankOption[] = [
  {
    name: "HDFC Bank",
    cards: [
      { name: "HDFC Infinia", variant: "Infinia Metal", network: "Visa" },
      { name: "HDFC Infinia", variant: "Infinia Metal", network: "Mastercard" },
      { name: "HDFC Diners Club Black", variant: "Diners Club Black", network: "Diners Club" },
      { name: "HDFC Regalia Gold", variant: "Regalia Gold", network: "Visa" },
      { name: "HDFC Regalia", variant: "Regalia", network: "Visa" },
      { name: "HDFC Millennia", variant: "Millennia", network: "Visa" },
      { name: "HDFC Swiggy", variant: "Swiggy", network: "Mastercard" },
      { name: "HDFC Tata Neu Infinity", variant: "Tata Neu Infinity", network: "Visa" },
      { name: "HDFC Tata Neu Plus", variant: "Tata Neu Plus", network: "Visa" },
    ],
  },
  {
    name: "ICICI Bank",
    cards: [
      { name: "ICICI Emeralde Private Metal", variant: "Emeralde Private Metal", network: "Mastercard" },
      { name: "ICICI Emeralde", variant: "Emeralde", network: "Mastercard" },
      { name: "ICICI Sapphiro", variant: "Sapphiro", network: "Visa" },
      { name: "ICICI Rubyx", variant: "Rubyx", network: "Visa" },
      { name: "ICICI Coral", variant: "Coral", network: "Visa" },
      { name: "ICICI Amazon Pay", variant: "Amazon Pay", network: "Visa" },
    ],
  },
  {
    name: "Axis Bank",
    cards: [
      { name: "Axis Atlas", variant: "Atlas", network: "Visa" },
      { name: "Axis Magnus", variant: "Magnus", network: "Mastercard" },
      { name: "Axis Magnus Burgundy", variant: "Magnus Burgundy", network: "Mastercard" },
      { name: "Axis Reserve", variant: "Reserve", network: "Visa" },
      { name: "Axis Select", variant: "Select", network: "Visa" },
      { name: "Axis Airtel", variant: "Airtel", network: "Mastercard" },
      { name: "Axis ACE", variant: "ACE", network: "Visa" },
      { name: "Axis My Zone", variant: "My Zone", network: "Visa" },
    ],
  },
  {
    name: "SBI Card",
    cards: [
      { name: "SBI Card ELITE", variant: "ELITE", network: "Visa" },
      { name: "SBI Card PRIME", variant: "PRIME", network: "Visa" },
      { name: "SBI Card CASHBACK", variant: "CASHBACK", network: "Mastercard" },
      { name: "SBI Card SimplyCLICK", variant: "SimplyCLICK", network: "Visa" },
      { name: "SBI Card SimplySAVE", variant: "SimplySAVE", network: "Visa" },
      { name: "SBI Card Miles ELITE", variant: "Miles ELITE", network: "Visa" },
      { name: "SBI Card Miles PRIME", variant: "Miles PRIME", network: "Visa" },
    ],
  },
  {
    name: "American Express",
    cards: [
      { name: "American Express Membership Rewards Credit Card", variant: "MRCC", network: "American Express" },
      { name: "American Express Platinum Travel Credit Card", variant: "Platinum Travel", network: "American Express" },
      { name: "American Express Platinum Card", variant: "Platinum", network: "American Express" },
      { name: "American Express SmartEarn Credit Card", variant: "SmartEarn", network: "American Express" },
    ],
  },
  {
    name: "IDFC FIRST Bank",
    cards: [
      { name: "IDFC FIRST Wealth", variant: "Wealth", network: "Visa" },
      { name: "IDFC FIRST Select", variant: "Select", network: "Visa" },
      { name: "IDFC FIRST Millennia", variant: "Millennia", network: "Visa" },
      { name: "IDFC FIRST WOW", variant: "WOW", network: "Visa" },
    ],
  },
  {
    name: "IndusInd Bank",
    cards: [
      { name: "IndusInd EazyDiner", variant: "EazyDiner", network: "Visa" },
      { name: "IndusInd Legend", variant: "Legend", network: "Visa" },
      { name: "IndusInd Pinnacle", variant: "Pinnacle", network: "Visa" },
      { name: "IndusInd Indulge", variant: "Indulge", network: "Visa" },
    ],
  },
  {
    name: "Kotak Mahindra Bank",
    cards: [
      { name: "Kotak White Reserve", variant: "White Reserve", network: "Visa" },
      { name: "Kotak White", variant: "White", network: "Visa" },
      { name: "Kotak Zen Signature", variant: "Zen Signature", network: "Visa" },
      { name: "Kotak League Platinum", variant: "League Platinum", network: "Visa" },
    ],
  },
  {
    name: "RBL Bank",
    cards: [
      { name: "RBL World Safari", variant: "World Safari", network: "Mastercard" },
      { name: "RBL World Safari", variant: "World Safari", network: "Visa" },
      { name: "RBL ShopRite", variant: "ShopRite", network: "Mastercard" },
      { name: "RBL BookMyShow", variant: "BookMyShow", network: "Mastercard" },
    ],
  },
  {
    name: "AU Small Finance Bank",
    cards: [
      { name: "AU Zenith+", variant: "Zenith+", network: "Visa" },
      { name: "AU Zenith", variant: "Zenith", network: "Visa" },
      { name: "AU Xcite", variant: "Xcite", network: "Visa" },
      { name: "AU Ixigo", variant: "Ixigo", network: "Visa" },
    ],
  },
  {
    name: "HSBC India",
    cards: [
      { name: "HSBC Premier Credit Card", variant: "Premier", network: "Visa" },
      { name: "HSBC TravelOne", variant: "TravelOne", network: "Visa" },
      { name: "HSBC Cashback Credit Card", variant: "Cashback", network: "Visa" },
      { name: "HSBC Live+", variant: "Live+", network: "Visa" },
    ],
  },
  {
    name: "Standard Chartered",
    cards: [
      { name: "Standard Chartered Ultimate", variant: "Ultimate", network: "Visa" },
      { name: "Standard Chartered EaseMyTrip", variant: "EaseMyTrip", network: "Visa" },
      { name: "Standard Chartered Smart", variant: "Smart", network: "Visa" },
      { name: "Standard Chartered Manhattan", variant: "Manhattan", network: "Mastercard" },
    ],
  },
  {
    name: "YES BANK",
    cards: [
      { name: "YES FIRST Exclusive", variant: "FIRST Exclusive", network: "Mastercard" },
      { name: "YES FIRST Preferred", variant: "FIRST Preferred", network: "Mastercard" },
      { name: "YES Prosperity Edge", variant: "Prosperity Edge", network: "Visa" },
    ],
  },
  {
    name: "Federal Bank",
    cards: [
      { name: "Federal Bank Celesta", variant: "Celesta", network: "Visa" },
      { name: "Federal Bank Imperio", variant: "Imperio", network: "Visa" },
    ],
  },
  {
    name: "Bank of Baroda",
    cards: [
      { name: "Bank of Baroda Eterna", variant: "Eterna", network: "Visa" },
      { name: "Bank of Baroda Premier", variant: "Premier", network: "Visa" },
    ],
  },
  {
    name: "Canara Bank",
    cards: [
      { name: "Canara Bank World", variant: "World", network: "Mastercard" },
      { name: "Canara Bank RuPay Select", variant: "RuPay Select", network: "RuPay" },
    ],
  },
  {
    name: "Punjab National Bank",
    cards: [
      { name: "PNB Select", variant: "Select", network: "Visa" },
      { name: "PNB RuPay Select", variant: "RuPay Select", network: "RuPay" },
    ],
  },
  {
    name: "DBS Bank India",
    cards: [
      { name: "DBS Vantage", variant: "Vantage", network: "Visa" },
      { name: "DBS Spark", variant: "Spark", network: "Visa" },
    ],
  },
];

const NETWORKS = [
  "Visa",
  "Mastercard",
  "American Express",
  "RuPay",
  "Diners Club",
  "Other",
];

const MANUAL_VALUE = "__manual__";

export default function AddCardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profileId, setProfileId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");

  const [bank, setBank] = useState("");
  const [manualBank, setManualBank] = useState("");

  const [cardSelection, setCardSelection] = useState("");
  const [manualCardName, setManualCardName] = useState("");

  const [network, setNetwork] = useState("");
  const [variant, setVariant] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, country_code, currency_code")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (profileError) {
        console.error(profileError);
        setError("Unable to load your current profile.");
        setLoadingProfile(false);
        return;
      }

      if (!profile) {
        setError("No profile is available for your account.");
        setLoadingProfile(false);
        return;
      }

      setProfileId(profile.id);
      setProfileName(profile.name);
      setCountryCode(profile.country_code);
      setCurrencyCode(profile.currency_code);

      setLoadingProfile(false);
    };

    loadProfile();
  }, [router, supabase]);

  const selectedBank = useMemo(
    () => BANKS.find((item) => item.name === bank),
    [bank]
  );

  const availableCards = selectedBank?.cards ?? [];

  const isManualBank = bank === MANUAL_VALUE;
  const isManualCard = cardSelection === MANUAL_VALUE;

  const handleBankChange = (value: string) => {
    setBank(value);
    setCardSelection("");
    setManualCardName("");
    setVariant("");
    setNetwork("");
  };

  const handleCardChange = (value: string) => {
    setCardSelection(value);

    if (value === MANUAL_VALUE) {
      setManualCardName("");
      setVariant("");
      setNetwork("");
      return;
    }

    const selectedCard = availableCards[Number(value)];

    if (!selectedCard) {
      return;
    }

    setNetwork(selectedCard.network ?? "");
    setVariant(selectedCard.variant ?? "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");

    const finalBank = isManualBank ? manualBank.trim() : bank;

    const finalCardName = isManualCard
      ? manualCardName.trim()
      : availableCards[Number(cardSelection)]?.name?.trim();

    const finalVariant = isManualCard
      ? variant.trim()
      : availableCards[Number(cardSelection)]?.variant?.trim();

    if (!profileId) {
      setError("Your profile could not be identified. Please try again.");
      return;
    }

    if (!finalBank) {
      setError("Please select or enter a bank / issuer.");
      return;
    }

    if (!finalCardName) {
      setError("Please select or enter your card name / variant.");
      return;
    }

    if (!network) {
      setError("Please select the card network.");
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

      const { error: insertError } = await supabase.from("cards").insert({
        user_id: user.id,
        profile_id: profileId,
        name: finalCardName,
        bank: finalBank,
        network,
        variant: finalVariant || null,
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

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-slate-900">
        <p className="text-sm text-slate-500">
          Loading your profile...
        </p>
      </main>
    );
  }

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
            Add your credit card to CardIQ so we can track it and help you
            identify the best value for your spending.
          </p>
        </div>

        {/* Current profile */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Adding card to
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">
                {profileName}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {countryCode} · {currencyCode}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Current profile
            </span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-6">
            {/* Bank */}
            <div>
              <label
                htmlFor="bank"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Bank / issuer
              </label>

              {!isManualBank ? (
                <select
                  id="bank"
                  value={bank}
                  onChange={(e) => handleBankChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  required
                >
                  <option value="">Select bank / issuer</option>

                  {BANKS.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}

                  <option value={MANUAL_VALUE}>
                    Not listed — add manually
                  </option>
                </select>
              ) : (
                <>
                  <input
                    id="manual-bank"
                    type="text"
                    value={manualBank}
                    onChange={(e) => setManualBank(e.target.value)}
                    placeholder="Enter bank / issuer name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setBank("");
                      setManualBank("");
                      setCardSelection("");
                      setManualCardName("");
                      setVariant("");
                      setNetwork("");
                    }}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    ← Choose from listed banks
                  </button>
                </>
              )}
            </div>

            {/* Card */}
            <div>
              <label
                htmlFor="card"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Card name / variant
              </label>

              {!isManualCard ? (
                <select
                  id="card"
                  value={cardSelection}
                  onChange={(e) => handleCardChange(e.target.value)}
                  disabled={!bank}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  required
                >
                  <option value="">
                    {bank
                      ? "Select card"
                      : "Select a bank / issuer first"}
                  </option>

                  {availableCards.map((card, index) => (
                    <option key={`${card.name}-${card.variant}-${index}`} value={String(index)}>
                      {card.name}
                      {card.variant ? ` — ${card.variant}` : ""}
                    </option>
                  ))}

                  {bank && (
                    <option value={MANUAL_VALUE}>
                      Not listed — add manually
                    </option>
                  )}
                </select>
              ) : (
                <>
                  <input
                    id="manual-card"
                    type="text"
                    value={manualCardName}
                    onChange={(e) => setManualCardName(e.target.value)}
                    placeholder="e.g. HDFC Infinia"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setCardSelection("");
                      setManualCardName("");
                      setVariant("");
                      setNetwork("");
                    }}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    ← Choose from listed cards
                  </button>
                </>
              )}
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

                {NETWORKS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {!isManualCard && network && (
                <p className="mt-2 text-xs text-slate-400">
                  CardIQ has pre-selected the network based on the selected
                  card. You can change it if your physical card has a
                  different network.
                </p>
              )}
            </div>

            {/* Manual variant */}
            {isManualCard && (
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
                  placeholder="e.g. Metal, Signature, Premium"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            )}

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
