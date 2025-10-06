import { pipeResult } from "../helpers/pipe";
import { type Result, error, isError, ok } from "../helpers/result";
import { type Tag } from "../helpers/tag";

/**
 * Illegal states avoided by types:
 * - A shipped package should NEVER be shipped again
 * - A package that was not shipped should NEVER be delivered
 * - A delivered package should NEVER be shipped
 */

// ======================================================
// Types

type UnshippedPackage = Tag<"UnshippedPackage", string>;
type ShippedPackage = Tag<"ShippedPackage", string>;
type DeliveredPackage = Tag<"DeliveredPackage", string>;

// ======================================================
// Errors

type ShipPackageError = "UnableToShipPackage";
type DeliverPackageError = "UnableToDeliverPackage";

// ======================================================
// Functions Types

type CreateUnshippedPackage = (id: string) => Result<UnshippedPackage, never>;
type CreateShippedPackage = (id: string) => Result<ShippedPackage, never>;
type CreateDeliveredPackage = (id: string) => Result<DeliveredPackage, never>;

type ShipPackage = (
  pkg: UnshippedPackage
) => Result<ShippedPackage, ShipPackageError>;

type DeliverPackage = (
  pkg: ShippedPackage
) => Result<DeliveredPackage, DeliverPackageError>;

// ======================================================
// Functions
// Function names starting with "try" are not guaranteed to succeed and should return a Result type

const tryShipPackage: ShipPackage = (pkg) => {
  const shippedPackage = createShippedPackage(pkg.value);

  if (isError(shippedPackage)) return error("UnableToShipPackage");
  return ok(shippedPackage.data);
};

const tryDeliverPackage: DeliverPackage = (pkg) => {
  const deliveredPackage = createDeliveredPackage(pkg.value);

  if (isError(deliveredPackage)) return error("UnableToDeliverPackage");
  return ok(deliveredPackage.data);
};

// ======================================================
// Factories

const createUnshippedPackage: CreateUnshippedPackage = (id) =>
  ok({
    _tag: "UnshippedPackage",
    value: id,
  });

const createShippedPackage: CreateShippedPackage = (id) =>
  ok({
    _tag: "ShippedPackage",
    value: id,
  });

const createDeliveredPackage: CreateDeliveredPackage = (id) =>
  ok({
    _tag: "DeliveredPackage",
    value: id,
  });

// ======================================================
// Examples

export function packageExamples() {
  const createUnshippedPackageResult = createUnshippedPackage("1");
  if (isError(createUnshippedPackageResult)) return;

  const shipPackageResult = tryShipPackage(createUnshippedPackageResult.data);
  if (isError(shipPackageResult)) return;

  const deliverPackageResult = tryDeliverPackage(shipPackageResult.data);
  if (isError(deliverPackageResult)) return;
}

// ======================================================
// Pipe Examples

const deliveryPipeExample = pipeResult(createUnshippedPackage("1"))
  .flatMap((unshippedPackage) => tryShipPackage(unshippedPackage))
  .flatMap((shippedPackage) => tryDeliverPackage(shippedPackage));

export function deliveryPipeExamples() {
  const result = deliveryPipeExample.unwrap();

  if (isError(result)) return;
  return result.data;
}
