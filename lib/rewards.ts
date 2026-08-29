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

  reward_value_unit:
    | string
    | null;

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

  source_url: string | null;
  source_name: string | null;
  verified_at: string | null;
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

function ruleMatchesCategory(
  rule: RewardRule,
  category: string
): boolean {
  if (!rule.category) {
    return true;
  }

  return (
    rule.category.trim().toLowerCase() ===
    category.trim().toLowerCase()
  );
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
      if (
        a.priority !== b.priority
      ) {
        return b.priority - a.priority;
      }

      if (
        a.rule_type !== b.rule_type
      ) {
        return a.rule_type ===
          "category"
          ? -1
          : 1;
      }

      return 0;
    }
  );
}

function getApplicableRules(
  input: RewardCalculationInput,
  rules: RewardRule[]
): RewardRule[] {
  return rules.filter(
    (rule) =>
      ruleMatchesCard(
        rule,
        input.card
      ) &&
      ruleMatchesDate(
        rule,
        input.transactionDate
      ) &&
      ruleMatchesSpendRange(
        rule,
        input.amount
      ) &&
      ruleMatchesMerchant(
        rule,
        input.merchant
      ) &&
      ruleMatchesCategory(
        rule,
        input.category
      )
  );
}

export function calculateReward(
  input: RewardCalculationInput,
  rules: RewardRule[]
): RewardCalculationResult {
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

  const applicableRules =
    getApplicableRules(
      input,
      rules
    );

  if (
    applicableRules.length === 0
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

  /*
   * Exclusion rules always take precedence.
   *
   * Example:
   * Base reward = 1%
   * Category reward = 5%
   * Exclusion = 0%
   *
   * If the exclusion matches, the transaction earns
   * zero reward regardless of the other earning rules.
   */
  const exclusionRules =
    sortRules(
      applicableRules.filter(
        (rule) =>
          rule.excluded
      )
    );

  if (
    exclusionRules.length > 0
  ) {
    const exclusionRule =
      exclusionRules[0];

    const notes = [
      "This transaction matches an excluded spend category or merchant.",
    ];

    if (
      exclusionRule.notes
    ) {
      notes.push(
        exclusionRule.notes
      );
    }

    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency:
        exclusionRule.reward_currency ||
        null,
      rewardRuleId:
        exclusionRule.id,
      rewardRuleType:
        exclusionRule.rule_type,
      rewardType:
        exclusionRule.reward_type,
      notes,
    };
  }

  const categoryRules =
    sortRules(
      applicableRules.filter(
        (rule) =>
          !rule.excluded &&
          rule.rule_type ===
            "category" &&
          rule.category !== null
      )
    );

  const baseRules =
    sortRules(
      applicableRules.filter(
        (rule) =>
          !rule.excluded &&
          rule.rule_type ===
            "base"
      )
    );

  /*
   * Category/merchant-specific rules beat base rules.
   * Priority is considered before rule type.
   */
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

  const notes: string[] = [];

  if (
    selectedRule.cap_period ===
      "transaction" &&
    selectedRule.cap_amount !== null
  ) {
    if (
      rewardAmount >
      selectedRule.cap_amount
    ) {
      rewardAmount =
        selectedRule.cap_amount;

      notes.push(
        "Transaction-level reward cap applied."
      );
    }
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
    selectedRule.category
  ) {
    notes.push(
      `Category rule matched: ${selectedRule.category}.`
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

  if (
    selectedRule.notes
  ) {
    notes.push(
      selectedRule.notes
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
