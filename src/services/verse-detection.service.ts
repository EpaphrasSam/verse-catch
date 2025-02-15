import gemini from "@/utils/gemini";
import prisma from "@/utils/prisma";
import { BibleReference, VerseDetection } from "@/types/bible.type";
import { APP_CONFIG } from "@/config/app.config";
import { AppError, TranscriptionError } from "@/utils/errors";

const GEMINI_PROMPT = `You are a Bible verse detection expert. Analyze the following sermon transcription for Bible verse references.
Your task is to identify both explicit and implicit Bible verse references, including paraphrased verses and verse ranges.

Rules:
1. Detect explicit references (e.g., "John 3:16", "Genesis 1:1-3")
2. Detect implicit references (e.g., "as we read earlier in the Gospel of John")
3. Detect contextual references (e.g., "the next verse", "continuing in chapter 3")
4. Detect paraphrased verses (e.g., if someone says "God made the heavens and earth" -> Genesis 1:1)
5. Consider thematic similarities (e.g., creation story -> Genesis 1)
6. IMPORTANT: When detecting verses, identify the EXACT verses being read
   For example:
   - If someone reads "Blessed is the one who does not walk... but whose delight is in the law..." -> This is Psalm 1:1-2
   - Do NOT combine verses unless they are actually being read together
   - Pay attention to where the quote starts and ends
7. Assign confidence scores:
   - 1.0 for exact quotes
   - 0.8-0.9 for close paraphrases
   - 0.6-0.7 for thematic matches
   - 0.4-0.5 for possible references
8. Only return verses with confidence >= ${APP_CONFIG.VERSE_DETECTION.MIN_CONFIDENCE}
9. IMPORTANT: Use exact book names as follows:
   - Genesis, Exodus, Leviticus, etc.
   - Psalm (not Psalms)
   - Matthew, Mark, Luke, John
   - 1 Corinthians (not First Corinthians)
10. IMPORTANT: Return ONLY raw JSON without any markdown formatting, code blocks, or additional text

Response format (return EXACTLY this format without any other text):
{
  "detections": [{
    "book": {
      "number": <1-66>,
      "name": "<full book name>",
      "shortName": "<3-letter code>"
    },
    "chapter": <number>,
    "verse": <number>,
    "verseRange": {  // Include ONLY if multiple verses are actually being read
      "start": <number>,
      "end": <number>
    },
    "confidence": <0.0-1.0>,
    "detectionType": "explicit" | "implicit" | "contextual",
    "translation": "NIV"
  }]
}

Example:
Input: "Blessed is the one who does not walk in step with the wicked... but whose delight is in the law of the Lord"
Expected detection:
{
  "detections": [{
    "book": {
      "number": 19,
      "name": "Psalm",
      "shortName": "Psa"
    },
    "chapter": 1,
    "verse": 1,
    "verseRange": {
      "start": 1,
      "end": 2
    },
    "confidence": 1.0,
    "detectionType": "explicit",
    "translation": "NIV"
  }]
}

Transcription to analyze: [TEXT]`;

