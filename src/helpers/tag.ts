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

export function createTagged<T extends string>(tag: T): Tag<T>;
export function createTagged<T extends string, V>(tag: T, value: V): Tag<T, V>;
export function createTagged<T extends string, V>(
  tag: T,
  value?: V
): Tag<T, V> {
  if (value === undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { _tag: tag, value: tag as any };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { _tag: tag, value: value as any };
}
