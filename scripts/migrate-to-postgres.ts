// migrate-to-postgres.ts
import { PrismaClient } from "@prisma/client";
import { setTimeout } from "timers/promises";

// Create two prisma clients with different configurations
const sqlitePrisma = new PrismaClient({
  datasourceUrl: "file:./prisma/bible.db",
});

const postgresPrisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

// Retry logic for database operations
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      await setTimeout(delay);
      return withRetry(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function migrateTranslations() {
  console.log("📚 Migrating translations...");
  const translations = await sqlitePrisma.translation.findMany();

  for (const translation of translations) {
    await withRetry(() =>
      postgresPrisma.translation.upsert({
        where: { id: translation.id },
        create: translation,
        update: translation,
      })
    );
  }
  console.log(`✅ Migrated ${translations.length} translations`);
}

async function migrateBooks() {
  console.log("📖 Migrating books...");
  const books = await sqlitePrisma.book.findMany();

  for (const book of books) {
    await withRetry(() =>
      postgresPrisma.book.upsert({
        where: { id: book.id },
        create: book,
        update: book,
      })
    );
  }
  console.log(`✅ Migrated ${books.length} books`);
}

async function migrateChapters() {
  console.log("📑 Migrating chapters...");
  const chapters = await sqlitePrisma.chapter.findMany();

  for (const chapter of chapters) {
    await withRetry(() =>
      postgresPrisma.chapter.upsert({
        where: { id: chapter.id },
        create: chapter,
        update: chapter,
      })
    );
  }
  console.log(`✅ Migrated ${chapters.length} chapters`);
}

async function migrateVerseTranslations() {
  console.log("✍️ Migrating verses...");
  const BATCH_SIZE = 100; // Smaller batch size for reliability
  let skip = 0;
  let count = 0;
  let hasMore = true;

  while (hasMore) {
    const verses = await sqlitePrisma.verseTranslation.findMany({
      take: BATCH_SIZE,
      skip: skip,
    });

    hasMore = verses.length === BATCH_SIZE;

    if (verses.length > 0) {
      // Process each verse individually with retry logic
      for (const verse of verses) {
        await withRetry(() =>
          postgresPrisma.verseTranslation.upsert({
            where: { id: verse.id },
            create: verse,
            update: verse,
          })
        );
        count++;

        if (count % 1000 === 0) {
          console.log(`Migrated ${count} verses...`);
        }
      }
    }

    skip += BATCH_SIZE;
  }

  console.log(`✅ Migrated ${count} verses total`);
}

async function cleanupTables() {
  console.log("🧹 Cleaning up existing tables...");
  const tables = ["VerseTranslation", "Chapter", "Book", "Translation"];

  for (const table of tables) {
    try {
      // @ts-ignore - Using raw query for cleanup
      await postgresPrisma.$executeRaw`TRUNCATE TABLE "${table}" CASCADE;`;
    } catch (error) {
      console.log(`Note: Table ${table} might not exist yet`);
    }
  }
}

async function migrate() {
  console.log("🚀 Starting migration to PostgreSQL...");

  try {
    // Clean up existing data
    await cleanupTables();

    // Migrate in order of dependencies
    await migrateTranslations();
    await migrateBooks();
    await migrateChapters();
    await migrateVerseTranslations();

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresPrisma.$disconnect();
  }
}

// Run the migration
migrate();
