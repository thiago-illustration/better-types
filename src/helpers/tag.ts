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
