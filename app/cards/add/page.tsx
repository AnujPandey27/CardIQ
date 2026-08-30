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
import {
  useCardIQProfile,
} from "@/components/ProfileProvider";

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

type FeeRule = {
  id: string;
  bank: string;
  card_name: string;
  variant: string | null;
  fee_type: string;
  fee_amount: number;
  fee_currency: string;
  waiver_threshold: number | null;
  waiver_period: string | null;
  waiver_description: string | null;
  applies_to_emi: boolean | null;
  source_name: string | null;
  source_url: string | null;
  verified_at: string | null;
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

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function formatMoney(
  value: number | null,
  currency: string
) {
  if (value === null) {
    return "";
  }

  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function AddCardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const editCardId =
    searchParams.get("edit");

  const isEditMode =
    Boolean(editCardId);

  const {
    activeProfile,
    loadingProfiles,
  } = useCardIQProfile();

  const [bank, setBank] =
    useState("");

  const [manualBank, setManualBank] =
    useState("");

  const [cardName, setCardName] =
    useState("");

  const [manualCardName, setManualCardName] =
    useState("");

  const [variant, setVariant] =
    useState("");

  const [manualVariant, setManualVariant] =
    useState("");

  const [network, setNetwork] =
    useState("");

  const [cardLastFour, setCardLastFour] =
    useState("");

  const [isLifetimeFree, setIsLifetimeFree] =
    useState(false);

  const [anniversaryMonth, setAnniversaryMonth] =
    useState("");

  const [anniversaryYear, setAnniversaryYear] =
    useState("");

  const [annualFee, setAnnualFee] =
    useState("");

  const [
    annualFeeWaiverThreshold,
    setAnnualFeeWaiverThreshold,
  ] = useState("");

  const [defaultAnnualFee, setDefaultAnnualFee] =
    useState("");

  const [
    defaultAnnualFeeWaiverThreshold,
    setDefaultAnnualFeeWaiverThreshold,
  ] = useState("");

  const [feeRule, setFeeRule] =
    useState<FeeRule | null>(null);

  const [loadingCard, setLoadingCard] =
    useState(true);

  const [loadingFeeRule, setLoadingFeeRule] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedBank = useMemo(
    () =>
      BANKS.find(
        (item) =>
          item.name === bank
      ),
    [bank]
  );

  const availableCards =
    selectedBank?.cards ?? [];

  const selectedCard = useMemo(
    () =>
      availableCards.find(
        (item) =>
          item.name === cardName
      ),
    [availableCards, cardName]
  );

  const availableVariants =
    selectedCard?.variants ?? [];

  const selectedVariant = useMemo(
    () =>
      availableVariants.find(
        (item) =>
          item.name === variant
      ),
    [availableVariants, variant]
  );

  const isManualBank =
    bank === MANUAL_VALUE;

  const isManualCard =
    cardName === MANUAL_VALUE;

  const isManualVariant =
    variant === MANUAL_VALUE;

  const availableNetworks =
    selectedVariant?.networks ?? [];

  const hasSingleKnownNetwork =
    !isManualVariant &&
    availableNetworks.length === 1;

  const currentYear =
    new Date().getFullYear();

  const yearOptions = Array.from(
    { length: 31 },
    (_, index) =>
      currentYear - index
  );

  /*
   * Finds an exact variant fee rule first,
   * then falls back to a generic card rule.
   */
  const findMatchingFeeRule = (
    rules: FeeRule[],
    selectedVariantName: string
  ) => {
    const exactVariantRule =
      rules.find(
        (rule) =>
          rule.variant ===
          selectedVariantName
      );

    if (exactVariantRule) {
      return exactVariantRule;
    }

    return (
      rules.find(
        (rule) =>
          rule.variant === null
      ) ?? null
    );
  };

  /*
   * Load issuer fee information.
   */
  const loadFeeRule = async (
    selectedBankName: string,
    selectedCardName: string,
    selectedVariantName: string,
    applyDefaults: boolean
  ) => {
    setLoadingFeeRule(true);

    const supabase =
      createClient();

    const {
      data,
      error: feeError,
    } = await supabase
      .from("card_fee_rules")
      .select(
        "id, bank, card_name, variant, fee_type, fee_amount, fee_currency, waiver_threshold, waiver_period, waiver_description, applies_to_emi, source_name, source_url, verified_at"
      )
      .eq(
        "bank",
        selectedBankName
      )
      .eq(
        "card_name",
        selectedCardName
      )
      .eq(
        "fee_type",
        "renewal"
      );

    if (feeError) {
      console.error(
        "Card fee rule load error:",
        feeError
      );

      setFeeRule(null);
      setDefaultAnnualFee("");
      setDefaultAnnualFeeWaiverThreshold("");
      setLoadingFeeRule(false);
      return;
    }

    const matchingRule =
      findMatchingFeeRule(
        (data ?? []) as FeeRule[],
        selectedVariantName
      );

    setFeeRule(
      matchingRule
    );

    const issuerFee =
      matchingRule
        ? String(
            matchingRule.fee_amount
          )
        : "";

    const issuerWaiver =
      matchingRule?.waiver_threshold !=
      null
        ? String(
            matchingRule.waiver_threshold
          )
        : "";

    setDefaultAnnualFee(
      issuerFee
    );

    setDefaultAnnualFeeWaiverThreshold(
      issuerWaiver
    );

    if (applyDefaults) {
      setAnnualFee(
        issuerFee
      );

      setAnnualFeeWaiverThreshold(
        issuerWaiver
      );
    }

    setLoadingFeeRule(false);
  };

  /*
   * Load existing card and user-specific settings.
   */
  useEffect(() => {
    const loadCard = async () => {
      if (loadingProfiles) {
        return;
      }

      setError("");

      if (!activeProfile?.id) {
        setError(
          "No active profile is available."
        );
        setLoadingCard(false);
        return;
      }

      /*
       * Add mode: nothing to load.
       * Fee defaults are loaded after selections.
       */
      if (!editCardId) {
        setLoadingCard(false);
        return;
      }

      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: card,
        error: cardError,
      } =
        await supabase
          .from("cards")
          .select(
            "id, name, bank, network, variant, card_last_four, profile_id"
          )
          .eq(
            "id",
            editCardId
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "profile_id",
            activeProfile.id
          )
          .maybeSingle();

      if (cardError || !card) {
        console.error(
          "Card load error:",
          cardError
        );

        setError(
          cardError?.message ||
            "Unable to load the card you are trying to edit."
        );

        setLoadingCard(false);
        return;
      }

      setNetwork(
        card.network
      );

      setCardLastFour(
        card.card_last_four ?? ""
      );

      const {
        data: cardSettings,
        error:
          cardSettingsError,
      } =
        await supabase
          .from(
            "card_account_settings"
          )
          .select(
            "is_lifetime_free, anniversary_month, anniversary_year, annual_fee_override, annual_fee_currency, annual_fee_waiver_threshold"
          )
          .eq(
            "card_id",
            card.id
          )
          .eq(
            "user_id",
            user.id
          )
          .eq(
            "profile_id",
            activeProfile.id
          )
          .maybeSingle();

      if (cardSettingsError) {
        console.error(
          "Card account settings load error:",
          cardSettingsError
        );
      }

      if (cardSettings) {
        setIsLifetimeFree(
          cardSettings.is_lifetime_free
        );

        setAnniversaryMonth(
          cardSettings.anniversary_month !=
            null
            ? String(
                cardSettings.anniversary_month
              )
            : ""
        );

        setAnniversaryYear(
          cardSettings.anniversary_year !=
            null
            ? String(
                cardSettings.anniversary_year
              )
            : ""
        );

        /*
         * User overrides are loaded here.
         *
         * If the override is NULL, the fee-rule effect
         * below will populate the issuer default.
         */
        if (
          cardSettings.annual_fee_override !=
          null
        ) {
          setAnnualFee(
            String(
              cardSettings.annual_fee_override
            )
          );
        } else {
          setAnnualFee("");
        }

        if (
          cardSettings.annual_fee_waiver_threshold !=
          null
        ) {
          setAnnualFeeWaiverThreshold(
            String(
              cardSettings.annual_fee_waiver_threshold
            )
          );
        } else {
          setAnnualFeeWaiverThreshold("");
        }
      } else {
        setIsLifetimeFree(false);
        setAnniversaryMonth("");
        setAnniversaryYear("");
        setAnnualFee("");
        setAnnualFeeWaiverThreshold("");
      }

      const catalogueBank =
        BANKS.find(
          (item) =>
            item.name ===
            card.bank
        );

      if (!catalogueBank) {
        setBank(MANUAL_VALUE);
        setManualBank(card.bank);

        setCardName(MANUAL_VALUE);
        setManualCardName(
          card.name
        );

        setVariant(MANUAL_VALUE);
        setManualVariant(
          card.variant ?? ""
        );

        setLoadingCard(false);
        return;
      }

      setBank(card.bank);

      const catalogueCard =
        catalogueBank.cards.find(
          (item) =>
            item.name ===
            card.name
        );

      if (!catalogueCard) {
        setCardName(MANUAL_VALUE);
        setManualCardName(
          card.name
        );

        setVariant(MANUAL_VALUE);
        setManualVariant(
          card.variant ?? ""
        );

        setLoadingCard(false);
        return;
      }

      setCardName(card.name);

      const catalogueVariant =
        catalogueCard.variants.find(
          (item) =>
            item.name ===
            card.variant
        );

      if (!catalogueVariant) {
        setVariant(MANUAL_VALUE);
        setManualVariant(
          card.variant ?? ""
        );
      } else {
        setVariant(
          catalogueVariant.name
        );
      }

      setLoadingCard(false);
    };

    loadCard();
  }, [
    activeProfile?.id,
    editCardId,
    loadingProfiles,
    router,
  ]);

  /*
   * Edit mode:
   *
   * Once the existing card selections are known,
   * load the issuer defaults.
   *
   * Existing user overrides are preserved.
   */
  useEffect(() => {
    if (
      loadingProfiles ||
      !isEditMode ||
      !activeProfile?.id ||
      !bank ||
      isManualBank ||
      !cardName ||
      isManualCard ||
      !variant ||
      isManualVariant
    ) {
      return;
    }

    const loadEditDefaults =
      async () => {
        const supabase =
          createClient();

        const {
          data,
          error: feeError,
        } =
          await supabase
            .from(
              "card_fee_rules"
            )
            .select(
              "id, bank, card_name, variant, fee_type, fee_amount, fee_currency, waiver_threshold, waiver_period, waiver_description, applies_to_emi, source_name, source_url, verified_at"
            )
            .eq(
              "bank",
              bank
            )
            .eq(
              "card_name",
              cardName
            )
            .eq(
              "fee_type",
              "renewal"
            );

        if (feeError) {
          console.error(
            "Card fee rule load error:",
            feeError
          );
          return;
        }

        const matchingRule =
          findMatchingFeeRule(
            (data ?? []) as FeeRule[],
            variant
          );

        setFeeRule(
          matchingRule
        );

        if (!matchingRule) {
          setDefaultAnnualFee("");
          setDefaultAnnualFeeWaiverThreshold(
            ""
          );
          return;
        }

        const issuerFee =
          String(
            matchingRule.fee_amount
          );

        const issuerWaiver =
          matchingRule.waiver_threshold !=
          null
            ? String(
                matchingRule.waiver_threshold
              )
            : "";

        setDefaultAnnualFee(
          issuerFee
        );

        setDefaultAnnualFeeWaiverThreshold(
          issuerWaiver
        );

        /*
         * Only populate visible values when they are
         * currently blank.
         *
         * This preserves user-specific overrides.
         */
        if (!annualFee) {
          setAnnualFee(
            issuerFee
          );
        }

        if (
          !annualFeeWaiverThreshold
        ) {
          setAnnualFeeWaiverThreshold(
            issuerWaiver
          );
        }
      };

    loadEditDefaults();
  }, [
    activeProfile?.id,
    bank,
    cardName,
    variant,
    isEditMode,
    isManualBank,
    isManualCard,
    isManualVariant,
    loadingProfiles,
    annualFee,
    annualFeeWaiverThreshold,
  ]);

  /*
   * Add mode:
   * load issuer defaults after a complete
   * catalogue selection.
   */
  useEffect(() => {
    if (
      loadingProfiles ||
      isEditMode ||
      !activeProfile?.id ||
      !bank ||
      isManualBank ||
      !cardName ||
      isManualCard ||
      !variant ||
      isManualVariant
    ) {
      return;
    }

    const loadAddDefaults =
      async () => {
        await loadFeeRule(
          bank,
          cardName,
          variant,
          true
        );
      };

    loadAddDefaults();
  }, [
    activeProfile?.id,
    bank,
    cardName,
    variant,
    isEditMode,
    isManualBank,
    isManualCard,
    isManualVariant,
    loadingProfiles,
  ]);

  const handleBankChange = (
    value: string
  ) => {
    setBank(value);
    setCardName("");
    setVariant("");
    setNetwork("");

    setManualBank(
      value === MANUAL_VALUE
        ? manualBank
        : ""
    );

    setManualCardName("");
    setManualVariant("");

    setFeeRule(null);
    setDefaultAnnualFee("");
    setDefaultAnnualFeeWaiverThreshold("");
    setAnnualFee("");
    setAnnualFeeWaiverThreshold("");
  };

  const handleCardChange = (
    value: string
  ) => {
    setCardName(value);
    setVariant("");
    setNetwork("");

    setManualCardName(
      value === MANUAL_VALUE
        ? manualCardName
        : ""
    );

    setManualVariant("");

    setFeeRule(null);
    setDefaultAnnualFee("");
    setDefaultAnnualFeeWaiverThreshold("");
    setAnnualFee("");
    setAnnualFeeWaiverThreshold("");
  };

  const handleVariantChange = (
    value: string
  ) => {
    setVariant(value);

    if (
      value === MANUAL_VALUE
    ) {
      setNetwork("");

      setFeeRule(null);
      setDefaultAnnualFee("");
      setDefaultAnnualFeeWaiverThreshold("");
      setAnnualFee("");
      setAnnualFeeWaiverThreshold("");

      return;
    }

    const option =
      availableVariants.find(
        (item) =>
          item.name === value
      );

    if (
      option?.networks.length === 1
    ) {
      setNetwork(
        option.networks[0]
      );
    } else {
      setNetwork("");
    }

    setFeeRule(null);
    setDefaultAnnualFee("");
    setDefaultAnnualFeeWaiverThreshold("");

    if (!isEditMode) {
      setAnnualFee("");
      setAnnualFeeWaiverThreshold("");
    }
  };

  const handleLifetimeFreeChange = (
    checked: boolean
  ) => {
    setIsLifetimeFree(
      checked
    );

    if (checked) {
      setAnnualFee("");
      setAnnualFeeWaiverThreshold("");
      return;
    }

    if (
      !annualFee &&
      defaultAnnualFee
    ) {
      setAnnualFee(
        defaultAnnualFee
      );
    }

    if (
      !annualFeeWaiverThreshold &&
      defaultAnnualFeeWaiverThreshold
    ) {
      setAnnualFeeWaiverThreshold(
        defaultAnnualFeeWaiverThreshold
      );
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!activeProfile?.id) {
      setError(
        "No active profile is available. Please select a profile first."
      );
      return;
    }

    const finalBank =
      isManualBank
        ? manualBank.trim()
        : bank.trim();

    const finalCardName =
      isManualCard
        ? manualCardName.trim()
        : cardName.trim();

    const finalVariant =
      isManualVariant
        ? manualVariant.trim()
        : variant.trim();

    const finalNetwork =
      hasSingleKnownNetwork
        ? availableNetworks[0]
        : network.trim();

    const normalizedCardLastFour =
      cardLastFour.trim();

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

    if (
      normalizedCardLastFour &&
      !/^\d{4}$/.test(
        normalizedCardLastFour
      )
    ) {
      setError(
        "Last 4 digits must contain exactly 4 digits."
      );
      return;
    }

    const parsedAnniversaryMonth =
      anniversaryMonth
        ? Number(
            anniversaryMonth
          )
        : null;

    const parsedAnniversaryYear =
      anniversaryYear
        ? Number(
            anniversaryYear
          )
        : null;

    const parsedAnnualFee =
      annualFee.trim()
        ? Number(annualFee)
        : null;

    const parsedWaiverThreshold =
      annualFeeWaiverThreshold.trim()
        ? Number(
            annualFeeWaiverThreshold
          )
        : null;

    if (
      parsedAnniversaryMonth !== null &&
      (!Number.isInteger(
        parsedAnniversaryMonth
      ) ||
        parsedAnniversaryMonth <
          1 ||
        parsedAnniversaryMonth >
          12)
    ) {
      setError(
        "Please select a valid card issue month."
      );
      return;
    }

    if (
      parsedAnniversaryYear !== null &&
      (!Number.isInteger(
        parsedAnniversaryYear
      ) ||
        parsedAnniversaryYear <
          1900)
    ) {
      setError(
        "Please select a valid card issue year."
      );
      return;
    }

    if (
      (parsedAnniversaryMonth ===
        null) !==
      (parsedAnniversaryYear ===
        null)
    ) {
      setError(
        "Please provide both the card issue month and year."
      );
      return;
    }

    if (
      parsedAnnualFee !== null &&
      (!Number.isFinite(
        parsedAnnualFee
      ) ||
        parsedAnnualFee < 0)
    ) {
      setError(
        "Please enter a valid annual / renewal fee."
      );
      return;
    }

    if (
      parsedWaiverThreshold !== null &&
      (!Number.isFinite(
        parsedWaiverThreshold
      ) ||
        parsedWaiverThreshold < 0)
    ) {
      setError(
        "Please enter a valid renewal-fee waiver threshold."
      );
      return;
    }

    /*
     * We allow blank fee fields when CardIQ has
     * no verified issuer default.
     *
     * For an LTF card, fee values are deliberately
     * cleared and stored as NULL.
     */
    if (
      !isLifetimeFree &&
      defaultAnnualFee &&
      parsedAnnualFee === null
    ) {
      setError(
        "Please enter the annual / renewal fee or mark the card as Lifetime Free."
      );
      return;
    }

    setSaving(true);

    try {
      const supabase =
        createClient();

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      /*
       * Keep issuer defaults separate from
       * user-specific overrides.
       */
      const feeOverride =
        isLifetimeFree
          ? null
          : defaultAnnualFee &&
              parsedAnnualFee !==
                null &&
              Number(
                defaultAnnualFee
              ) ===
                parsedAnnualFee
            ? null
            : parsedAnnualFee;

      const waiverOverride =
        isLifetimeFree
          ? null
          : defaultAnnualFeeWaiverThreshold &&
              parsedWaiverThreshold !==
                null &&
              Number(
                defaultAnnualFeeWaiverThreshold
              ) ===
                parsedWaiverThreshold
            ? null
            : parsedWaiverThreshold;

      if (
        isEditMode &&
        editCardId
      ) {
        const {
          error: updateError,
        } =
          await supabase
            .from("cards")
            .update({
              name:
                finalCardName,
              bank:
                finalBank,
              network:
                finalNetwork,
              variant:
                finalVariant,
              card_last_four:
                normalizedCardLastFour ||
                null,
            })
            .eq(
              "id",
              editCardId
            )
            .eq(
              "user_id",
              user.id
            )
            .eq(
              "profile_id",
              activeProfile.id
            );

        if (updateError) {
          throw updateError;
        }

        const {
          error: settingsError,
        } =
          await supabase
            .from(
              "card_account_settings"
            )
            .upsert(
              {
                card_id:
                  editCardId,
                user_id:
                  user.id,
                profile_id:
                  activeProfile.id,

                is_lifetime_free:
                  isLifetimeFree,

                anniversary_month:
                  parsedAnniversaryMonth,

                anniversary_year:
                  parsedAnniversaryYear,

                annual_fee_override:
                  feeOverride,

                annual_fee_currency:
                  activeProfile.currency_code,

                annual_fee_waiver_threshold:
                  waiverOverride,

                updated_at:
                  new Date().toISOString(),
              },
              {
                onConflict:
                  "card_id",
              }
            );

        if (settingsError) {
          throw settingsError;
        }
      } else {
        const {
          data: insertedCard,
          error: insertError,
        } =
          await supabase
            .from("cards")
            .insert({
              user_id:
                user.id,
              profile_id:
                activeProfile.id,
              name:
                finalCardName,
              bank:
                finalBank,
              network:
                finalNetwork,
              variant:
                finalVariant,
              card_last_four:
                normalizedCardLastFour ||
                null,
            })
            .select("id")
            .single();

        if (insertError) {
          throw insertError;
        }

        const {
          error: settingsError,
        } =
          await supabase
            .from(
              "card_account_settings"
            )
            .insert({
              card_id:
                insertedCard.id,
              user_id:
                user.id,
              profile_id:
                activeProfile.id,

              is_lifetime_free:
                isLifetimeFree,

              anniversary_month:
                parsedAnniversaryMonth,

              anniversary_year:
                parsedAnniversaryYear,

              annual_fee_override:
                feeOverride,

              annual_fee_currency:
                activeProfile.currency_code,

              annual_fee_waiver_threshold:
                waiverOverride,
            });

        if (settingsError) {
          throw settingsError;
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(
        "Card save error:",
        err
      );

      const errorMessage =
        err &&
        typeof err === "object" &&
        "message" in err
          ? String(
              (
                err as {
                  message: unknown;
                }
              ).message
            )
          : null;

      setError(
        errorMessage ||
          (isEditMode
            ? "Something went wrong while updating your card."
            : "Something went wrong while adding your card.")
      );
    } finally {
      setSaving(false);
    }
  };

  if (
    loadingProfiles ||
    loadingCard
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <p className="text-sm text-[var(--muted)]">
          Loading CardIQ...
        </p>
      </main>
    );
  }

  if (!activeProfile) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <CardIQHeader />

        <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8 lg:py-12">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">
              No active profile
            </h1>

            <p className="mt-2 text-sm text-[var(--muted)]">
              Select a profile before adding or editing a card.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/profiles"
                )
              }
              className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Switch Profile
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CardIQHeader />

      <div className="mx-auto max-w-3xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard"
              )
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
                {activeProfile.name}
              </p>

              <p className="mt-1 text-sm text-[var(--muted)]">
                {
                  activeProfile.country_code
                }{" "}
                ·{" "}
                {
                  activeProfile.currency_code
                }
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Current profile
            </span>
          </div>
        </div>

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
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                  required
                >
                  <option value="">
                    Select bank / issuer
                  </option>

                  {BANKS.map(
                    (item) => (
                      <option
                        key={
                          item.name
                        }
                        value={
                          item.name
                        }
                      >
                        {item.name}
                      </option>
                    )
                  )}

                  <option value={MANUAL_VALUE}>
                    Not listed — add manually
                  </option>
                </select>
              ) : (
                <>
                  <input
                    id="manual-bank"
                    type="text"
                    value={
                      manualBank
                    }
                    onChange={(event) =>
                      setManualBank(
                        event.target
                          .value
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
                      setFeeRule(null);
                      setDefaultAnnualFee("");
                      setDefaultAnnualFeeWaiverThreshold("");
                      setAnnualFee("");
                      setAnnualFeeWaiverThreshold("");
                    }}
                    className="mt-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                  >
                    ← Choose from listed banks
                  </button>
                </>
              )}
            </div>

            {/* Card name */}
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
                  value={
                    cardName
                  }
                  onChange={(event) =>
                    handleCardChange(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    !bank ||
                    isManualBank
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

                  {availableCards.map(
                    (card) => (
                      <option
                        key={
                          card.name
                        }
                        value={
                          card.name
                        }
                      >
                        {
                          card.name
                        }
                      </option>
                    )
                  )}

                  {bank &&
                    !isManualBank && (
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
                    value={
                      manualCardName
                    }
                    onChange={(event) =>
                      setManualCardName(
                        event.target
                          .value
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

            {/* Card variant */}
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
                  value={
                    variant
                  }
                  onChange={(event) =>
                    handleVariantChange(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    !cardName ||
                    isManualCard
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
                        key={
                          item.name
                        }
                        value={
                          item.name
                        }
                      >
                        {
                          item.name
                        }
                      </option>
                    )
                  )}

                  {cardName &&
                    !isManualCard && (
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
                    value={
                      manualVariant
                    }
                    onChange={(event) =>
                      setManualVariant(
                        event.target
                          .value
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
                  {
                    availableNetworks[0]
                  }
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
                  value={
                    network
                  }
                  onChange={(event) =>
                    setNetwork(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    !variant &&
                    !isManualVariant
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  required
                >
                  <option value="">
                    {variant ||
                    isManualVariant
                      ? "Select network"
                      : "Select a card variant first"}
                  </option>

                  {availableNetworks.length >
                  0
                    ? availableNetworks.map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {item}
                          </option>
                        )
                      )
                    : FALLBACK_NETWORKS.map(
                        (item) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
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

            {/* Last 4 digits */}
            <div>
              <label
                htmlFor="card-last-four"
                className="mb-2 block text-sm font-semibold"
              >
                Last 4 digits of card
              </label>

              <input
                id="card-last-four"
                type="text"
                inputMode="numeric"
                maxLength={4}
                pattern="[0-9]{4}"
                value={
                  cardLastFour
                }
                onChange={(event) =>
                  setCardLastFour(
                    event.target.value
                      .replace(
                        /\D/g,
                        ""
                      )
                      .slice(
                        0,
                        4
                      )
                  )
                }
                placeholder="e.g. 1234"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm tracking-widest text-[var(--foreground)] outline-none placeholder:tracking-normal placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
              />

              <p className="mt-2 text-xs text-[var(--muted)]">
                Only the last four digits are stored. Never enter your full card
                number.
              </p>
            </div>

            {/* Card economics */}
            <div className="border-t border-[var(--border)] pt-6">
              <div className="mb-5">
                <p className="text-sm font-semibold">
                  Card economics
                </p>

                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  CardIQ uses the issuer&apos;s current terms by default. You can
                  change them when your specific card has different terms.
                </p>
              </div>

              {/* LTF */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-muted)] p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={
                      isLifetimeFree
                    }
                    onChange={(event) =>
                      handleLifetimeFreeChange(
                        event.target
                          .checked
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-semibold">
                      Lifetime Free (LTF)
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                      Mark this if your specific card has no joining or renewal
                      fee.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {/* Issue month */}
                <div>
                  <label
                    htmlFor="anniversary-month"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Card issue month
                  </label>

                  <select
                    id="anniversary-month"
                    value={
                      anniversaryMonth
                    }
                    onChange={(event) =>
                      setAnniversaryMonth(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                  >
                    <option value="">
                      Select month
                    </option>

                    {MONTHS.map(
                      (month) => (
                        <option
                          key={
                            month.value
                          }
                          value={
                            month.value
                          }
                        >
                          {
                            month.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Issue year */}
                <div>
                  <label
                    htmlFor="anniversary-year"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Card issue year
                  </label>

                  <select
                    id="anniversary-year"
                    value={
                      anniversaryYear
                    }
                    onChange={(event) =>
                      setAnniversaryYear(
                        event.target
                          .value
                      )
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-700"
                  >
                    <option value="">
                      Select year
                    </option>

                    {yearOptions.map(
                      (year) => (
                        <option
                          key={year}
                          value={year}
                        >
                          {year}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Annual fee */}
                <div>
                  <label
                    htmlFor="annual-fee"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Annual / renewal fee
                  </label>

                  <input
                    id="annual-fee"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      annualFee
                    }
                    onChange={(event) =>
                      setAnnualFee(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      isLifetimeFree ||
                      loadingFeeRule
                    }
                    placeholder={
                      loadingFeeRule
                        ? "Loading issuer default..."
                        : `e.g. 1000 ${activeProfile.currency_code}`
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  />

                  {isLifetimeFree ? (
                    <p className="mt-2 text-xs font-medium text-[var(--muted)]">
                      Not applicable — Lifetime Free
                    </p>
                  ) : feeRule &&
                    defaultAnnualFee ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Issuer default:{" "}
                      {
                        feeRule.fee_currency
                      }{" "}
                      {
                        defaultAnnualFee
                      }
                      {feeRule.waiver_description
                        ? ` · ${feeRule.waiver_description}`
                        : ""}
                    </p>
                  ) : !loadingFeeRule &&
                    !isManualVariant ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      No verified issuer fee rule is currently available for
                      this card. You can enter your card-specific value.
                    </p>
                  ) : null}
                </div>

                {/* Waiver threshold */}
                <div>
                  <label
                    htmlFor="annual-fee-waiver-threshold"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Spend required for renewal-fee waiver
                  </label>

                  <input
                    id="annual-fee-waiver-threshold"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={
                      annualFeeWaiverThreshold
                    }
                    onChange={(event) =>
                      setAnnualFeeWaiverThreshold(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      isLifetimeFree ||
                      loadingFeeRule
                    }
                    placeholder={
                      loadingFeeRule
                        ? "Loading issuer default..."
                        : `e.g. 150000 ${activeProfile.currency_code}`
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:focus:border-slate-500 dark:focus:ring-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                  />

                  {isLifetimeFree ? (
                    <p className="mt-2 text-xs font-medium text-[var(--muted)]">
                      Not applicable — Lifetime Free
                    </p>
                  ) : feeRule &&
                    defaultAnnualFeeWaiverThreshold ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Issuer default:{" "}
                      {
                        defaultAnnualFeeWaiverThreshold
                      }{" "}
                      {
                        activeProfile.currency_code
                      }
                      {feeRule.waiver_period
                        ? ` · ${feeRule.waiver_period.replace(
                            "_",
                            " "
                          )}`
                        : ""}
                    </p>
                  ) : !loadingFeeRule &&
                    !isManualVariant ? (
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      No verified issuer waiver threshold is currently
                      available for this card.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

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
                  router.push(
                    "/dashboard"
                  )
                }
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={
                  saving
                }
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
