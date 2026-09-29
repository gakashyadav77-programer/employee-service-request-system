const fs = require("fs");
const path = require("path");
const db = require("../config/db");

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    await db.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsPath = path.join(__dirname, "../migrations");

    const files = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const [existing] = await db.query(
        "SELECT id FROM schema_migrations WHERE migration_name = ?",
        [file]
      );

      if (existing.length > 0) {
        console.log(`Already applied: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(
        path.join(migrationsPath, file),
        "utf8"
      );

      // Split the migration into individual SQL statements.
      const statements = sql
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);

      for (const statement of statements) {
        await db.query(statement);
      }

      await db.query(
        `INSERT INTO schema_migrations (migration_name)
         VALUES (?)`,
        [file]
      );

      console.log(`Migration applied: ${file}`);
    }

    console.log("Database migrations completed successfully.");

    await db.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

runMigrations();