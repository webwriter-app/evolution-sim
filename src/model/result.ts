class Ok<T> {
  readonly value: T;
  constructor(value: T) {
    this.value = value;
  }
  isOk(): this is Ok<T> {
    return true;
  }
  isErr(): this is Err<never> {
    return false;
  }
}

class Err<E> {
  readonly error: E;
  constructor(error: E) {
    this.error = error;
  }
  isOk(): this is Ok<never> {
    return false;
  }
  isErr(): this is Err<E> {
    return true;
  }
}

export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => new Ok(value);
export const err = <E>(error: E): Err<E> => new Err(error);
