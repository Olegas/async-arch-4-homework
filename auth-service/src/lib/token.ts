import * as jwt from 'jsonwebtoken';

export function generateToken(uuid: string) {
  return new Promise((res, rej) => {
    jwt.sign(
      {
        id: uuid
      },
      process.env.TOKEN_SIGN_KEY,
      (err, token) => {
        if (err) {
          return rej(err);
        }
        res(token);
      }
    );
  });
}

export function verifyToken(
  token: string
): Promise<false | Record<string, any>> {
  return new Promise((res) => {
    jwt.verify(token, process.env.TOKEN_SIGN_KEY, (err, decoded) => {
      if (err) {
        return res(false);
      }
      res(decoded);
    });
  });
}
