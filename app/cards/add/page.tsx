"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CardIQHeader from "@/components/CardIQHeader";

type VariantOption = {
  name: string;
  networks: string[];
};

type CardOption = {
  name: string;
  variants: VariantOption[];
};

type BankOption = {
  name: string;
  cards: CardOption[];
};

const BANKS: BankOption[] = [
  {
    name: "HDFC Bank",
    cards: [
      {
        name: "Infinia",
        variants: [
          {
            name: "Infinia Metal",
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Diners Club Black",
        variants: [
          {
            name: "Diners Club Black Metal",
            networks: ["Diners Club"],
          },
        ],
      },
      {
        name: "Regalia Gold",
        variants: [
          {
            name: "Regalia Gold",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Regalia",
        variants: [
          {
            name: "Regalia",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Millennia",
        variants: [
          {
            name: "Millennia",
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Swiggy",
        variants: [
          {
            name: "Swiggy",
            networks: ["Mastercard", "Visa"],
          },
        ],
      },
      {
        name: "Tata Neu Infinity",
        variants: [
          {
            name: "Tata Neu Infinity",
            networks: ["Visa", "RuPay"],
          },
        ],
      },
      {
        name: "Tata Neu Plus",
        variants: [
          {
            name: "Tata Neu Plus",
            networks: ["Visa", "RuPay"],
          },
        ],
      },
    ],
  },

  {
    name: "ICICI Bank",
    cards: [
      {
        name: "Emeralde Private",
        variants: [
          {
            name: "Emeralde Private Metal",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "Emeralde",
        variants: [
          {
            name: "Emeralde",
            networks: ["Mastercard", "Visa"],
          },
        ],
      },
      {
        name: "Sapphiro",
        variants: [
          {
            name: "Sapphiro",
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Rubyx",
        variants: [
          {
            name: "Rubyx",
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Coral",
        variants: [
          {
            name: "Coral",
            networks: ["Visa", "RuPay"],
          },
        ],
      },
      {
        name: "Amazon Pay",
        variants: [
          {
            name: "Amazon Pay",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Axis Bank",
    cards: [
      {
        name: "Atlas",
        variants: [
          {
            name: "Atlas",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Magnus",
        variants: [
          {
            name: "Magnus",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "Magnus Burgundy",
        variants: [
          {
            name: "Magnus Burgundy",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "Reserve",
        variants: [
          {
            name: "Reserve",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Select",
        variants: [
          {
            name: "Select",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Airtel",
        variants: [
          {
            name: "Airtel",
            networks: ["Mastercard", "Visa"],
          },
        ],
      },
      {
        name: "ACE",
        variants: [
          {
            name: "ACE",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "My Zone",
        variants: [
          {
            name: "My Zone",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "SBI Card",
    cards: [
      {
        name: "ELITE",
        variants: [
          {
            name: "ELITE",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "PRIME",
        variants: [
          {
            name: "PRIME",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "CASHBACK",
        variants: [
          {
            name: "CASHBACK",
            networks: ["Mastercard", "Visa"],
          },
        ],
      },
      {
        name: "SimplyCLICK",
        variants: [
          {
            name: "SimplyCLICK",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "SimplySAVE",
        variants: [
          {
            name: "SimplySAVE",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Miles",
        variants: [
          {
            name: "Miles ELITE",
            networks: ["Visa"],
          },
          {
            name: "Miles PRIME",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "American Express",
    cards: [
      {
        name: "Membership Rewards",
        variants: [
          {
            name: "MRCC",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "Platinum Travel",
        variants: [
          {
            name: "Platinum Travel",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "Platinum",
        variants: [
          {
            name: "Platinum",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "SmartEarn",
        variants: [
          {
            name: "SmartEarn",
            networks: ["American Express"],
          },
        ],
      },
    ],
  },

  {
    name: "IDFC FIRST Bank",
    cards: [
      {
        name: "Wealth",
        variants: [
          {
            name: "Wealth",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Select",
        variants: [
          {
            name: "Select",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Millennia",
        variants: [
          {
            name: "Millennia",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "WOW",
        variants: [
          {
            name: "WOW",
            networks: ["Visa"],
        },
      ],
      },
    ],
  },

  {
    name: "IndusInd Bank",
    cards: [
      {
        name: "EazyDiner",
        variants: [
          {
            name: "EazyDiner",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Legend",
        variants: [
          {
            name: "Legend",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Pinnacle",
        variants: [
          {
            name: "Pinnacle",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Indulge",
        variants: [
          {
            name: "Indulge",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Kotak Mahindra Bank",
    cards: [
      {
        name: "White Reserve",
        variants: [
          {
            name: "White Reserve",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "White",
        variants: [
          {
            name: "White",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Zen Signature",
        variants: [
          {
            name: "Zen Signature",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "League Platinum",
        variants: [
          {
            name: "League Platinum",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "RBL Bank",
    cards: [
      {
        name: "World Safari",
        variants: [
          {
            name: "World Safari",
            networks: ["Mastercard", "Visa"],
          },
        ],
      },
      {
        name: "ShopRite",
        variants: [
          {
            name: "ShopRite",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "BookMyShow",
        variants: [
          {
            name: "BookMyShow",
            networks: ["Mastercard"],
          },
        ],
      },
    ],
  },

  {
    name: "AU Small Finance Bank",
    cards: [
      {
        name: "Zenith",
        variants: [
          {
            name: "Zenith",
            networks: ["Visa"],
          },
          {
            name: "Zenith+",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Xcite",
        variants: [
          {
            name: "Xcite",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Ixigo",
        variants: [
          {
            name: "Ixigo",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "HSBC India",
    cards: [
      {
        name: "Premier",
        variants: [
          {
            name: "Premier",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "TravelOne",
        variants: [
          {
            name: "TravelOne",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Cashback",
        variants: [
          {
            name: "Cashback",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Live+",
        variants: [
          {
            name: "Live+",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Standard Chartered",
    cards: [
      {
        name: "Ultimate",
        variants: [
          {
            name: "Ultimate",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "EaseMyTrip",
        variants: [
          {
            name: "EaseMyTrip",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Smart",
        variants: [
          {
            name: "Smart",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Manhattan",
        variants: [
          {
            name: "Manhattan",
            networks: ["Mastercard"],
          },
        ],
      },
    ],
  },

  {
    name: "YES BANK",
    cards: [
      {
        name: "FIRST",
        variants: [
          {
            name: "FIRST Exclusive",
            networks: ["Mastercard"],
          },
          {
            name: "FIRST Preferred",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "Prosperity",
        variants: [
          {
            name: "Prosperity Edge",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Federal Bank",
    cards: [
      {
        name: "Celesta",
        variants: [
          {
            name: "Celesta",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Imperio",
        variants: [
          {
            name: "Imperio",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Bank of Baroda",
    cards: [
      {
        name: "Eterna",
        variants: [
          {
            name: "Eterna",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Premier",
        variants: [
          {
            name: "Premier",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Canara Bank",
    cards: [
      {
        name: "World",
        variants: [
          {
            name: "World",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "RuPay Select",
        variants: [
          {
            name: "RuPay Select",
            networks: ["RuPay"],
          },
        ],
      },
    ],
  },

  {
    name: "Punjab National Bank",
    cards: [
      {
        name: "Select",
        variants: [
          {
            name: "Select",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "RuPay Select",
        variants: [
          {
            name: "RuPay Select",
            networks: ["RuPay"],
          },
        ],
      },
    ],
  },

  {
    name: "DBS Bank India",
    cards: [
      {
        name: "Vantage",
        variants: [
          {
            name: "Vantage",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Spark",
        variants: [
          {
            name: "Spark",
            networks: ["Visa"],
          },
        ],
      },
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

  const [cardName, setCardName] = useState("");
  const [manualCardName, setManualCardName] = useState("");

  const [variant, setVariant] = useState("");
  const [manualVariant, setManualVariant] = useState("");

  const [network, setNetwork] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedBank = useMemo(
    () => BANKS.find((item) => item.name === bank),
    [bank]
  );

  const availableCards = selectedBank?.cards ?? [];

  const selectedCard = useMemo(
    () => availableCards.find((item) => item.name === cardName),
    [availableCards, cardName]
  );

  const availableVariants = selectedCard?.variants ?? [];

  const selectedVariant = useMemo(
    () =>
      availableVariants.find((item) => item.name === variant),
    [availableVariants, variant]
  );

  const isManualBank = bank === MANUAL_VALUE;
  const isManualCard = cardName === MANUAL_VALUE;
  const isManualVariant = variant === MANUAL_VALUE;

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

      if (profileError || !profile) {
        console.error(profileError);
        setError("Unable to load your current profile.");
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

  const handleBankChange = (value: string) => {
    setBank(value);
    setCardName("");
    setVariant("");
    setNetwork("");
    setManualCardName("");
    setManualVariant("");
  };

  const handleCardChange = (value: string) => {
    setCardName(value);
    setVariant("");
    setNetwork("");
    setManualVariant("");

    if (value === MANUAL_VALUE) {
      setManualCardName("");
    }
  };

  const handleVariantChange = (value: string) => {
    setVariant(value);

    if (value === MANUAL_VALUE) {
      setNetwork("");
      setManualVariant("");
      return;
    }

    const variantOption = availableVariants.find(
      (item) => item.name === value
    );

    if (variantOption && variantOption.networks.length === 1) {
      setNetwork(variantOption.networks[0]);
    } else {
      setNetwork("");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const finalBank = isManualBank
      ? manualBank.trim()
      : bank.trim();

    const finalCardName = isManualCard
      ? manualCardName.trim()
      : cardName.trim();

    const finalVariant = isManualVariant
      ? manualVariant.trim()
      : variant.trim();

    if (!profileId) {
      setError("Your profile could not be identified. Please try again.");
      return;
    }

    if (!finalBank) {
      setError("Please select or enter a bank / issuer.");
      return;
    }

    if (!finalCardName) {
      setError("Please select or enter a card name.");
      return;
    }

    if (!finalVariant) {
      setError("Please select or enter a card variant.");
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

      const { error: insertError } = await supabase
        .from("cards")
        .insert({
          user_id: user.id,
          profile_id: profileId,
          name: finalCardName,
          bank: finalBank,
          network,
          variant: finalVariant,
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

        {/* Current Profile */}
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
                  onChange={(event) =>
                    handleBankChange(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
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
                    onChange={(event) =>
                      setManualBank(event.target.value)
                    }
                    placeholder="Enter bank / issuer name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setBank("");
                      setManualBank("");
                      setCardName("");
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

            {/* Card Name */}
            <div>
              <label
                htmlFor="cardName"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Card name
              </label>

              {!isManualCard ? (
                <select
                  id="cardName"
                  value={cardName}
                  onChange={(event) =>
                    handleCardChange(event.target.value)
                  }
                  disabled={!bank || isManualBank}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  required
                >
                  <option value="">
                    {isManualBank
                      ? "Enter your bank manually"
                      : bank
                        ? "Select card name"
                        : "Select a bank / issuer first"}
                  </option>

                  {availableCards.map((card) => (
                    <option key={card.name} value={card.name}>
                      {card.name}
                    </option>
                  ))}

                  {bank && !isManualBank && (
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
                    onChange={(event) =>
                      setManualCardName(event.target.value)
                    }
                    placeholder="Enter card name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setCardName("");
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

            {/* Card Variant */}
            <div>
              <label
                htmlFor="variant"
                className="mb-2 block text-sm font-semibold text-slate-900"
              >
                Card variant
              </label>

              {!isManualVariant ? (
                <select
                  id="variant"
                  value={variant}
                  onChange={(event) =>
                    handleVariantChange(event.target.value)
                  }
                  disabled={!cardName || isManualCard}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                  required
                >
                  <option value="">
                    {isManualCard
                      ? "Enter your card name manually"
                      : cardName
                        ? "Select card variant"
                        : "Select a card name first"}
                  </option>

                  {availableVariants.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}

                  {cardName && !isManualCard && (
                    <option value={MANUAL_VALUE}>
                      Not listed — add manually
                    </option>
                  )}
                </select>
              ) : (
                <>
                  <input
                    id="manual-variant"
                    type="text"
                    value={manualVariant}
                    onChange={(event) =>
                      setManualVariant(event.target.value)
                    }
                    placeholder="Enter card variant"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setVariant("");
                      setManualVariant("");
                      setNetwork("");
                    }}
                    className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                  >
                    ← Choose from listed variants
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
                onChange={(event) =>
                  setNetwork(event.target.value)
                }
                disabled={!variant && !isManualVariant}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                required
              >
                <option value="">
                  {variant || isManualVariant
                    ? "Select network"
                    : "Select a card variant first"}
                </option>

                {(selectedVariant?.networks ?? NETWORKS).map(
                  (item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  )
                )}

                {selectedVariant &&
                  selectedVariant.networks.length > 0 && (
                    <option value="Other">
                      Other
                    </option>
                  )}
              </select>
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
