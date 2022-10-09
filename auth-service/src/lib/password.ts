import { scrypt } from 'crypto';

export function hashPassword(password: string): Promise<string> {
  return new Promise((res, rej) => {
    scrypt(password, process.env.SALT, 64, (err, key) => {
      if (err) {
        return rej(err);
      }
      res(key);
    });
  }).then((key: Buffer) => key.toString('base64'));
}
