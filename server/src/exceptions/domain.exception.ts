export class GameException extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'GameException';
  }
}

export class NFCException extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'NFCException';
  }
}