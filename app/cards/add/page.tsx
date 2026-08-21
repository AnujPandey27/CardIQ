"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
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

const MANUAL_VALUE = "__manual__";

const BANKS: BankOption[] = [
  {
    name: "HDFC Bank",
    cards: [
      {
        name: "Infinia",
        variants: [
          {
            name: "Infinia",
            networks: ["Visa", "Mastercard"],
          },
          {
            name: "Infinia (Metal Edition)",
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Diners Club Black",
        variants: [
          {
            name: "Diners Club Black",
            networks: ["Diners Club"],
          },
          {
            name: "Diners Club Black Metal Edition",
            networks: ["Diners Club"],
          },
        ],
      },
      {
        name: "Regalia Gold",
        variants: [
          {
            name: "Regalia Gold",
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Regalia",
        variants: [
          {
            name: "Regalia",
            networks: ["Visa", "Mastercard"],
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
            networks: ["Visa", "Mastercard"],
          },
        ],
      },
      {
        name: "Sapphiro",
        variants: [
          {
            name: "Sapphiro Visa",
            networks: ["Visa"],
          },
          {
            name: "Sapphiro Mastercard",
            networks: ["Mastercard"],
          },
          {
            name: "Sapphiro American Express",
            networks: ["American Express"],
          },
          {
            name: "Sapphiro RuPay",
            networks: ["RuPay"],
          },
        ],
      },
      {
        name: "Rubyx",
        variants: [
          {
            name: "Rubyx Visa",
            networks: ["Visa"],
          },
          {
            name: "Rubyx Mastercard",
            networks: ["Mastercard"],
          },
          {
            name: "Rubyx American Express",
            networks: ["American Express"],
          },
          {
            name: "Rubyx RuPay",
            networks: ["RuPay"],
          },
        ],
      },
      {
        name: "Coral",
        variants: [
          {
            name: "Coral Visa",
            networks: ["Visa"],
          },
          {
            name: "Coral Mastercard",
            networks: ["Mastercard"],
          },
          {
            name: "Coral American Express",
            networks: ["American Express"],
          },
          {
            name: "Coral RuPay",
            networks: ["RuPay"],
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
            name: "Airtel Axis Bank",
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
          {
            name: "ELITE Advantage",
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
          {
            name: "PRIME Advantage",
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
          {
            name: "SimplyCLICK Advantage",
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
      {
        name: "PULSE",
        variants: [
          {
            name: "PULSE",
            networks: ["Mastercard"],
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
            name: "Membership Rewards Credit Card",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "Platinum Travel",
        variants: [
          {
            name: "Platinum Travel Credit Card",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "Platinum",
        variants: [
          {
            name: "Platinum Card",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "Gold",
        variants: [
          {
            name: "Gold Card",
            networks: ["American Express"],
          },
        ],
      },
      {
        name: "SmartEarn",
        variants: [
          {
            name: "SmartEarn Credit Card",
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
        name: "FIRST Wealth",
        variants: [
          {
            name: "Wealth",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "FIRST Select",
        variants: [
          {
            name: "Select",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "FIRST Millennia",
        variants: [
          {
            name: "Millennia",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "FIRST WOW!",
        variants: [
          {
            name: "WOW!",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "FIRST Private",
        variants: [
          {
            name: "Private",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Ashva",
        variants: [
          {
            name: "Ashva Metal",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Mayura",
        variants: [
          {
            name: "Mayura Metal",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "FIRST SWYP",
        variants: [
          {
            name: "SWYP",
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
        name: "Indulge",
        variants: [
          {
            name: "Indulge",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Pinnacle",
        variants: [
          {
            name: "Pinnacle",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "Legend",
        variants: [
          {
            name: "Legend Visa",
            networks: ["Visa"],
          },
          {
            name: "Legend Mastercard",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "EazyDiner",
        variants: [
          {
            name: "EazyDiner Signature",
            networks: ["Visa"],
          },
          {
            name: "EazyDiner Platinum",
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
        name: "White",
        variants: [
          {
            name: "White Signature",
            networks: ["Visa"],
          },
          {
            name: "White Reserve",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Zen",
        variants: [
          {
            name: "Zen Signature",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "League",
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
        name: "RESERV",
        variants: [
          {
            name: "RESERV",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "ELITE+",
        variants: [
          {
            name: "ELITE+",
            networks: ["Mastercard"],
          },
        ],
      },
      {
        name: "SELECT",
        variants: [
          {
            name: "SELECT",
            networks: ["Mastercard"],
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
      {
        name: "Signet",
        variants: [
          {
            name: "Signet",
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
        name: "Classic",
        variants: [
          {
            name: "RuPay Classic",
            networks: ["RuPay"],
          },
          {
            name: "Mastercard Standard",
            networks: ["Mastercard"],
          },
          {
            name: "Visa Classic",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Gold",
        variants: [
          {
            name: "Mastercard Gold",
            networks: ["Mastercard"],
          },
          {
            name: "Visa Gold",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Platinum",
        variants: [
          {
            name: "RuPay Platinum",
            networks: ["RuPay"],
          },
          {
            name: "Mastercard Platinum",
            networks: ["Mastercard"],
          },
          {
            name: "Visa Platinum",
            networks: ["Visa"],
          },
        ],
      },
      {
        name: "Select / World / Signature",
        variants: [
          {
            name: "RuPay Select",
            networks: ["RuPay"],
          },
          {
            name: "Mastercard World",
            networks: ["Mastercard"],
          },
          {
            name: "Visa Signature",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },

  {
    name: "Punjab National Bank",
    cards: [
      {
        name: "RuPay Platinum",
        variants: [
          {
            name: "RuPay Platinum",
            networks: ["RuPay"],
          },
        ],
      },
      {
        name: "RuPay Select / Millennial",
        variants: [
          {
            name: "RuPay Select",
            networks: ["RuPay"],
          },
          {
            name: "RuPay Millennial",
            networks: ["RuPay"],
          },
        ],
      },
      {
        name: "Rakshak",
        variants: [
          {
            name: "Rakshak RuPay Platinum",
            networks: ["RuPay"],
          },
          {
            name: "Rakshak RuPay Select",
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
      {
        name: "SuperX",
        variants: [
          {
            name: "SuperX",
            networks: ["Visa"],
          },
          {
            name: "SuperX Plus",
            networks: ["Visa"],
          },
        ],
      },
    ],
  },
];

const FALLBACK_NETWORKS = [
  "Visa",
  "Mastercard",
  "American Express",
  "RuPay",
  "Diners Club",
  "Other",
];

function AddCardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editCardId = searchParams.get("edit");
  const isEditMode = Boolean(editCardId);

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
    () =>
      availableCards.find(
        (item) => item.name === cardName
      ),
    [availableCards, cardName]
  );

  const availableVariants = selectedCard?.variants ?? [];

  const selectedVariant = useMemo(
    () =>
      availableVariants.find(
        (item) => item.name === variant
      ),
    [availableVariants, variant]
  );

  const isManualBank = bank === MANUAL_VALUE;
  const isManualCard = cardName === MANUAL_VALUE;
  const isManualVariant = variant === MANUAL_VALUE;

  const availableNetworks = selectedVariant?.networks ?? [];

  const hasSingleKnownNetwork =
    !isManualVariant &&
    availableNetworks.length === 1;

  useEffect(() => {
    const loadPage = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, name, country_code, currency_code"
          )
          .eq("user_id", user.id)
          .order("is_default", {
            ascending: false,
          })
          .order("created_at", {
            ascending: true,
          })
          .limit(1)
          .maybeSingle();

      if (profileError || !profile) {
        console.error(profileError);

        setError(
          "Unable to load your current profile."
        );

        setLoadingProfile(false);
        return;
      }

      setProfileId(profile.id);
      setProfileName(profile.name);
      setCountryCode(profile.country_code);
      setCurrencyCode(profile.currency_code);

      if (!editCardId) {
        setLoadingProfile(false);
        return;
      }

      const { data: card, error: cardError } =
        await supabase
          .from("cards")
          .select(
            "id, name, bank, network, variant, profile_id"
          )
          .eq("id", editCardId)
          .eq("user_id", user.id)
          .eq("profile_id", profile.id)
          .maybeSingle();

      if (cardError || !card) {
        console.error(cardError);

        setError(
          "Unable to load the card you are trying to edit."
        );

        setLoadingProfile(false);
        return;
      }

      setNetwork(card.network);

      const catalogueBank = BANKS.find(
        (item) => item.name === card.bank
      );

      if (!catalogueBank) {
        setBank(MANUAL_VALUE);
        setManualBank(card.bank);

        setCardName(MANUAL_VALUE);
        setManualCardName(card.name);

        setVariant(MANUAL_VALUE);
        setManualVariant(card.variant ?? "");

        setLoadingProfile(false);
        return;
      }

      setBank(card.bank);

      const catalogueCard = catalogueBank.cards.find(
        (item) => item.name === card.name
      );

      if (!catalogueCard) {
        setCardName(MANUAL_VALUE);
        setManualCardName(card.name);

        setVariant(MANUAL_VALUE);
        setManualVariant(card.variant ?? "");

        setLoadingProfile(false);
        return;
      }

      setCardName(card.name);

      const catalogueVariant =
        catalogueCard.variants.find(
          (item) => item.name === card.variant
        );

      if (!catalogueVariant) {
        setVariant(MANUAL_VALUE);
        setManualVariant(card.variant ?? "");
      } else {
        setVariant(catalogueVariant.name);
      }

      setLoadingProfile(false);
    };

    loadPage();
  }, [editCardId, router]);

  const handleBankChange = (value: string) => {
    setBank(value);
    setCardName("");
    setVariant("");
    setNetwork("");
    setManualBank(
      value === MANUAL_VALUE ? manualBank : ""
    );
    setManualCardName("");
    setManualVariant("");
  };

  const handleCardChange = (value: string) => {
    setCardName(value);
    setVariant("");
    setNetwork("");
    setManualCardName(
      value === MANUAL_VALUE
        ? manualCardName
        : ""
    );
    setManualVariant("");
  };

  const handleVariantChange = (value: string) => {
    setVariant(value);

    if (value === MANUAL_VALUE) {
      setNetwork("");
      return;
    }

    const option = availableVariants.find(
      (item) => item.name === value
    );

    if (option?.networks.length === 1) {
      setNetwork(option.networks[0]);
    } else {
      setNetwork("");
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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

    const finalNetwork = hasSingleKnownNetwork
      ? availableNetworks[0]
      : network.trim();

    if (!profileId) {
      setError(
        "Your profile could not be identified. Please try again."
      );
      return;
    }

    if (!finalBank) {
      setError(
        "Please select or enter a bank / issuer."
      );
      return;
    }

    if (!finalCardName) {
      setError(
        "Please select or enter a card name."
      );
      return;
    }

    if (!finalVariant) {
      setError(
        "Please select or enter a card variant."
      );
      return;
    }

    if (!finalNetwork) {
      setError(
        "Please select or enter the card network."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (isEditMode && editCardId) {
        const { error: updateError } =
          await supabase
            .from("cards")
            .update({
              name: finalCardName,
              bank: finalBank,
              network: finalNetwork,
              variant: finalVariant,
            })
            .eq("id", editCardId)
            .eq("user_id", user.id)
            .eq("profile_id", profileId);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } =
          await supabase
            .from("cards")
            .insert({
              user_id: user.id,
              profile_id: profileId,
              name: finalCardName,
              bank: finalBank,
              network: finalNetwork,
              variant: finalVariant,
            });

        if (insertError) {
          throw insertError;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : isEditMode
            ? "Something went wrong while updating your card."
            : "Something went wrong while adding your card."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading your profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="mb-5 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
          >
            ← Back to dashboard
          </button>

          <p className="mb-2 text-sm font-medium text-[var(--muted)]">
            Your card portfolio
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {isEditMode
              ? "Edit card"
              : "Add a card"}
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            {isEditMode
              ? "Update your card details and keep your CardIQ portfolio accurate."
              : "Add your credit card to CardIQ so we can track it and help identify the best value for your spending."}
          </p>
        </div>

        {/* Current Profile */}
        <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {isEditMode
              ? "Editing card in"
              : "Adding card to"}
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">
                {profileName}
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                {countryCode} · {currencyCode}
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Current profile
            </span>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-6">
            {/* Bank */}
            <div>
              <label
                htmlFor="bank"
                className="mb-2 block text-sm font-semibold"
              >
                Bank / issuer
              </label>

              {!isManualBank ? (
                <select
                  id="bank"
                  value={bank}
                  onChange={(event) =>
                    handleBankChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                  required
                >
                  <option value="">
                    Select bank / issuer
                  </option>

                  {BANKS.map((item) => (
                    <option
                      key={item.name}
                      value={item.name}
                    >
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
                      setManualBank(
                        event.target.value
                      )
                    }
                    placeholder="Enter bank / issuer"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
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
                      setManualCardName("");
                      setManualVariant("");
                    }}
                    className="mt-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
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
                className="mb-2 block text-sm font-semibold"
              >
                Card name
              </label>

              {!isManualCard ? (
                <select
                  id="cardName"
                  value={cardName}
                  onChange={(event) =>
                    handleCardChange(
                      event.target.value
                    )
                  }
                  disabled={
                    !bank || isManualBank
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  required
                >
                  <option value="">
                    {isManualBank
                      ? "Enter bank manually"
                      : bank
                        ? "Select card name"
                        : "Select a bank first"}
                  </option>

                  {availableCards.map((card) => (
                    <option
                      key={card.name}
                      value={card.name}
                    >
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
                      setManualCardName(
                        event.target.value
                      )
                    }
                    placeholder="Enter card name"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setCardName("");
                      setManualCardName("");
                      setVariant("");
                      setManualVariant("");
                      setNetwork("");
                    }}
                    className="mt-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
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
                className="mb-2 block text-sm font-semibold"
              >
                Card variant
              </label>

              {!isManualVariant ? (
                <select
                  id="variant"
                  value={variant}
                  onChange={(event) =>
                    handleVariantChange(
                      event.target.value
                    )
                  }
                  disabled={
                    !cardName || isManualCard
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  required
                >
                  <option value="">
                    {isManualCard
                      ? "Enter card name manually"
                      : cardName
                        ? "Select card variant"
                        : "Select a card name first"}
                  </option>

                  {availableVariants.map(
                    (item) => (
                      <option
                        key={item.name}
                        value={item.name}
                      >
                        {item.name}
                      </option>
                    )
                  )}

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
                      setManualVariant(
                        event.target.value
                      )
                    }
                    placeholder="Enter card variant"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setVariant("");
                      setManualVariant("");
                      setNetwork("");
                    }}
                    className="mt-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    ← Choose from listed variants
                  </button>
                </>
              )}
            </div>

            {/* Network */}
            {hasSingleKnownNetwork ? (
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Network
                </label>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-muted)] px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                  {availableNetworks[0]}
                </div>

                <p className="mt-2 text-xs text-[var(--muted)]">
                  CardIQ automatically determined the network from the selected
                  card variant.
                </p>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="network"
                  className="mb-2 block text-sm font-semibold"
                >
                  Network
                </label>

                <select
                  id="network"
                  value={network}
                  onChange={(event) =>
                    setNetwork(event.target.value)
                  }
                  disabled={
                    !variant && !isManualVariant
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  required
                >
                  <option value="">
                    {variant || isManualVariant
                      ? "Select network"
                      : "Select a card variant first"}
                  </option>

                  {availableNetworks.length > 0
                    ? availableNetworks.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )
                    : FALLBACK_NETWORKS.map(
                        (item) => (
                          <option
                            key={item}
                            value={item}
                          >
                            {item}
                          </option>
                        )
                      )}

                  {!availableNetworks.includes(
                    "Other"
                  ) && (
                    <option value="Other">
                      Other
                    </option>
                  )}
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard")
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                {saving
                  ? isEditMode
                    ? "Saving changes..."
                    : "Adding card..."
                  : isEditMode
                    ? "Save changes"
                    : "Add card"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function AddCardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
          <p className="text-sm text-[var(--muted)]">
            Loading CardIQ...
          </p>
        </main>
      }
    >
      <AddCardForm />
    </Suspense>
  );
}
