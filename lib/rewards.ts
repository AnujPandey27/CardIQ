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

  mcc?: number | null;
  paymentRoute?: string | null;

  emiStatus?:
    | "regular"
    | "emi"
    | "no_cost_emi";

  transactionType?:
    | "purchase"
    | "refund"
    | "reversal"
    | "fee"
    | "payment"
    | "cash_withdrawal"
    | "other";

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

  rewardCapAmount: number | null;

  rewardCapPeriod:
    | "transaction"
    | "month"
    | "billing_cycle"
    | null;

  periodKey: string | null;

  notes: string[];
};

export type RewardHistoryTransaction = {
  id: string;

  amount: number;
  category: string;
  merchant: string;
  transactionDate: string;

  mcc?: number | null;
  paymentRoute?: string | null;

  emiStatus?:
    | "regular"
    | "emi"
    | "no_cost_emi";

  transactionType?:
    | "purchase"
    | "refund"
    | "reversal"
    | "fee"
    | "payment"
    | "cash_withdrawal"
    | "other";

  rewardAdjustmentAmount?: number | null;

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

  rewardCapAmount: number | null;

  rewardCapPeriod:
    | "transaction"
    | "month"
    | "billing_cycle"
    | null;

  periodKey: string | null;

  notes: string[];
};

function roundReward(
  value: number
): number {
  return Math.round(
    (value + Number.EPSILON) * 100
  ) / 100;
}

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

