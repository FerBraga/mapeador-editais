/**
 * One-off backfill: assigns categoryId to existing opportunities (created
 * before categorizacao-por-fonte) based on their source's sourceType.
 * Idempotent - safe to run more than once, since it always derives the
 * category from the source's current sourceType rather than toggling state.
 *
 * Usage (from backend/): npx ts-node scripts/backfill-opportunity-categories.ts
 */
import { PrismaClient } from '@prisma/client';
import { SOURCE_TYPE_TO_CATEGORY_SLUG } from '../src/modules/scrapers/source-category-mapping';

const prisma = new PrismaClient();

async function main() {
  const sources = await prisma.source.findMany();

  for (const source of sources) {
    const slug = SOURCE_TYPE_TO_CATEGORY_SLUG[source.sourceType];
    const category = await prisma.category.findUnique({ where: { slug } });

    if (!category) {
      console.warn(
        `Skipping source "${source.name}" (${source.scraperKey}): no category seeded for slug "${slug}"`,
      );
      continue;
    }

    const result = await prisma.opportunity.updateMany({
      where: { sourceId: source.id },
      data: { categoryId: category.id },
    });

    console.log(
      `Source "${source.name}" (${source.scraperKey}) -> category "${category.name}": ${result.count} opportunities updated`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
