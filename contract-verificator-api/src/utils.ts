
export const ensure = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(message);
  }
}

export const ensureObjectKeys = <Object extends {}, K extends keyof Object> (obj: Object, keys: K[]): void => {
  keys
    .forEach((key) => 
      ensure(!!obj[key], `Parameter ${key} is missing`)
    );
}