export function getRewardPeriodKey(
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
    return `${rule.reward_bucket}:${transactionDate.slice(
      0,
      7
    )}`;
  }

  if (
    rule.cap_period ===
    "billing_cycle"
  ) {
    /*
     * Billing-cycle boundaries are not yet stored
     * on the card, so retain calendar-month behaviour
     * until billing-cycle support is implemented.
     */
    return `${rule.reward_bucket}:billing:${transactionDate.slice(
      0,
      7
    )}`;
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

  const exclusionRules =
    sortRules(
      applicableRules.filter(
        (rule) =>
          rule.excluded
      )
    );

  if (
    exclusionRules.length >
    0
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
  previouslyEarnedInBucket = 0
): RewardCalculationResult {
  const transactionType =
    input.transactionType ??
    "purchase";

  /*
   * Refunds and reversals are handled by the historical
   * calculation layer, not as independent reward-earning
   * purchases.
   */
  if (
    transactionType ===
      "refund" ||
    transactionType ===
      "reversal"
  ) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      rewardBucket: null,
      rewardCapAmount: null,
      rewardCapPeriod: null,
      periodKey: null,
      notes: [
        "Refunds and reversals do not generate new rewards.",
      ],
    };
  }

  if (
    transactionType !==
      "purchase" &&
    transactionType !==
      "other"
  ) {
    return {
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      rewardBucket: null,
      rewardCapAmount: null,
      rewardCapPeriod: null,
      periodKey: null,
      notes: [
        "This transaction type does not earn rewards.",
      ],
    };
  }

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
      rewardCapAmount: null,
      rewardCapPeriod: null,
      periodKey: null,
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
      rewardCapAmount:
        exclusion.cap_amount,
      rewardCapPeriod:
        exclusion.cap_period,
      periodKey:
        getRewardPeriodKey(
          exclusion,
          input.transactionDate
        ),
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
      eligible: false,
      rewardAmount: 0,
      rewardCurrency: null,
      rewardRuleId: null,
      rewardRuleType: null,
      rewardType: null,
      rewardBucket: null,
      rewardCapAmount: null,
      rewardCapPeriod: null,
      periodKey: null,
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

  const periodKey =
    getRewardPeriodKey(
      rule,
      input.transactionDate
    );

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
      remainingCap <=
      0
    ) {
      rewardAmount = 0;

      notes.push(
        "Reward bucket has already reached its cap for this period."
      );
    } else if (
      rewardAmount >
      remainingCap
    ) {
      rewardAmount =
        remainingCap;

      notes.push(
        "Shared reward-bucket cap applied."
      );
    }
  }

  if (
    input.emiStatus ===
      "emi" ||
    input.emiStatus ===
      "no_cost_emi"
  ) {
    notes.push(
      input.emiStatus ===
        "no_cost_emi"
        ? "No-Cost EMI transaction."
        : "EMI transaction."
    );
  }

  if (
    input.mcc
  ) {
    notes.push(
      `MCC ${input.mcc} was used as transaction metadata.`
    );
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
    rule.notes
  ) {
    notes.push(
      rule.notes
    );
  }

  return {
    eligible:
      rewardAmount > 0,
    rewardAmount:
      roundReward(
        rewardAmount
      ),
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
    rewardCapAmount:
      rule.cap_amount,
    rewardCapPeriod:
      rule.cap_period,
    periodKey,
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

  const results: RewardHistoryResult[] =
    [];

  for (
    const transaction of orderedTransactions
  ) {
    const transactionType =
      transaction.transactionType ??
      "purchase";

    /*
     * Refund/reversal:
     * calculate the reward associated with the original
     * economics and negate it.
     *
     * The caller should provide refund/reversal rows linked
     * to the original transaction and the reward adjustment
     * field when available.
     */
    if (
      transactionType ===
        "refund" ||
      transactionType ===
        "reversal"
    ) {
      const adjustment =
        transaction.rewardAdjustmentAmount;

      if (
        adjustment !==
          null &&
        adjustment !==
          undefined
      ) {
        results.push({
          transactionId:
            transaction.id,

          eligible:
            adjustment !==
            0,

          rewardAmount:
            roundReward(
              adjustment
            ),

          rewardCurrency:
            null,

          rewardRuleId:
            null,

          rewardBucket:
            null,

          rewardCapAmount:
            null,

          rewardCapPeriod:
            null,

          periodKey:
            null,

          notes: [
            "Reward adjustment from refund or reversal.",
          ],
        });
      } else {
        results.push({
          transactionId:
            transaction.id,

          eligible: false,

          rewardAmount: 0,

          rewardCurrency: null,

          rewardRuleId: null,

          rewardBucket: null,

          rewardCapAmount: null,

          rewardCapPeriod: null,

          periodKey: null,

          notes: [
            "Refund or reversal. Reward adjustment will be calculated from the linked original transaction.",
          ],
        });
      }

      continue;
    }

    const calculation =
      calculateReward(
        {
          amount:
            transaction.amount,

          category:
            transaction.category,

          merchant:
            transaction.merchant,

          transactionDate:
            transaction.transactionDate,

          mcc:
            transaction.mcc,

          paymentRoute:
            transaction.paymentRoute,

          emiStatus:
            transaction.emiStatus,

          transactionType,

          card:
            transaction.card,
        },

        rules,

        0
      );

    /*
     * Recalculate with bucket usage so monthly caps are
     * respected across the complete historical sequence.
     */
    let finalCalculation =
      calculation;

    if (
      calculation.periodKey
    ) {
      const previouslyEarned =
        earnedByPeriod.get(
          calculation.periodKey
        ) ?? 0;

      finalCalculation =
        calculateReward(
          {
            amount:
              transaction.amount,

            category:
              transaction.category,

            merchant:
              transaction.merchant,

            transactionDate:
              transaction.transactionDate,

            mcc:
              transaction.mcc,

            paymentRoute:
              transaction.paymentRoute,

            emiStatus:
              transaction.emiStatus,

            transactionType,

            card:
              transaction.card,
          },

          rules,

          previouslyEarned
        );

      if (
        finalCalculation.eligible
      ) {
        earnedByPeriod.set(
          calculation.periodKey,
          previouslyEarned +
            finalCalculation.rewardAmount
        );
      }
    }

    results.push({
      transactionId:
        transaction.id,

      eligible:
        finalCalculation.eligible,

      rewardAmount:
        finalCalculation.rewardAmount,

      rewardCurrency:
        finalCalculation.rewardCurrency,

      rewardRuleId:
        finalCalculation.rewardRuleId,

      rewardBucket:
        finalCalculation.rewardBucket,

      rewardCapAmount:
        finalCalculation.rewardCapAmount,

      rewardCapPeriod:
        finalCalculation.rewardCapPeriod,

      periodKey:
        finalCalculation.periodKey,

      notes:
        finalCalculation.notes,
    });
  }

  return results;
}
