export type Tag<T, V = never> = {
  _tag: T;
  value: [V] extends [never] ? T : V;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function matchTag<T extends Tag<string, any>>(
  tagged: T,
  cases: {
    [K in T["_tag"]]: (tagged: Extract<T, { _tag: K }>) => void;
  }
) {
  return cases[tagged._tag as keyof typeof cases](
    tagged as Extract<T, { _tag: typeof tagged._tag }>
  );
}

// Type-safe factory function that ensures runtime matches type definition
export function createTag<T extends Tag<string, never>>(tag: T["_tag"]): T;
export function createTag<T extends Tag<string, unknown>>(
  tag: T["_tag"],
  value: T["value"]
): T;
export function createTag<T extends Tag<string, unknown>>(
  tag: T["_tag"],
  value?: T["value"]
): T {
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { _tag: tag, value: tag as any } as T;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { _tag: tag, value: value as any } as T;
}
