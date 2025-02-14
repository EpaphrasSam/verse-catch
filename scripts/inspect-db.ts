import prisma from "../src/utils/prisma";

async function inspectDatabase() {
  // Check translations
  const translations = await prisma.translation.findMany();
  console.log("Translations:", translations);

  // Count verses
  const verseCount = await prisma.verseTranslation.count();
  console.log("Total verses:", verseCount);

  // Sample verses
  const sampleVerses = await prisma.verseTranslation.findMany({
    take: 5,
    include: {
      translation: true,
      chapter: {
        include: { book: true },
      },
    },
  });
  console.log("Sample verses:", JSON.stringify(sampleVerses, null, 2));

  await prisma.$disconnect();
}

inspectDatabase();
