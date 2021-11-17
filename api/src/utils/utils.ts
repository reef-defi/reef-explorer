
class StatusError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const ensure = (condition: boolean, message: string, status=404): void => {
  if (!condition) {
    throw new StatusError(message, status);
  }
}

export const ensureObjectKeys = <Object extends {}, K extends keyof Object> (obj: Object, keys: K[]): void => {
  keys
    .forEach((key) => 
      ensure(!!obj[key], `Parameter ${key} is missing`, 400)
    );
}

export const errorStatus = (err: any): number => {
  if (err instanceof StatusError) {
    return err.status;
  }
  return 400;
}