import { pipeResult } from "../helpers/pipe";
import { type Result, ok, error, isError } from "../helpers/result";
import { createTag, type Tag } from "../helpers/tag";

/**
 * Illegal states avoided by types:
 * - A paid cart should NEVER have items added to it
 * - An empty cart should NEVER be paid for
 * - Empty carts should NEVER have items removed from them
 */

// ======================================================
// Types

type ID = Tag<"ID", string>;
type Str100 = Tag<"Str100", string>; // Max 100 characters
type Price = Tag<"Price", number>;

type Item = Tag<"Item", { id: ID; name: Str100; price: Price }>;
type EmptyCart = Tag<"EmptyCart", Item[]>;
type ActiveCart = Tag<"ActiveCart", Item[]>;
type PaidCart = Tag<"PaidCart", Item[]>;

// ======================================================
// Errors

type CreateStr100Error = "StringTooLong";
type CreatePriceError = "PriceTooLow" | "PriceTooHigh";
type CreateItemError = CreateStr100Error | CreatePriceError;

type AddToCartError = "ItemAlreadyInCart";
type RemoveFromCartError = "UnableToRemoveItem";
type PayForCartError = "InvalidCardData" | "InsufficientFunds";

// ======================================================
// Function Types

type CreateItemPayload = {
  id: string;
  name: string;
  price: number;
};

type CreateItem = (payload: CreateItemPayload) => Result<Item, CreateItemError>;
type CreateEmptyCart = () => Result<EmptyCart, never>;
type CreateActiveCart = (items: Item[]) => Result<ActiveCart, never>;
type CreatePaidCart = (items: Item[]) => Result<PaidCart, never>;

type AddToCart = (
  cart: EmptyCart | ActiveCart,
  item: Item
) => Result<ActiveCart, AddToCartError>;

type RemoveFromCart = (
  cart: ActiveCart,
  itemId: string
) => Result<ActiveCart | EmptyCart, RemoveFromCartError>;

type PayForCart = (cart: ActiveCart) => Result<PaidCart, PayForCartError>;

// ======================================================
// Functions

const tryAddToCart: AddToCart = (cart, item) => {
  if (cart._tag === "EmptyCart") {
    const activeCart = createActiveCart([item]);
    return activeCart;
  }

  const hasItem = cart.value.some((i) => i.value.id === item.value.id);
  if (hasItem) return error("ItemAlreadyInCart");

  return ok({ ...cart, value: [...cart.value, item] });
};

const tryRemoveFromCart: RemoveFromCart = (cart, itemId) => {
  const items = cart.value.filter((i) => i.value.id.value !== itemId);

  if (items.length === 0) return createEmptyCart();
  return createActiveCart(items);
};

const tryPayForCart: PayForCart = (cart) => {
  return createPaidCart(cart.value);
};

// ======================================================
// Factory functions
// Function names starting with "try" are not guaranteed to succeed and should return a Result type

const tryCreateStr100 = (str: string): Result<Str100, CreateStr100Error> => {
  if (str.length > 100) return error("StringTooLong");
  return ok(createTag("Str100", str));
};

const tryCreatePrice = (
  price: number,
  minPrice = 0,
  maxPrice = 1_000_000
): Result<Price, CreatePriceError> => {
  if (price < minPrice) return error("PriceTooLow");
  if (price > maxPrice) return error("PriceTooHigh");
  return ok(createTag("Price", price));
};

const tryCreateItem: CreateItem = (payload) => {
  const name = tryCreateStr100(payload.name);
  if (isError(name)) return name;

  const price = tryCreatePrice(payload.price);
  if (isError(price)) return price;

  const item: Item = {
    _tag: "Item",
    value: {
      id: createTag("ID", payload.id),
      name: createTag("Str100", payload.name),
      price: createTag("Price", payload.price),
    },
  };

  return ok(item);
};

const createEmptyCart: CreateEmptyCart = () =>
  ok({
    _tag: "EmptyCart",
    value: [],
  });

const createActiveCart: CreateActiveCart = (items = []) =>
  ok({
    _tag: "ActiveCart",
    value: items,
  });

const createPaidCart: CreatePaidCart = (items = []) =>
  ok({
    _tag: "PaidCart",
    value: items,
  });

// ======================================================
// Examples

export function cartExamples() {
  const item = tryCreateItem({ id: "1", name: "Item 1", price: 100 });
  if (isError(item)) return;

  const createCartResult = createEmptyCart();
  if (isError(createCartResult)) return;

  const addToCartResult = tryAddToCart(createCartResult.data, item.data);
  if (isError(addToCartResult)) return;

  const removeFromCartResult = tryRemoveFromCart(addToCartResult.data, "1");
  if (isError(removeFromCartResult)) return;

  const payForCartResult = tryPayForCart(addToCartResult.data);
  if (isError(payForCartResult)) return;
}

// ======================================================
// Pipe Examples

const cartPipeExample = pipeResult(createEmptyCart())
  .flatMap((emptyCart) => {
    const item = tryCreateItem({ id: "1", name: "Laptop", price: 999 });
    if (isError(item)) return item;
    return tryAddToCart(emptyCart, item.data);
  })
  .flatMap((activeCart) => {
    const duplicateItem = tryCreateItem({ id: "2", name: "Mouse", price: 25 });
    if (isError(duplicateItem)) return duplicateItem;
    return tryAddToCart(activeCart, duplicateItem.data);
  })
  .flatMap((activeCart) => {
    const removeFromCartResult = tryRemoveFromCart(activeCart, "1");
    if (isError(removeFromCartResult)) return removeFromCartResult;
    return removeFromCartResult;
  })
  .flatMap((activeCart) => {
    if (activeCart._tag === "EmptyCart") return error("EmptyCart");

    const payForCartResult = tryPayForCart(activeCart);
    if (isError(payForCartResult)) return payForCartResult;
    return payForCartResult;
  })
  .tapError((error) => console.log(`  Error occurred: ${error}`))
  .mapError((error) => `Handled: ${error}`);

export function cartPipeExamples() {
  const result = cartPipeExample.unwrap();

  if (isError(result)) return;
  return result.data;
}
