export type Result<T, E> =
  | { _tag: "Ok"; data: T }
  | { _tag: "Error"; error: E };

export const ok = <T>(data: T): Result<T, never> => {
  return { _tag: "Ok", data };
};

export const error = <E>(error: E): Result<never, E> => {
  return { _tag: "Error", error };
};

export const isOk = <T, E>(result: Result<T, E>): result is Result<T, E> => {
  return result._tag === "Ok";
};

export const isError = <T, E>(
  result: Result<T, E>
): result is Result<never, E> => {
  return result._tag === "Error";
};
