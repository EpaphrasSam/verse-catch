import sqlite3
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_sqlite_tables(sqlite_cursor):
    sqlite_cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name IN ('Translation', 'Book', 'Chapter', 'VerseTranslation');
    """)
    return [table[0] for table in sqlite_cursor.fetchall()]

def get_table_columns(sqlite_cursor, table):
    sqlite_cursor.execute(f"PRAGMA table_info({table});")
    return [(col[1], col[2]) for col in sqlite_cursor.fetchall()]

def clean_existing_tables(pg_cursor):
    print("Cleaning up existing tables...")
    pg_cursor.execute("""
    DROP TABLE IF EXISTS 
        "VerseTranslation", "Chapter", "Book", "Translation",
        versetranslation, chapter, book, translation 
    CASCADE;
    """)
    print("✅ Existing tables cleaned up")

def create_postgres_tables(pg_cursor):
    # Create tables with proper relationships
    pg_cursor.execute("""
    CREATE TABLE IF NOT EXISTS "Translation" (
        "id" SERIAL PRIMARY KEY,
        "code" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "language" TEXT NOT NULL DEFAULT 'en'
    );

    CREATE TABLE IF NOT EXISTS "Book" (
        "id" SERIAL PRIMARY KEY,
        "number" INTEGER UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "shortName" TEXT NOT NULL,
        "testament" TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "Chapter" (
        "id" SERIAL PRIMARY KEY,
        "number" INTEGER NOT NULL,
        "bookId" INTEGER NOT NULL REFERENCES "Book"("id"),
        UNIQUE("number", "bookId")
    );

    CREATE TABLE IF NOT EXISTS "VerseTranslation" (
        "id" SERIAL PRIMARY KEY,
        "number" INTEGER NOT NULL,
        "text" TEXT NOT NULL,
        "translationId" INTEGER NOT NULL REFERENCES "Translation"("id"),
        "chapterId" INTEGER NOT NULL REFERENCES "Chapter"("id"),
        UNIQUE("number", "chapterId", "translationId")
    );
    """)

def migrate_table(sqlite_cursor, pg_cursor, table):
    print(f"Migrating table: {table}")
    
    # Get data from SQLite
    sqlite_cursor.execute(f"SELECT * FROM {table}")
    rows = sqlite_cursor.fetchall()
    
    if not rows:
        print(f"No data in table {table}")
        return
    
    # Get column names
    columns = [desc[0] for desc in sqlite_cursor.description]
    
    # Prepare INSERT statement
    placeholders = ','.join(['%s'] * len(columns))
    insert_sql = f"""INSERT INTO "{table}" ({','.join(f'"{col}"' for col in columns)}) 
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING"""
    
    # Insert in batches
    batch_size = 1000
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        pg_cursor.executemany(insert_sql, batch)
        print(f"Inserted {min(i + batch_size, len(rows))}/{len(rows)} rows in {table}")

def main():
    sqlite_path = "/mnt/c/Users/New/Desktop/Projects/verse-catch/prisma/bible.db"
    pg_conn_string = "dbname=bible_temp user=postgres password=postgres host=localhost"
    
    print("Opening connections...")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_cursor = sqlite_conn.cursor()
    
    pg_conn = psycopg2.connect(pg_conn_string)
    pg_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    pg_cursor = pg_conn.cursor()
    
    try:
        # Clean up any existing tables first
        clean_existing_tables(pg_cursor)
        
        # Create tables with proper structure
        print("Creating tables with proper structure...")
        create_postgres_tables(pg_cursor)
        
        # Get all tables
        tables = get_sqlite_tables(sqlite_cursor)
        print(f"Found tables: {tables}")
        
        # Migrate in the correct order to maintain relationships
        migration_order = ['Translation', 'Book', 'Chapter', 'VerseTranslation']
        for table in migration_order:
            if table in tables:
                migrate_table(sqlite_cursor, pg_cursor, table)
        
        print("Migration completed successfully!")
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        raise
    finally:
        sqlite_cursor.close()
        sqlite_conn.close()
        pg_cursor.close()
        pg_conn.close()

if __name__ == "__main__":
    main() 