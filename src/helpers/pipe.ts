/* eslint-disable @typescript-eslint/no-explicit-any */

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
   * Map with automatic Result wrapping - automatically wraps return value in ok()
   * @param fn - Function that receives current value, returns value (not Result)
   * @returns ResultPipe with chained value wrapped in Result
   * @example
   * const result = pipeResult(ok(1))
   *   .mapToResult((value) => value + 1)
   *   .mapToResult((value) => `Number: ${value}`)
   *   .unwrap();
   */
  mapToResult<R>(fn: (value: T) => R): ResultPipe<R, E> {
    if (this.result._tag === "Ok") {
      return new ResultPipe(ok(fn(this.result.data)));
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
 * ContextPipe - A ResultPipe with context support for accumulating values
 *
 * Allows you to store and retrieve values throughout the pipe chain,
 * solving the problem of needing values from earlier in the chain later on.
 *
 * @example
 * const result = pipeResultWithContext(ok(100))
 *   .setContext((amount, ctx) => ctx.set("amount", amount))
 *   .flatMap((amount) => ok(amount * 2))
 *   .flatMap((doubled, ctx) => ok({
 *     original: ctx.get("amount"),
 *     doubled: doubled
 *   }))
 *   .unwrap();
 */
class ContextPipe<T, E, C extends Record<string, any> = Record<string, never>> {
  readonly result: Result<T, E>;
  readonly context: C;

  constructor(result: Result<T, E>, context: C = {} as C) {
    this.result = result;
    this.context = context;
  }

  /**
   * Set a value in the context
   * @param fn - Function that receives current value and context, returns updated context
   * @returns ContextPipe with updated context
   */
  setContext(
    fn: (value: T, ctx: Context<C>) => Context<C>
  ): ContextPipe<T, E, C> {
    if (this.result._tag === "Ok") {
      const newContext = fn(this.result.data, new Context(this.context));
      return new ContextPipe(this.result, newContext.getContext());
    } else {
      return new ContextPipe(error(this.result.error), this.context);
    }
  }

  /**
   * Map over success value with access to context
   * @param fn - Function that receives current value and context
   * @returns ContextPipe with mapped value
   */
  map<R>(fn: (value: T, ctx: Context<C>) => R): ContextPipe<R, E, C> {
    if (this.result._tag === "Ok") {
      return new ContextPipe(
        ok(fn(this.result.data, new Context(this.context))),
        this.context
      );
    } else {
      return new ContextPipe(error(this.result.error), this.context);
    }
  }

  /**
   * FlatMap with access to context
   * @param fn - Function that receives current value and context, returns Result
   * @returns ContextPipe with chained value
   */
  flatMap<R, F>(
    fn: (value: T, ctx: Context<C>) => Result<R, F>
  ): ContextPipe<R, E | F, C> {
    if (this.result._tag === "Ok") {
      return new ContextPipe(
        fn(this.result.data, new Context(this.context)),
        this.context
      );
    } else {
      return new ContextPipe(error(this.result.error), this.context);
    }
  }

  /**
   * Map with automatic Result wrapping - automatically wraps return value in ok()
   * @param fn - Function that receives current value and context, returns value (not Result)
   * @returns ContextPipe with chained value wrapped in Result
   */
  mapToResult<R>(fn: (value: T, ctx: Context<C>) => R): ContextPipe<R, E, C> {
    if (this.result._tag === "Ok") {
      return new ContextPipe(
        ok(fn(this.result.data, new Context(this.context))),
        this.context
      );
    } else {
      return new ContextPipe(error(this.result.error), this.context);
    }
  }

  /**
   * Unwrap the Result
   * @returns The final Result<T, E> value
   */
  unwrap(): Result<T, E> {
    return this.result;
  }

  /**
   * Get the current context
   * @returns The current context
   */
  getContext(): C {
    return this.context;
  }
}

/**
 * Context helper class for type-safe context operations
 */
class Context<C extends Record<string, any>> {
  private context: C;

  constructor(context: C) {
    this.context = { ...context };
  }

  /**
   * Set a value in the context
   * @param key - The key to set
   * @param value - The value to set
   * @returns New Context instance with updated value
   */
  set<K extends string, V>(key: K, value: V): Context<C & Record<K, V>> {
    return new Context({ ...this.context, [key]: value } as C & Record<K, V>);
  }

  /**
   * Get a value from the context
   * @param key - The key to get
   * @returns The value or undefined
   */
  get<K extends keyof C>(key: K): C[K] | undefined {
    return this.context[key];
  }

  /**
   * Get the current context object
   * @returns The current context
   */
  getContext(): C {
    return this.context;
  }
}

/**
 * Creates a new ContextPipe from a Result value
 *
 * @param result - The Result value to wrap in a context pipe
 * @returns A new ContextPipe instance
 *
 * @example
 * const pipe = pipeResultWithContext(ok(42));
 * const result = pipe
 *   .setContext((value, ctx) => ctx.set("amount", value))
 *   .map((value, ctx) => value * 2)
 *   .unwrap();
 */
export const pipeResultWithContext = <
  T,
  E,
  C extends Record<string, any> = Record<string, never>
>(
  result: Result<T, E>
): ContextPipe<T, E, C> => new ContextPipe(result);

/**
 * Creates a new ContextPipe with a specific context type and proper type inference
 *
 * @param result - The Result value to wrap in a context pipe
 * @returns A new ContextPipe instance with inferred types and specified context
 *
 * @example
 * const pipe = pipeWithContext<{ amount: Amount }>(createAmount(100));
 * const result = pipe
 *   .setContext((amount, ctx) => ctx.set("amount", amount))
 *   .flatMap((card, ctx) => ok({ amount: ctx.get("amount")! }))
 *   .unwrap();
 */
export function pipeWithContext<C extends Record<string, any>>(
  result: Result<any, any>
): ContextPipe<any, any, C>;
export function pipeWithContext<T, E, C extends Record<string, any>>(
  result: Result<T, E>
): ContextPipe<T, E, C>;
export function pipeWithContext<T, E, C extends Record<string, any>>(
  result: Result<T, E>
): ContextPipe<T, E, C> {
  return new ContextPipe(result);
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
