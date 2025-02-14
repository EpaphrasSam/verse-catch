// scripts/browse-db.ts
import prisma from "../src/utils/prisma";
import express from "express";

const app = express();

app.get("/", (req: any, res: any) => {
  res.send(`
    <h1>Bible Database Browser</h1>
    <ul>
      <li><a href="/translations">Translations</a></li>
      <li><a href="/books">Books</a></li>
      <li><a href="/verses">Verses (Paginated)</a></li>
    </ul>
  `);
});

app.get("/translations", async (req: any, res: any) => {
  const translations = await prisma.translation.findMany();
  res.json(translations);
});

app.get("/verses", async (req: any, res: any) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 100;

  const verses = await prisma.verseTranslation.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      translation: true,
      chapter: {
        include: { book: true },
      },
    },
  });

  const total = await prisma.verseTranslation.count();
  const pages = Math.ceil(total / pageSize);

  res.send(`
    <h1>Verses (Page ${page} of ${pages})</h1>
    <div>
      ${page > 1 ? `<a href="/verses?page=${page - 1}">Previous</a>` : ""}
      ${page < pages ? `<a href="/verses?page=${page + 1}">Next</a>` : ""}
    </div>
    <pre>${JSON.stringify(verses, null, 2)}</pre>
  `);
});

app.listen(5000, () => {
  console.log("Browser available at http://localhost:5000");
});
