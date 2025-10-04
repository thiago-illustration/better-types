/**
 * This is the Payment example from Scott Wlaschin's talk:
 * https://www.youtube.com/watch?v=2JB1_e5wZmU&t=1s
 *
 * Everything should be type-safe with intelliSense working.
 */

import { type Result, isError, error, ok } from "../helpers/result";
import { type Tag, createTagged, matchTag } from "../helpers/tag";

// Create singleton instances and extract types
const VISA = createTagged("Visa");
const MASTERCARD = createTagged("Mastercard"); // eslint-disable-line @typescript-eslint/no-unused-vars
const USD = createTagged("USD");
const EUR = createTagged("EUR");

// Extract types from instances
type Visa = typeof VISA;
type Mastercard = typeof MASTERCARD;
type USD = typeof USD;
type EUR = typeof EUR;

// Define other types
type CardType = Visa | Mastercard;
type Currency = USD | EUR;
type CardNumber = Tag<"CardNumber", string>;
type Card = Tag<"Card", { number: CardNumber; type: CardType }>;
type CheckNumber = Tag<"CheckNumber", number>;
type Check = Tag<"Check", { number: CheckNumber }>;
type Cash = Tag<"Cash">;
type Amount = Tag<"Amount", number>;

type PaymentMethod = Card | Check | Cash;

export type Payment = {
  amount: Amount;
  currency: Currency;
  method: PaymentMethod;
};

// ======================================================
// Example

const createAmount = (amount: number): Result<Amount, "NegativeAmount"> => {
  if (amount < 0) {
    return error("NegativeAmount");
  }
  return ok(createTagged("Amount", amount));
};

const createCardNumber = (
  number: string
): Result<CardNumber, "InvalidCardNumber"> => {
  if (number.length !== 16) {
    return error("InvalidCardNumber");
  }
  return ok(createTagged("CardNumber", number));
};

export function example() {
  const amountResult = createAmount(100);
  if (isError(amountResult)) return;

  const cardNumberResult = createCardNumber("1234567890");
  if (isError(cardNumberResult)) return;

  const paymentMethod: PaymentMethod = {
    _tag: "Card",
    value: {
      number: cardNumberResult.data,
      type: VISA,
    },
  };

  const payment: Payment = {
    amount: amountResult.data,
    currency: USD,
    method: paymentMethod,
  };

  matchTag<PaymentMethod>(payment.method, {
    Card: (card) => {
      console.log(card.value.number, card.value.type);
    },
    Check: (check) => {
      console.log(check.value.number);
    },
    Cash: (cash) => {
      console.log(cash.value);
    },
  });
}
