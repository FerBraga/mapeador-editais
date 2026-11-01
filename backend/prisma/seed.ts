import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const municipalitiesPr = require('./data/municipalities-pr.json');

const CATEGORIES = [
  { name: 'Cultura', slug: 'cultura' },
  { name: 'Inovação e Tecnologia', slug: 'inovacao-e-tecnologia' },
  { name: 'Licitações e Compras', slug: 'licitacoes-e-compras' },
  { name: 'Desenvolvimento Econômico', slug: 'desenvolvimento-economico' },
  { name: 'Outros', slug: 'outros' },
];

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);
}

async function seedMunicipalities() {
  let count = 0;
  for (const m of municipalitiesPr as Array<{
    ibgeCode: string;
    name: string;
    latitude: number;
    longitude: number;
  }>) {
    await prisma.$executeRaw`
      INSERT INTO municipalities (id, name, ibge_code, state, latitude, longitude, location, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        ${m.name},
        ${m.ibgeCode},
        'PR',
        ${m.latitude},
        ${m.longitude},
        ST_SetSRID(ST_MakePoint(${m.longitude}, ${m.latitude}), 4326)::geography,
        now(),
        now()
      )
      ON CONFLICT (ibge_code) DO UPDATE SET
        name = EXCLUDED.name,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        location = EXCLUDED.location,
        updated_at = now();
    `;
    count += 1;
  }
  console.log(`Seeded ${count} municipalities for PR`);
}

async function main() {
  await seedCategories();
  await seedMunicipalities();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
