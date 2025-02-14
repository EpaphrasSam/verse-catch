import { BibleReference } from "@/types/bible.type";

export const verseHelpers = {
  parseReference: (text: string): Partial<BibleReference> => {
    // Handle formats like "John 3:16" or "Genesis 1:1"
    const match = text.match(/(\w+)\s+(\d+):(\d+)/);
    if (!match) return {};

    const [, book, chapter, verse] = match;
    return {
      book: {
        name: book,
        // Book number and shortName will be filled by service
        number: 0,
        shortName: "",
      },
      chapter: parseInt(chapter),
      verse: parseInt(verse),
    };
  },

  formatReference: (ref: BibleReference): string => {
    return `${ref.book.name} ${ref.chapter}:${ref.verse}`;
  },

  isValidReference: (ref: Partial<BibleReference>): boolean => {
    return !!(
      ref.book?.name &&
      ref.chapter &&
      ref.verse &&
      ref.chapter > 0 &&
      ref.verse > 0
    );
  },
};
