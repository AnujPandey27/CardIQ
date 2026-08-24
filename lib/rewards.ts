export type RewardRule = {
  id: string;
  bank: string;
  card_name: string;
  variant: string | null;

  category: string | null;

  rule_type: "base" | "category";

  reward_type:
    | "percentage"
    | "points_per_100"
    | "flat";

  reward_value: number;

  reward_currency: string;

  cap_amount: number | null;

  cap_period:
    | "transaction"
    | "month"
    | null;

  excluded: boolean;

  priority: number;

  valid_from: string | null;
  valid_to: string | null;
};

export type RewardCalculationInput = {
  amount: number;
  category: string;
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
) {
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
) {
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

function calculateRewardValue(
  amount: number,
  rule: RewardRule
) {
  if (rule.reward_type === "percentage") {
    return amount * (rule.reward_value / 100);
  }

  if (rule.reward_type === "points_per_100") {
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
      notes: ["Invalid transaction amount."],
    };
  }

  const matchingRules = rules.filter(
    (rule) =>
      !rule.excluded &&
      ruleMatchesCard(rule, input.card) &&
      ruleMatchesDate(
        rule,
        input.transactionDate
      )
  );

  if (matchingRules.length === 0) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      notes: [
        "No reward rule is currently configured for this card.",
      ],
    };
  }

  const categoryRules =
    matchingRules
      .filter(
        (rule) =>
          rule.rule_type === "category" &&
          rule.category === input.category
      )
      .sort(
        (a, b) =>
          b.priority - a.priority
      );

  const baseRules =
    matchingRules
      .filter(
        (rule) =>
          rule.rule_type === "base"
      )
      .sort(
        (a, b) =>
          b.priority - a.priority
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
      "Monthly reward cap exists and requires monthly transaction aggregation."
    );
  }

  return {
    eligible: true,
    rewardAmount,
    rewardCurrency:
      selectedRule.reward_currency,
    rewardRuleId: selectedRule.id,
    rewardRuleType:
      selectedRule.rule_type,
    rewardType:
      selectedRule.reward_type,
    notes,
  };
}
