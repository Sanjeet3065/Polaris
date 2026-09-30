import path from "path";
import fs from "fs";
import net from "net";
import dotenv from "dotenv";
import EmbeddedPostgres from "embedded-postgres";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = 5432;
const USER = "polaris_admin";
const PASSWORD = "polaris_secure_password";
const DATABASE = "polaris_db";
const DATA_DIR = path.resolve(__dirname, "../data/postgres");

function checkPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, "127.0.0.1", () => {
      socket.end();
      resolve(true);
    });
  });
}

async function start() {
  console.log("=================================================");
  console.log("POLARIS PostgreSQL Database Manager");
  console.log("=================================================");

  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1")) {
    console.log("☁️  Remote cloud database configured (Supabase/Neon). Skipping local embedded Postgres.");
    return;
  }

  const isRunning = await checkPortInUse(PORT);
  if (isRunning) {
    console.log(`✅ PostgreSQL is already running and listening on port ${PORT}.`);
    console.log(`Connection URL: postgresql://${USER}:****@localhost:${PORT}/${DATABASE}?schema=public`);
    return;
  }

  console.log(`Starting PostgreSQL service on port ${PORT}...`);
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    port: PORT,
    user: USER,
    password: PASSWORD,
    authMethod: "password",
    persistent: true,
    onLog: (msg: string) => {
      if (msg.includes("LOG:") || msg.includes("ready to accept connections")) {
        console.log(`[postgres] ${msg.trim()}`);
      }
    },
    onError: (err: string) => {
      console.error(`[postgres error] ${err.trim()}`);
    }
  });

  const isInitialized = fs.existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (!isInitialized) {
    console.log("Initializing new PostgreSQL cluster...");
    await pg.initialise();
  }

  await pg.start();
  console.log("PostgreSQL server process started.");

  try {
    await pg.createDatabase(DATABASE);
    console.log(`Database '${DATABASE}' verified/created.`);
  } catch {
    // Database might already exist, which is fine
  }

  console.log(`✅ PostgreSQL is ready on port ${PORT}!`);
  console.log(`DATABASE_URL="postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public"`);

  const shutdown = async () => {
    console.log("\nStopping PostgreSQL service...");
    try {
      await pg.stop();
      console.log("PostgreSQL stopped cleanly.");
    } catch {
      // ignore
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Keep alive
  setInterval(() => {}, 10000);
}

start().catch((err) => {
  console.error("Failed to start PostgreSQL:", err);
  process.exit(1);
});
