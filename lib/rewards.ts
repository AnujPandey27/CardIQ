export type RewardRule = {
  id: string;

  bank: string;
  card_name: string;
  variant: string | null;

  category: string | null;
  merchant_pattern: string | null;

  rule_type: "base" | "category";

  reward_type:
    | "percentage"
    | "points_per_100"
    | "flat";

  reward_value: number;
  reward_currency: string;

  reward_value_unit: string | null;

  min_spend: number | null;
  max_spend: number | null;

  cap_amount: number | null;

  cap_period:
    | "transaction"
    | "month"
    | null;

  excluded: boolean;

  priority: number;

  valid_from: string | null;
  valid_to: string | null;

  notes: string | null;
};

export type RewardCalculationInput = {
  amount: number;
  category: string;
  merchant: string;
  transactionDate: string;

  card: {
    bank: string;
    name: string;
    variant: string | null;
  };
};

export type RewardCalculationResult = {
  eligible: boolean;

  rewardAmount: number;

  rewardCurrency: string | null;

  rewardRuleId: string | null;

  rewardRuleType:
    | "base"
    | "category"
    | null;

  rewardType:
    | "percentage"
    | "points_per_100"
    | "flat"
    | null;

  notes: string[];
};

function ruleMatchesCard(
  rule: RewardRule,
  card: RewardCalculationInput["card"]
): boolean {
  if (rule.bank !== card.bank) {
    return false;
  }

  if (rule.card_name !== card.name) {
    return false;
  }

  if (
    rule.variant !== null &&
    rule.variant !== card.variant
  ) {
    return false;
  }

  return true;
}

function ruleMatchesDate(
  rule: RewardRule,
  transactionDate: string
): boolean {
  if (
    rule.valid_from &&
    transactionDate < rule.valid_from
  ) {
    return false;
  }

  if (
    rule.valid_to &&
    transactionDate > rule.valid_to
  ) {
    return false;
  }

  return true;
}

function ruleMatchesSpendRange(
  rule: RewardRule,
  amount: number
): boolean {
  if (
    rule.min_spend !== null &&
    amount < rule.min_spend
  ) {
    return false;
  }

  if (
    rule.max_spend !== null &&
    amount > rule.max_spend
  ) {
    return false;
  }

  return true;
}

function ruleMatchesMerchant(
  rule: RewardRule,
  merchant: string
): boolean {
  if (!rule.merchant_pattern) {
    return true;
  }

  const normalizedMerchant =
    merchant.trim().toLowerCase();

  const pattern =
    rule.merchant_pattern
      .trim()
      .toLowerCase();

  if (!pattern) {
    return true;
  }

  return normalizedMerchant.includes(pattern);
}

function calculateRewardValue(
  amount: number,
  rule: RewardRule
): number {
  if (rule.reward_type === "percentage") {
    return amount * (rule.reward_value / 100);
  }

  if (
    rule.reward_type ===
    "points_per_100"
  ) {
    return (
      amount *
      (rule.reward_value / 100)
    );
  }

  if (rule.reward_type === "flat") {
    return rule.reward_value;
  }

  return 0;
}

function sortRules(
  rules: RewardRule[]
): RewardRule[] {
  return [...rules].sort(
    (a, b) => {
      /*
       * Category rules take precedence over base rules.
       * Within the same type, the higher priority wins.
       */
      if (
        a.rule_type !== b.rule_type
      ) {
        return a.rule_type ===
          "category"
          ? -1
          : 1;
      }

      return (
        b.priority - a.priority
      );
    }
  );
}

export function calculateReward(
  input: RewardCalculationInput,
  rules: RewardRule[]
): RewardCalculationResult {
  const notes: string[] = [];

  if (
    !Number.isFinite(input.amount) ||
    input.amount <= 0
  ) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      notes: [
        "Invalid transaction amount.",
      ],
    };
  }

  const matchingRules =
    rules.filter(
      (rule) => {
        if (rule.excluded) {
          return false;
        }

        if (
          !ruleMatchesCard(
            rule,
            input.card
          )
        ) {
          return false;
        }

        if (
          !ruleMatchesDate(
            rule,
            input.transactionDate
          )
        ) {
          return false;
        }

        if (
          !ruleMatchesSpendRange(
            rule,
            input.amount
          )
        ) {
          return false;
        }

        if (
          !ruleMatchesMerchant(
            rule,
            input.merchant
          )
        ) {
          return false;
        }

        return true;
      }
    );

  if (
    matchingRules.length === 0
  ) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      notes: [
        "No reward rule is currently configured for this card and transaction.",
      ],
    };
  }

  const categoryRules =
    sortRules(
      matchingRules.filter(
        (rule) =>
          rule.rule_type ===
            "category" &&
          rule.category ===
            input.category
      )
    );

  const baseRules =
    sortRules(
      matchingRules.filter(
        (rule) =>
          rule.rule_type ===
          "base"
      )
    );

  const selectedRule =
    categoryRules[0] ??
    baseRules[0];

  if (!selectedRule) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      notes: [
        "No eligible reward rule was found.",
      ],
    };
  }

  let rewardAmount =
    calculateRewardValue(
      input.amount,
      selectedRule
    );

  if (
    selectedRule.cap_period ===
      "transaction" &&
    selectedRule.cap_amount !== null
  ) {
    rewardAmount = Math.min(
      rewardAmount,
      selectedRule.cap_amount
    );

    notes.push(
      "Transaction-level reward cap applied."
    );
  }

  if (
    selectedRule.cap_period ===
      "month" &&
    selectedRule.cap_amount !== null
  ) {
    notes.push(
      "Monthly reward cap exists and will be applied when monthly spend aggregation is available."
    );
  }

  if (
    selectedRule.merchant_pattern
  ) {
    notes.push(
      `Merchant-specific rule matched: ${selectedRule.merchant_pattern}.`
    );
  }

  if (
    selectedRule.min_spend !== null
  ) {
    notes.push(
      `Minimum eligible spend: ${selectedRule.min_spend}.`
    );
  }

  if (
    selectedRule.max_spend !== null
  ) {
    notes.push(
      `Maximum eligible spend: ${selectedRule.max_spend}.`
    );
  }

  return {
    eligible: true,
    rewardAmount,
    rewardCurrency:
      selectedRule.reward_currency,
    rewardRuleId:
      selectedRule.id,
    rewardRuleType:
      selectedRule.rule_type,
    rewardType:
      selectedRule.reward_type,
    notes,
  };
}
