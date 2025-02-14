-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "year" INTEGER,
    "description" TEXT,
    "copyright" TEXT,
    "publisher" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "testament" TEXT NOT NULL DEFAULT 'old',
    "translationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_translationId_fkey" FOREIGN KEY ("translationId") REFERENCES "Translation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Chapter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "summary" TEXT,
    "bookId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chapter_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "footnotes" TEXT,
    "crossRefs" TEXT,
    "chapterId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Verse_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_shortName_key" ON "Translation"("shortName");

-- CreateIndex
CREATE INDEX "Translation_shortName_idx" ON "Translation"("shortName");

-- CreateIndex
CREATE INDEX "Book_shortName_idx" ON "Book"("shortName");

-- CreateIndex
CREATE INDEX "Book_translationId_idx" ON "Book"("translationId");

-- CreateIndex
CREATE UNIQUE INDEX "Book_number_translationId_key" ON "Book"("number", "translationId");

-- CreateIndex
CREATE INDEX "Chapter_bookId_idx" ON "Chapter"("bookId");

-- CreateIndex
CREATE UNIQUE INDEX "Chapter_number_bookId_key" ON "Chapter"("number", "bookId");

-- CreateIndex
CREATE INDEX "Verse_chapterId_idx" ON "Verse"("chapterId");

-- CreateIndex
CREATE INDEX "Verse_text_search_idx" ON "Verse"("text");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_number_chapterId_key" ON "Verse"("number", "chapterId");
