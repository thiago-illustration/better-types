import { type Result, ok, error } from "./result";

/**
 * ResultPipe - A fluent API for chaining Result operations
 *
 * Provides a functional programming approach to working with Result types,
 * allowing you to chain operations in a readable, composable way.
 *
 * Key Features:
 * - Type-safe chaining of Result operations
 * - Union error type handling (different operations can have different error types)
 * - Side effects with tap/tapError
 * - Error recovery and transformation
 * - Conditional operations with filter
 *
 * @example
 * const result = pipeResult(ok(42))
 *   .tap((value) => console.log(`Processing: ${value}`))
 *   .map((value) => value * 2)
 *   .flatMap((value) => value > 50 ? ok(value) : error("TooSmall"))
 *   .tapError((error) => console.log(`Error: ${error}`))
 *   .unwrap();
 */
class ResultPipe<T, E> {
  readonly result: Result<T, E>;

  constructor(result: Result<T, E>) {
    this.result = result;
  }

  /**
   * Map over success value - transforms the success value without changing error type
   * @param fn - Function to map over success value
   * @returns ResultPipe with mapped value
   * @example
   * const result = pipeResult(ok(1))
   *   .map((value) => value + 1)
   *   .map((value) => `Number: ${value}`)
   *   .unwrap();
   */
  map<R>(fn: (value: T) => R): ResultPipe<R, E> {
    if (this.result._tag === "Ok") {
      return new ResultPipe(ok(fn(this.result.data)));
    } else {
      return new ResultPipe(error(this.result.error));
    }
  }

  /**
   * FlatMap - chain Result operations with different error types
   * @param fn - Function to chain Result operations
   * @returns ResultPipe with chained value and union error types
   * @example
   * const result = pipeResult(ok(1))
   *   .flatMap((value) => ok(value + 1))
   *   .flatMap((value) => error("Something went wrong"))
   *   .unwrap();
   */
  flatMap<R, F>(fn: (value: T) => Result<R, F>): ResultPipe<R, E | F> {
    if (this.result._tag === "Ok") {
      return new ResultPipe(fn(this.result.data));
    } else {
      return new ResultPipe(error(this.result.error));
    }
  }

  /**
   * Map over error value - transforms error values to different types
   * @param fn - Function to map over error value
   * @returns ResultPipe with mapped error value
   * @example
   * const result = pipeResult(error("NetworkError"))
   *   .mapError((error) => `Connection failed: ${error}`)
   *   .unwrap();
   */
  mapError<F>(fn: (error: E) => F): ResultPipe<T, F> {
    if (this.result._tag === "Ok") {
      return new ResultPipe(ok(this.result.data));
    } else {
      return new ResultPipe(error(fn(this.result.error)));
    }
  }

  /**
   * Tap - side effects without changing the Result (only executes on success)
   * @param fn - Function to tap (only called if Result is Ok)
   * @returns ResultPipe with same value (unchanged)
   * @example
   * const result = pipeResult(ok(42))
   *   .tap((value) => console.log(`Processing: ${value}`))
   *   .map((value) => value * 2)
   *   .unwrap();
   */
  tap(fn: (value: T) => void): ResultPipe<T, E> {
    if (this.result._tag === "Ok") {
      fn(this.result.data);
    }
    return this;
  }

  /**
   * Tap error - side effects on errors (only executes on error)
   * @param fn - Function to tap error (only called if Result is Error)
   * @returns ResultPipe with same value (unchanged)
   * @example
   * const result = pipeResult(error("Something went wrong"))
   *   .tapError((error) => console.log(`Error occurred: ${error}`))
   *   .mapError((error) => `Handled: ${error}`)
   *   .unwrap();
   */
  tapError(fn: (error: E) => void): ResultPipe<T, E> {
    if (this.result._tag === "Error") {
      fn(this.result.error);
    }
    return this;
  }

  /**
   * Filter - conditionally continue based on success value
   * @param predicate - Function to filter (returns true to continue, false to fail)
   * @param errorValue - Error value to return if predicate fails
   * @returns ResultPipe with filtered value or error
   * @example
   * const result = pipeResult(ok(42))
   *   .filter((value) => value > 0, "ValueTooSmall")
   *   .map((value) => `Valid: ${value}`)
   *   .unwrap();
   */
  filter(predicate: (value: T) => boolean, errorValue: E): ResultPipe<T, E> {
    if (this.result._tag === "Ok") {
      return new ResultPipe(
        predicate(this.result.data) ? ok(this.result.data) : error(errorValue)
      );
    } else {
      return new ResultPipe(error(this.result.error));
    }
  }

  /**
   * Recover - provide fallback value on error (converts error to success)
   * @param fn - Function to recover from error (returns fallback value)
   * @returns ResultPipe with recovered value (never fails)
   * @example
   * const result = pipeResult(error("NetworkError"))
   *   .recover((error) => "Default value")
   *   .map((value) => `Recovered: ${value}`)
   *   .unwrap();
   */
  recover(fn: (error: E) => T): ResultPipe<T, never> {
    if (this.result._tag === "Ok") {
      return new ResultPipe(ok(this.result.data));
    } else {
      return new ResultPipe(ok(fn(this.result.error)));
    }
  }

  /**
   * Unwrap the Result - extracts the final Result value
   * @returns The final Result<T, E> value
   * @example
   * const result = pipeResult(ok(42))
   *   .map((value) => value * 2)
   *   .unwrap();
   *
   * if (result._tag === "Ok") {
   *   console.log(result.data); // 84
   * }
   */
  unwrap(): Result<T, E> {
    return this.result;
  }

  /**
   * Unwrap with default value - extracts success value or returns default on error
   * @param defaultValue - Value to return if Result is Error
   * @returns The success value or default value
   * @example
   * const value = pipeResult(ok(42))
   *   .map((value) => value * 2)
   *   .unwrapOr(0);
   *
   * console.log(value); // 84
   *
   * const defaultValue = pipeResult(error("Failed"))
   *   .unwrapOr("Default");
   *
   * console.log(defaultValue); // "Default"
   */
  unwrapOr(defaultValue: T): T {
    if (this.result._tag === "Ok") {
      return this.result.data;
    } else {
      return defaultValue;
    }
  }

  /**
   * Unwrap or throw - extracts success value or throws error
   * @returns The success value
   * @throws Error if Result is Error
   * @example
   * const value = pipeResult(ok(42))
   *   .map((value) => value * 2)
   *   .unwrapOrThrow();
   *
   * console.log(value); // 84
   *
   * // This will throw:
   * // const error = pipeResult(error("Failed")).unwrapOrThrow();
   */
  unwrapOrThrow(): T {
    if (this.result._tag === "Ok") {
      return this.result.data;
    } else {
      throw new Error(String(this.result.error));
    }
  }
}

/**
 * Creates a new ResultPipe from a Result value
 *
 * @param result - The Result value to wrap in a pipe
 * @returns A new ResultPipe instance
 *
 * @example
 * const pipe = pipeResult(ok(42));
 * const result = pipe
 *   .map((value) => value * 2)
 *   .unwrap();
 */
export const pipeResult = <T, E>(result: Result<T, E>): ResultPipe<T, E> =>
  new ResultPipe(result);