const cleanGeminiResponse = (text: string): string => {
  try {
    // Remove markdown code blocks
    text = text.replace(/```(?:json)?\n|\n```/g, "");

    // Remove any text before the first { and after the last }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      throw new TranscriptionError("Invalid Gemini response format");
    }
    text = text.slice(firstBrace, lastBrace + 1);

    return text.trim();
  } catch (error) {
    console.error("Error cleaning Gemini response:", error);
    throw new TranscriptionError(
      "Failed to process Gemini response: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};

const getVerseText = async (reference: BibleReference) => {
  try {
    // Handle verse range
    if (reference.verseRange) {
      const { start, end } = reference.verseRange;
      let verses = await prisma.verseTranslation.findMany({
        where: {
          translation: {
            code: reference.translation || "NIV",
          },
          chapter: {
            number: reference.chapter,
            book: {
              name: reference.book.name,
            },
          },
          number: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          number: "asc",
        },
        select: {
          text: true,
        },
      });

      if (verses.length === 0 && reference.translation !== "NIV") {
        // Try NIV as fallback
        verses = await prisma.verseTranslation.findMany({
          where: {
            translation: {
              code: "NIV",
            },
            chapter: {
              number: reference.chapter,
              book: {
                name: reference.book.name,
              },
            },
            number: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            number: "asc",
          },
          select: {
            text: true,
          },
        });
      }

      if (verses.length === 0) {
        console.log(
          `Verses not found: ${reference.book.name} ${reference.chapter}:${start}-${end}`
        );
        return null;
      }

      // Return combined text with verse range
      return {
        text: verses.map((v) => v.text).join(" "),
        verseRange: { start, end },
      };
    }

    // Handle single verse
    let verse = await prisma.verseTranslation.findFirst({
      where: {
        translation: {
          code: reference.translation || "NIV",
        },
        chapter: {
          number: reference.chapter,
          book: {
            name: reference.book.name,
          },
        },
        number: reference.verse,
      },
      select: {
        text: true,
      },
    });

    if (!verse?.text && reference.translation !== "NIV") {
      verse = await prisma.verseTranslation.findFirst({
        where: {
          translation: {
            code: "NIV",
          },
          chapter: {
            number: reference.chapter,
            book: {
              name: reference.book.name,
            },
          },
          number: reference.verse,
        },
        select: {
          text: true,
        },
      });
    }

    if (!verse?.text) {
      console.log(
        `Verse not found: ${reference.book.name} ${reference.chapter}:${reference.verse}`
      );
      return null;
    }

    // Return single verse text
    return {
      text: verse.text,
      verseRange: null,
    };
  } catch (error) {
    console.error("Error fetching verse text:", error);
    throw new AppError(
      "Failed to fetch verse text from database",
      "DATABASE_ERROR",
      500
    );
  }
};

export const detectVerses = async (
  transcription: string
): Promise<VerseDetection[]> => {
  try {
    if (!transcription || typeof transcription !== "string") {
      throw new TranscriptionError("Invalid transcription input");
    }

    const model = gemini.getGenerativeModel({ model: "gemini-pro" });
    const prompt = GEMINI_PROMPT.replace("[TEXT]", transcription);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!result?.response) {
      throw new TranscriptionError("Empty response from Gemini");
    }

    const responseText = result.response.text();
    if (!responseText) {
      throw new TranscriptionError("Empty text in Gemini response");
    }

    console.log("Raw Gemini response:", responseText);
    const cleanedResponse = cleanGeminiResponse(responseText);
    console.log("Cleaned response:", cleanedResponse);

    try {
      const parsed = JSON.parse(cleanedResponse);
      if (!parsed?.detections || !Array.isArray(parsed.detections)) {
        throw new TranscriptionError("Invalid response format from Gemini");
      }

      // Get verse texts in parallel and filter out null results
      const detections = (
        await Promise.all(
          parsed.detections
            .filter(
              (detection: BibleReference) =>
                detection?.confidence >=
                APP_CONFIG.VERSE_DETECTION.MIN_CONFIDENCE
            )
            .map(async (detection: BibleReference) => {
              const verseResult = await getVerseText(detection);
              if (!verseResult) return null;

              return {
                reference: {
                  book: detection.book,
                  chapter: detection.chapter,
                  verse: detection.verse,
                  verseRange: verseResult.verseRange || detection.verseRange,
                  confidence: detection.confidence,
                  detectionType: detection.detectionType,
                  translation: detection.translation || "NIV",
                },
                text: verseResult.text,
                source: "gemini",
                confidence: detection.confidence,
                timestamp: Date.now(),
                sequence: Math.floor(Date.now() / 1000),
              };
            })
        )
      ).filter((detection): detection is VerseDetection => detection !== null);

      return detections;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      throw new TranscriptionError(
        "Failed to parse verse detection results: " +
          (parseError instanceof Error ? parseError.message : "Unknown error")
      );
    }
  } catch (error) {
    console.error("Verse detection error:", error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new TranscriptionError(
      "Failed to detect verses: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
};
