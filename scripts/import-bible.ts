import prisma from "../src/utils/prisma";
import fs from "fs/promises";
import { statSync } from "fs";
import path from "path";
import sqlite3 from "sqlite3";
import { Database, open } from "sqlite";

const TRANSLATIONS_DIR = path.join(process.cwd(), "BibleTranslations");

// Map of book numbers to testament
const TESTAMENT_MAP: { [key: number]: "old" | "new" } = {};
for (let i = 1; i <= 39; i++) TESTAMENT_MAP[i] = "old";
for (let i = 40; i <= 66; i++) TESTAMENT_MAP[i] = "new";

// Map of book names to short names
const BOOK_SHORT_NAMES: { [key: string]: string } = {
  Genesis: "Gen",
  Exodus: "Exo",
  Leviticus: "Lev",
  Numbers: "Num",
  Deuteronomy: "Deu",
  Joshua: "Jos",
  Judges: "Jdg",
  Ruth: "Rut",
  "1 Samuel": "1Sa",
  "2 Samuel": "2Sa",
  "1 Kings": "1Ki",
  "2 Kings": "2Ki",
  "1 Chronicles": "1Ch",
  "2 Chronicles": "2Ch",
  Ezra: "Ezr",
  Nehemiah: "Neh",
  Esther: "Est",
  Job: "Job",
  Psalms: "Psa",
  Proverbs: "Pro",
  Ecclesiastes: "Ecc",
  "Song of Solomon": "Sng",
  Isaiah: "Isa",
  Jeremiah: "Jer",
  Lamentations: "Lam",
  Ezekiel: "Ezk",
  Daniel: "Dan",
  Hosea: "Hos",
  Joel: "Joe",
  Amos: "Amo",
  Obadiah: "Oba",
  Jonah: "Jon",
  Micah: "Mic",
  Nahum: "Nah",
  Habakkuk: "Hab",
  Zephaniah: "Zep",
  Haggai: "Hag",
  Zechariah: "Zec",
  Malachi: "Mal",
  Matthew: "Mat",
  Mark: "Mrk",
  Luke: "Luk",
  John: "Jhn",
  Acts: "Act",
  Romans: "Rom",
  "1 Corinthians": "1Co",
  "2 Corinthians": "2Co",
  Galatians: "Gal",
  Ephesians: "Eph",
  Philippians: "Php",
  Colossians: "Col",
  "1 Thessalonians": "1Th",
  "2 Thessalonians": "2Th",
  "1 Timothy": "1Ti",
  "2 Timothy": "2Ti",
  Titus: "Tit",
  Philemon: "Phm",
  Hebrews: "Heb",
  James: "Jas",
  "1 Peter": "1Pe",
  "2 Peter": "2Pe",
  "1 John": "1Jn",
  "2 John": "2Jn",
  "3 John": "3Jn",
  Jude: "Jud",
  Revelation: "Rev",
};

class SimpleSpinner {
  private text: string;

  constructor(text: string) {
    this.text = text;
    this.start();
  }

  start() {
    console.log(`\n📦 ${this.text}`);
    return this;
  }

  setText(newText: string) {
    this.text = newText;
    process.stdout.write(`\r⏳ ${this.text}`);
  }

  succeed(text: string) {
    console.log(`\n✅ ${text}`);
  }

  fail(text: string) {
    console.log(`\n❌ ${text}`);
  }
}

