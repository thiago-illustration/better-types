import { pipeResult } from "../helpers/pipe";
import { type Result, ok, error, isError } from "../helpers/result";
import { type Tag } from "../helpers/tag";

// ======================================================
// Types

type Item = Tag<"Item", { id: string; name: string; price: number }>;
type EmptyCart = Tag<"EmptyCart", Item[]>;
type ActiveCart = Tag<"ActiveCart", Item[]>;
type PaidCart = Tag<"PaidCart", Item[]>;

// ======================================================
// Errors

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

type CreateItem = (payload: CreateItemPayload) => Result<Item, never>;
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

const addToCart: AddToCart = (cart, item) => {
  if (cart._tag === "EmptyCart") {
    const activeCart = createActiveCart([item]);
    return activeCart;
  }

  const hasItem = cart.value.some((i) => i.value.id === item.value.id);
  if (hasItem) return error("ItemAlreadyInCart");

  return ok({ ...cart, value: [...cart.value, item] });
};

const removeFromCart: RemoveFromCart = (cart, itemId) => {
  const items = cart.value.filter((i) => i.value.id !== itemId);

  if (items.length === 0) return createEmptyCart();
  return createActiveCart(items);
};

const payForCart: PayForCart = (cart) => {
  return createPaidCart(cart.value);
};

// ======================================================
// Factories

const createItem: CreateItem = (payload) => {
  const item: Item = {
    _tag: "Item",
    value: {
      id: payload.id,
      name: payload.name,
      price: payload.price,
    },
  };

  return ok(item);
};

const createEmptyCart: CreateEmptyCart = () =>
  ok({
    _tag: "EmptyCart",
    value: [],
  });

const createActiveCart: CreateActiveCart = (items) =>
  ok({
    _tag: "ActiveCart",
    value: items,
  });

const createPaidCart: CreatePaidCart = (items) =>
  ok({
    _tag: "PaidCart",
    value: items,
  });

// ======================================================
// Examples

export function cartExamples() {
  const item = createItem({ id: "1", name: "Item 1", price: 100 });
  if (isError(item)) return;

  const createCartResult = createEmptyCart();
  if (isError(createCartResult)) return;

  const addToCartResult = addToCart(createCartResult.data, item.data);
  if (isError(addToCartResult)) return;

  const removeFromCartResult = removeFromCart(addToCartResult.data, "1");
  if (isError(removeFromCartResult)) return;

  const payForCartResult = payForCart(addToCartResult.data);
  if (isError(payForCartResult)) return;
}

// ======================================================
// Pipe Examples

const cartPipeExample = pipeResult(createEmptyCart())
  .flatMap((emptyCart) => {
    const item = createItem({ id: "1", name: "Laptop", price: 999 });
    if (isError(item)) return item;
    return addToCart(emptyCart, item.data);
  })
  .flatMap((activeCart) => {
    const duplicateItem = createItem({ id: "2", name: "Mouse", price: 25 });
    if (isError(duplicateItem)) return duplicateItem;
    return addToCart(activeCart, duplicateItem.data);
  })
  .flatMap((activeCart) => {
    const removeFromCartResult = removeFromCart(activeCart, "1");
    if (isError(removeFromCartResult)) return removeFromCartResult;
    return removeFromCartResult;
  })
  .flatMap((activeCart) => {
    if (activeCart._tag === "EmptyCart") return error("EmptyCart");

    const payForCartResult = payForCart(activeCart);
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
