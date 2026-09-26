import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_ACCESS_SECRET!;
const refreshSecret = process.env.JWT_REFRESH_SECRET!;

export function generateAccessToken(userId: number, role: string) {
  return jwt.sign(
    { userId, role },
    accessSecret,
    { expiresIn: "15m" }
  );
}

export function generateRefreshToken(userId: number) {
  return jwt.sign(
    { userId },
    refreshSecret,
    { expiresIn: "7d" }
  );
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, accessSecret);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, refreshSecret);
}