import jwt from "jsonwebtoken";
import { expressjwt } from "express-jwt";

/**
 * Auth class to handle JWT token verification. This can be used in cases where
 * you need to verify a token on an API service but you can't use the express.js
 * middleware.
 */
export class Auth {
  constructor({ secret }) {
    this.secret = secret || process.env.SHARED_TOKEN_SECRET;
  }

  verify(token) {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded;
    } catch (err) {
      console.error(err);
      return;
    }
  }
}
/**
 * Express.js middleware to add support for JWT token verification.
 */
export const authMiddleware = ({ secret } = {}) => {
  return expressjwt({
    secret: secret || process.env.SHARED_TOKEN_SECRET,
    algorithms: ["HS256"],
  });
};