async function setupTempDatabase() {
  const db = await open({
    filename: `:memory:`,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS temp_verses (
      book_id INTEGER NOT NULL,
      book TEXT NOT NULL,
      chapter INTEGER NOT NULL,
      verse INTEGER NOT NULL,
      text TEXT NOT NULL
    )
  `);

  return db;
}

async function importSqlToTemp(
  db: Database<sqlite3.Database, sqlite3.Statement>,
  sqlPath: string
) {
  const sqlContent = await fs.readFile(sqlPath, "utf-8");

  // Skip the CREATE TABLE statement
  const insertStart = sqlContent.indexOf("INSERT INTO");
  if (insertStart === -1) {
    throw new Error("No INSERT statements found in SQL file");
  }

  // Process the content after skipping CREATE TABLE
  const insertContent = sqlContent
    .slice(insertStart)
    .replace(/INSERT INTO [`"]?\w+[`"]?/g, "INSERT INTO temp_verses");

  await db.exec("BEGIN TRANSACTION");
  try {
    await db.exec(insertContent);
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

async function createBooksAndChapters() {
  console.log("\n📚 Creating books and chapters structure...");

  // Use the first translation file to get the structure
  const directories = await fs.readdir(TRANSLATIONS_DIR);
  const firstTransDir = directories.find(
    (dir) =>
      !dir.startsWith(".") &&
      statSync(path.join(TRANSLATIONS_DIR, dir)).isDirectory()
  );

  if (!firstTransDir) {
    throw new Error("No translation directories found");
  }

  const db = await setupTempDatabase();
  const sqlPath = path.join(
    TRANSLATIONS_DIR,
    firstTransDir,
    `${firstTransDir}_bible.sql`
  );

  try {
    await importSqlToTemp(db, sqlPath);

    // Create all books
    const books = await db.all(
      "SELECT DISTINCT book_id, book FROM temp_verses ORDER BY book_id"
    );

    for (const book of books) {
      await prisma.book.upsert({
        where: {
          number: book.book_id,
        },
        create: {
          number: book.book_id,
          name: book.book,
          shortName: BOOK_SHORT_NAMES[book.book] || book.book.substring(0, 3),
          testament: TESTAMENT_MAP[book.book_id],
        },
        update: {},
      });
    }

    // Get all books with their IDs
    const booksWithIds = await prisma.book.findMany({
      select: { id: true, number: true },
    });
    const bookIdMap = new Map(booksWithIds.map((b) => [b.number, b.id]));

    // Create chapters for each book
    const chapters = await db.all(`
      SELECT DISTINCT book_id, chapter 
      FROM temp_verses 
      ORDER BY book_id, chapter
    `);

    for (const ch of chapters) {
      await prisma.chapter.upsert({
        where: {
          number_bookId: {
            number: ch.chapter,
            bookId: bookIdMap.get(ch.book_id)!,
          },
        },
        create: {
          number: ch.chapter,
          bookId: bookIdMap.get(ch.book_id)!,
        },
        update: {},
      });
    }

    await db.close();
    return { bookIdMap };
  } catch (error) {
    await db.close();
    throw error;
  }
}

async function importTranslation(
  translationDir: string,
  bookIdMap: Map<number, number>
) {
  const shortName = path.basename(translationDir);
  const spinner = new SimpleSpinner(`Processing ${shortName}`);

  try {
    const db = await setupTempDatabase();
    const sqlPath = path.join(translationDir, `${shortName}_bible.sql`);

    // Read and execute the SQL file
    spinner.setText(`Reading SQL file for ${shortName}`);
    await importSqlToTemp(db, sqlPath);

    // Create translation record
    spinner.setText(`Creating translation record for ${shortName}`);
    const translation = await prisma.translation.create({
      data: {
        code: shortName,
        name: shortName,
        language: "en",
      },
    });

    // Get chapter IDs
    const chaptersWithIds = await prisma.chapter.findMany({
      where: {
        book: {
          number: { in: Array.from(bookIdMap.keys()) },
        },
      },
      select: { id: true, number: true, bookId: true },
    });

    const chapterIdMap = new Map(
      chaptersWithIds.map((ch) => [`${ch.bookId}-${ch.number}`, ch.id])
    );

    // Create verses in batches using transaction
    spinner.setText(`Creating verses for ${shortName}`);
    const verses = await db.all(`
      SELECT book_id, chapter, verse, text 
      FROM temp_verses 
      ORDER BY book_id, chapter, verse
    `);

    // Process verses in larger batches
    const VERSE_BATCH_SIZE = 100;
    for (let i = 0; i < verses.length; i += VERSE_BATCH_SIZE) {
      spinner.setText(
        `Creating verses for ${shortName} (${Math.min(
          i + VERSE_BATCH_SIZE,
          verses.length
        )}/${verses.length})`
      );
      const batch = verses.slice(i, i + VERSE_BATCH_SIZE);

      await prisma.$transaction(
        batch.map((v) =>
          prisma.verseTranslation.create({
            data: {
              number: v.verse,
              text: v.text,
              chapterId: chapterIdMap.get(
                `${bookIdMap.get(v.book_id)}-${v.chapter}`
              )!,
              translationId: translation.id,
            },
          })
        )
      );
    }

    await db.close();
    spinner.succeed(`Successfully imported ${shortName}`);
  } catch (error) {
    spinner.fail(`Error importing ${shortName}`);
    console.error(error);
  }
}

async function importAllTranslations() {
  console.log("\n🚀 Starting Bible translations import...\n");
  console.time("Total import time");

  try {
    const directories = await fs.readdir(TRANSLATIONS_DIR);
    const translationDirs = directories.filter(
      (dir) =>
        !dir.startsWith(".") &&
        statSync(path.join(TRANSLATIONS_DIR, dir)).isDirectory()
    );

    console.log(`📚 Found ${translationDirs.length} translations to import\n`);

    // First create the books and chapters structure
    const { bookIdMap } = await createBooksAndChapters();

    // Then process translations in parallel with a concurrency limit
    const CONCURRENT_IMPORTS = 3;
    for (let i = 0; i < translationDirs.length; i += CONCURRENT_IMPORTS) {
      const batch = translationDirs.slice(i, i + CONCURRENT_IMPORTS);
      await Promise.all(
        batch.map((dir) =>
          importTranslation(path.join(TRANSLATIONS_DIR, dir), bookIdMap)
        )
      );
    }

    console.timeEnd("Total import time");
    console.log("\n✨ All translations imported successfully\n");
  } catch (error) {
    console.error("\n❌ Error importing translations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importAllTranslations();
