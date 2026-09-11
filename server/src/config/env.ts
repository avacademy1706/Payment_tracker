import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  port: Number(process.env.PORT ?? 5000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: required("JWT_SECRET", process.env.NODE_ENV === "test" ? "test-secret" : undefined),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "pt_token",
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@paymenttracker.com",
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
  seedAdminName: process.env.SEED_ADMIN_NAME ?? "Admin User",
};
