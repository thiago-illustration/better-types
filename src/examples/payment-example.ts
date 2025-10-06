/**
 * This is the Payment example from Scott Wlaschin's talk:
 * https://www.youtube.com/watch?v=2JB1_e5wZmU&t=1s
 *
 * Everything should be type-safe with intelliSense working.
 */

import { pipeWithContext } from "../helpers/pipe";
import { type Result, isError, error, ok } from "../helpers/result";
import { type Tag, createTag, matchTag } from "../helpers/tag";

// Define types first (source of truth)
type Visa = Tag<"Visa">;
type Mastercard = Tag<"Mastercard">;
type USD = Tag<"USD">;
type EUR = Tag<"EUR">;

const VISA = createTag<Visa>("Visa");
const MASTERCARD = createTag<Mastercard>("Mastercard"); // eslint-disable-line @typescript-eslint/no-unused-vars
const USD = createTag<USD>("USD");
const EUR = createTag<EUR>("EUR");

type CardType = Visa | Mastercard;
type CardNumber = Tag<"CardNumber", string>;
type Card = Tag<"Card", { number: CardNumber; type: CardType }>;

type CheckNumber = Tag<"CheckNumber", number>;
type Check = Tag<"Check", { number: CheckNumber }>;

type Cash = Tag<"Cash">;

type Currency = USD | EUR;
type Amount = Tag<"Amount", number>;

type PaymentMethod = Card | Check | Cash;

export type Payment = {
  amount: Amount;
  currency: Currency;
  method: PaymentMethod;
};

// ======================================================
// Factory functions
// Function names starting with "try" are not guaranteed to succeed and should return a Result type

const tryCreateAmount = (
  amount: number
): Result<Amount, "NoNegativeAmount" | "TooLargeAmount"> => {
  if (amount < 0) return error("NoNegativeAmount");
  if (amount > 1_000_000) return error("TooLargeAmount");
  return ok(createTag("Amount", amount));
};

const tryCreateCardNumber = (
  number: string
): Result<CardNumber, "InvalidCardNumber"> => {
  const wrongLength = number.length !== 16;
  const wrongFormat = !/^\d+$/.test(number); // Only digits allowed

  if (wrongLength || wrongFormat) return error("InvalidCardNumber");
  return ok(createTag("CardNumber", number));
};

// ======================================================
// Examples

export function example() {
  const amountResult = tryCreateAmount(100);
  if (isError(amountResult)) return;

  const cardNumberResult = tryCreateCardNumber("1234567890");
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

export function pipeExampleWithContext() {
  const result = pipeWithContext<{ amount: Amount }>(tryCreateAmount(100))
    .setContext((amount, ctx) => ctx.set("amount", amount))
    .flatMap(() => tryCreateCardNumber("1234567890"))
    .mapToResult((cardNumber) =>
      createTag<Card>("Card", {
        number: cardNumber,
        type: VISA,
      })
    )
    .mapToResult((card, ctx) => ({
      amount: ctx.get("amount")!,
      currency: USD,
      method: card,
    }))
    .tap((payment) => {
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
    })
    .unwrap();

  if (isError(result)) return;
  return result.data;
}
