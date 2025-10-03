/**
 * This is the Payment example from Scott Wlaschin's talk:
 * https://www.youtube.com/watch?v=2JB1_e5wZmU&t=1s
 *
 * Everything should be type-safe with intelliSense working.
 */

import { type Result, isError, error, ok } from "../helpers/result";
import { type Tag, matchTag } from "../helpers/tag";

type Visa = Tag<"Visa">; // if you omit the second parameter, the type will be "Visa"
type Mastercard = Tag<"Mastercard">;
type CardType = Visa | Mastercard;
type CardNumber = Tag<"CardNumber", string>;
type Card = Tag<"Card", { number: CardNumber; type: CardType }>;

type CheckNumber = Tag<"CheckNumber", number>;
type Check = Tag<"Check", { number: CheckNumber }>;

type Cash = Tag<"Cash">;

type USD = Tag<"USD">;
type EUR = Tag<"EUR">;
type Currency = USD | EUR;
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
  return ok({
    _tag: "Amount",
    value: amount,
  });
};

const createCardNumber = (
  number: string
): Result<CardNumber, "InvalidCardNumber"> => {
  if (number.length !== 16) {
    return error("InvalidCardNumber");
  }
  return ok({ _tag: "CardNumber", value: number });
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
      type: { _tag: "Visa", value: "Visa" },
    },
  };

  matchTag<PaymentMethod>(paymentMethod, {
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

  const payment: Payment = {
    amount: amountResult.data,
    currency: { _tag: "USD", value: "USD" },
    method: paymentMethod,
  };

  return payment;
}
