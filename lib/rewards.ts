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

  reward_unit:
    | "cashback"
    | "points"
    | "miles"
    | "other"
    | null;

  redemption_value: number | null;
  redemption_currency: string | null;
  redemption_method: string | null;

  min_spend: number | null;
  max_spend: number | null;

  cap_amount: number | null;

  cap_period:
    | "transaction"
    | "month"
    | "billing_cycle"
    | null;

  reward_bucket: string | null;

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

  rewardBucket: string | null;

  notes: string[];
};

export type RewardHistoryTransaction = {
  id: string;

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

export type RewardHistoryResult = {
  transactionId: string;

  eligible: boolean;

  rewardAmount: number;

  rewardCurrency: string | null;

  rewardRuleId: string | null;

  rewardBucket: string | null;

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

  return normalizedMerchant.includes(
    pattern
  );
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
  if (
    rule.reward_type ===
    "percentage"
  ) {
    return (
      amount *
      (rule.reward_value / 100)
    );
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

  if (
    rule.reward_type ===
    "flat"
  ) {
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
        a.priority !==
        b.priority
      ) {
        return (
          b.priority -
          a.priority
        );
      }

      if (
        a.rule_type !==
        b.rule_type
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

function getApplicablePeriodKey(
  rule: RewardRule,
  transactionDate: string
): string | null {
  if (
    !rule.reward_bucket ||
    !rule.cap_period
  ) {
    return null;
  }

  if (
    rule.cap_period ===
    "transaction"
  ) {
    return `${rule.reward_bucket}:${transactionDate}`;
  }

  if (
    rule.cap_period ===
    "month"
  ) {
    const month =
      transactionDate.slice(
        0,
        7
      );

    return `${rule.reward_bucket}:${month}`;
  }

  /*
   * Billing-cycle support needs the actual statement-cycle
   * boundaries. Until those are available, use the calendar
   * month as a safe fallback rather than pretending to know
   * the user's billing cycle.
   */
  if (
    rule.cap_period ===
    "billing_cycle"
  ) {
    const month =
      transactionDate.slice(
        0,
        7
      );

    return `${rule.reward_bucket}:billing:${month}`;
  }

  return null;
}

function selectRewardRule(
  input: RewardCalculationInput,
  rules: RewardRule[]
): {
  rule: RewardRule | null;
  exclusion: RewardRule | null;
} {
  const applicableRules =
    getApplicableRules(
      input,
      rules
    );

  if (
    applicableRules.length ===
    0
  ) {
    return {
      rule: null,
      exclusion: null,
    };
  }

  /*
   * Exclusions always override earning rules.
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
    return {
      rule: null,
      exclusion:
        exclusionRules[0],
    };
  }

  const categoryRules =
    sortRules(
      applicableRules.filter(
        (rule) =>
          rule.rule_type ===
            "category" &&
          !rule.excluded
      )
    );

  const baseRules =
    sortRules(
      applicableRules.filter(
        (rule) =>
          rule.rule_type ===
            "base" &&
          !rule.excluded
      )
    );

  return {
    rule:
      categoryRules[0] ??
      baseRules[0] ??
      null,
    exclusion: null,
  };
}

export function calculateReward(
  input: RewardCalculationInput,
  rules: RewardRule[],
  previouslyEarnedInBucket: number = 0
): RewardCalculationResult {
  if (
    !Number.isFinite(
      input.amount
    ) ||
    input.amount <= 0
  ) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      rewardBucket: null,
      notes: [
        "Invalid transaction amount.",
      ],
    };
  }

  const {
    rule,
    exclusion,
  } =
    selectRewardRule(
      input,
      rules
    );

  if (exclusion) {
    const notes = [
      "This transaction matches an excluded spend category or merchant.",
    ];

    if (
      exclusion.notes
    ) {
      notes.push(
        exclusion.notes
      );
    }

    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency:
        exclusion.reward_currency ||
        null,
      rewardRuleId:
        exclusion.id,
      rewardRuleType:
        exclusion.rule_type,
      rewardType:
        exclusion.reward_type,
      rewardBucket:
        exclusion.reward_bucket,
      notes,
    };
  }

  if (!rule) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      rewardBucket: null,
      notes: [
        "No reward rule is currently configured for this card and transaction.",
      ],
    };
  }

  let rewardAmount =
    calculateRewardValue(
      input.amount,
      rule
    );

  const notes: string[] = [];

  /*
   * Transaction-level cap.
   */
  if (
    rule.cap_period ===
      "transaction" &&
    rule.cap_amount !== null
  ) {
    if (
      rewardAmount >
      rule.cap_amount
    ) {
      rewardAmount =
        rule.cap_amount;

      notes.push(
        "Transaction-level reward cap applied."
      );
    }
  }

  /*
   * Shared month / billing-cycle bucket cap.
   */
  if (
    (
      rule.cap_period ===
        "month" ||
      rule.cap_period ===
        "billing_cycle"
    ) &&
    rule.cap_amount !== null
  ) {
    const remainingCap =
      Math.max(
        0,
        rule.cap_amount -
          previouslyEarnedInBucket
      );

    if (
      rewardAmount >
      remainingCap
    ) {
      rewardAmount =
        remainingCap;

      notes.push(
        "Shared reward-bucket cap applied."
      );
    }

    if (
      remainingCap === 0
    ) {
      rewardAmount = 0;

      notes.push(
        "Reward bucket has already reached its cap for this period."
      );
    }
  }

  if (
    rule.merchant_pattern
  ) {
    notes.push(
      `Merchant-specific rule matched: ${rule.merchant_pattern}.`
    );
  }

  if (
    rule.category
  ) {
    notes.push(
      `Category rule matched: ${rule.category}.`
    );
  }

  if (
    rule.min_spend !== null
  ) {
    notes.push(
      `Minimum eligible spend: ${rule.min_spend}.`
    );
  }

  if (
    rule.max_spend !== null
  ) {
    notes.push(
      `Maximum eligible spend: ${rule.max_spend}.`
    );
  }

  if (
    rule.notes
  ) {
    notes.push(
      rule.notes
    );
  }

  return {
    eligible:
      rewardAmount > 0,
    rewardAmount,
    rewardCurrency:
      rule.reward_currency,
    rewardRuleId:
      rule.id,
    rewardRuleType:
      rule.rule_type,
    rewardType:
      rule.reward_type,
    rewardBucket:
      rule.reward_bucket,
    notes,
  };
}

export function calculateRewardsForTransactions(
  transactions: RewardHistoryTransaction[],
  rules: RewardRule[]
): RewardHistoryResult[] {
  const orderedTransactions =
    [...transactions].sort(
      (a, b) =>
        a.transactionDate.localeCompare(
          b.transactionDate
        )
    );

  const earnedByPeriod =
    new Map<
      string,
      number
    >();

  const results =
    orderedTransactions.map(
      (transaction) => {
        const input: RewardCalculationInput = {
          amount:
            transaction.amount,

          category:
            transaction.category,

          merchant:
            transaction.merchant,

          transactionDate:
            transaction.transactionDate,

          card:
            transaction.card,
        };

        const {
          rule,
          exclusion,
        } =
          selectRewardRule(
            input,
            rules
          );

        if (exclusion) {
          return {
            transactionId:
              transaction.id,
            eligible: false,
            rewardAmount: 0,
            rewardCurrency:
              exclusion.reward_currency ||
              null,
            rewardRuleId:
              exclusion.id,
            rewardBucket:
              exclusion.reward_bucket,
            notes: [
              "This transaction matches an excluded spend category or merchant.",
              ...(exclusion.notes
                ? [exclusion.notes]
                : []),
            ],
          };
        }

        if (!rule) {
          return {
            transactionId:
              transaction.id,
            eligible: false,
            rewardAmount: 0,
            rewardCurrency: null,
            rewardRuleId: null,
            rewardBucket: null,
            notes: [
              "No reward rule is currently configured for this card and transaction.",
            ],
          };
        }

        const periodKey =
          getApplicablePeriodKey(
            rule,
            transaction.transactionDate
          );

        const previouslyEarned =
          periodKey
            ? earnedByPeriod.get(
                periodKey
              ) ?? 0
            : 0;

        const calculation =
          calculateReward(
            input,
            rules,
            previouslyEarned
          );

        if (
          calculation.eligible &&
          periodKey
        ) {
          earnedByPeriod.set(
            periodKey,
            previouslyEarned +
              calculation.rewardAmount
          );
        }

        return {
          transactionId:
            transaction.id,
          eligible:
            calculation.eligible,
          rewardAmount:
            calculation.rewardAmount,
          rewardCurrency:
            calculation.rewardCurrency,
          rewardRuleId:
            calculation.rewardRuleId,
          rewardBucket:
            calculation.rewardBucket,
          notes:
            calculation.notes,
        };
      }
    );

  return results;
}
