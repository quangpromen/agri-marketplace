import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import readline from "node:readline";
import { neon } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

const MIN_PASSWORD_LENGTH = 12;
const MAX_PASSWORD_LENGTH = 128;
const MIN_SECRET_LENGTH = 32;

const adminInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên quản trị viên cần tối thiểu 2 ký tự.")
    .max(100, "Tên quản trị viên tối đa 100 ký tự."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Địa chỉ email quản trị viên không hợp lệ.")
    .max(254, "Email tối đa 254 ký tự."),
  password: z
    .string()
    .min(
      MIN_PASSWORD_LENGTH,
      `Mật khẩu quản trị viên cần tối thiểu ${MIN_PASSWORD_LENGTH} ký tự.`
    )
    .max(
      MAX_PASSWORD_LENGTH,
      `Mật khẩu quản trị viên tối đa ${MAX_PASSWORD_LENGTH} ký tự.`
    ),
});

const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)]
);

const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

const authSchema = { user, session, account, verification };

function loadLocalEnvFile() {
  const envFile = join(process.cwd(), ".env.local");
  if (!existsSync(envFile)) {
    return {};
  }

  const parsed = {};
  const lines = readFileSync(envFile, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    parsed[key] = rawValue.replace(/^([\"'])(.*)\1$/, "$2");
  }

  return parsed;
}

function getEnvValue(key, fileEnv) {
  return process.env[key]?.trim() || fileEnv[key]?.trim() || "";
}

function promptLine(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptHiddenPassword(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new Error(
          "Không thể đọc mật khẩu ẩn khi không ở chế độ interactive TTY. Vui lòng truyền qua biến môi trường của lệnh CLI."
        )
      );
      return;
    }

    process.stdout.write(question);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let password = "";

    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(Boolean(wasRaw));
      stdin.pause();
    };

    const onData = (chunk) => {
      const char = String(chunk);

      if (char === "\r" || char === "\n" || char === "\u0004") {
        cleanup();
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (char === "\u0003") {
        cleanup();
        process.stdout.write("\n");
        reject(new Error("Đã hủy thao tác tạo quản trị viên."));
        return;
      }

      if (char === "\u007f" || char === "\b") {
        password = password.slice(0, -1);
        return;
      }

      password += char;
    };

    stdin.on("data", onData);
  });
}

async function resolveAdminCredentials() {
  const emailFromEnv = process.env.ADMIN_EMAIL?.trim();
  const nameFromEnv = process.env.ADMIN_NAME?.trim();
  const passwordFromEnv = process.env.ADMIN_PASSWORD;

  const email = emailFromEnv || (await promptLine("Email quản trị viên: "));
  const name = nameFromEnv || (await promptLine("Họ và tên quản trị viên: "));
  const password =
    typeof passwordFromEnv === "string" && passwordFromEnv.length > 0
      ? passwordFromEnv
      : await promptHiddenPassword("Mật khẩu quản trị viên (tối thiểu 12 ký tự, không hiển thị): ");

  const validation = adminInputSchema.safeParse({
    email,
    name,
    password,
  });

  if (!validation.success) {
    const messages = validation.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(`Dữ liệu tạo quản trị viên không hợp lệ:\n${messages}`);
  }

  return validation.data;
}

async function main() {
  const fileEnv = loadLocalEnvFile();
  const databaseUrl = getEnvValue("DATABASE_URL", fileEnv);
  const secret = getEnvValue("BETTER_AUTH_SECRET", fileEnv);
  const baseURL =
    getEnvValue("BETTER_AUTH_URL", fileEnv) ||
    getEnvValue("NEXT_PUBLIC_SITE_URL", fileEnv) ||
    "http://localhost:3000";

  if (!databaseUrl) {
    throw new Error("Thiếu cấu hình DATABASE_URL trong môi trường hoặc .env.local.");
  }

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `Thiếu hoặc cấu hình BETTER_AUTH_SECRET chưa hợp lệ (cần tối thiểu ${MIN_SECRET_LENGTH} ký tự).`
    );
  }

  const credentials = await resolveAdminCredentials();

  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql, schema: authSchema });

  // Chỉ bật signUp trong tiến trình CLI cục bộ này để dùng API chính thức của Better Auth.
  // Cấu hình server của website luôn giữ disableSignUp = true.
  const cliAuth = betterAuth({
    appName: "Mộc Farm Admin CLI",
    baseURL,
    secret,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: MAX_PASSWORD_LENGTH,
      autoSignIn: false,
    },
  });

  const authContext = await cliAuth.$context;
  const existingUser = await authContext.internalAdapter.findUserByEmail(credentials.email);

  if (existingUser?.user) {
    throw new Error(`Không thể tạo mới: Email quản trị viên "${credentials.email}" đã tồn tại.`);
  }

  const created = await cliAuth.api.signUpEmail({
    body: {
      email: credentials.email,
      name: credentials.name,
      password: credentials.password,
    },
  });

  if (!created?.user?.id) {
    throw new Error("Không thể khởi tạo tài khoản quản trị viên qua Better Auth.");
  }

  await authContext.internalAdapter.updateUser(created.user.id, {
    emailVerified: true,
  });

  console.log(
    `Đã tạo tài khoản quản trị viên thành công cho ${created.user.name} (${created.user.email}).`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo quản trị viên.");
  process.exit(1);
});

