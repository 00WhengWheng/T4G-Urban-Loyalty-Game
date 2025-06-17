import { GameException, NFCException } from './domain.exception';
import { errorMessages } from './error.messages';

export class ExceptionFactory {
  static createGameException(code: string, params?: any): GameException {
    const message = errorMessages[code] || 'Errore generico';
    return new GameException(this.formatMessage(message, params), code);
  }

  static createNFCException(code: string, params?: any): NFCException {
    const message = errorMessages[code] || 'Errore NFC generico';
    return new NFCException(this.formatMessage(message, params), code);
  }

  private static formatMessage(message: string, params?: any): string {
    if (!params) return message;
    return Object.keys(params).reduce((msg, key) => {
      return msg.replace(`{${key}}`, params[key]);
    }, message);
  }
}