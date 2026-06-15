import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const игри = [
  {
    bggId: 13,
    slug: 'catan',
    titleBg: 'Колонизатори',
    titleEn: 'Catan',
    descriptionBg:
      'В Колонизатори играчите се борят да станат господари на остров Катан чрез строеж на селища, градове и пътища. Търгувайте с ресурси — дървесина, тухли, зърно, овце и руда — и използвайте картите за развитие, за да изпреварите съперниците си.',
    descriptionEn:
      'In Catan, players try to be the dominant force on the island of Catan by building settlements, cities, and roads. Trade resources, roll dice, and use development cards to outwit your rivals.',
    yearPublished: 1995,
    minPlayers: 3,
    maxPlayers: 4,
    minPlaytime: 60,
    maxPlaytime: 120,
    minAge: 10,
    weight: 2.32,
    bggRating: 7.13,
    ourRating: 7.5,
    imageUrl:
      'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__original/img/M_3Vg1j2HQ4G3SIhkZBDRejhEA=/0x0/filters:format(jpeg)/pic2419375.jpg',
    thumbnailUrl:
      'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/EVvLETjE3tRBXIXFaqbIbYXYXbA=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
    categories: ['Стратегия', 'Семейна', 'Договаряне'],
    mechanics: ['Зарове', 'Управление на ресурси', 'Изграждане на маршрут', 'Договаряне'],
    types: ['Family', 'Strategy'],
    isActive: true,
  },
  {
    bggId: 9209,
    slug: 'ticket-to-ride',
    titleBg: 'Пътешествие с влак',
    titleEn: 'Ticket to Ride',
    descriptionBg:
      'Събирайте карти с вагони и изграждайте железопътни маршрути из Европа или Америка. Изпълнявайте тайните си билети, свързвайки градове, преди съперниците да блокират пътя ви. Стратегическа игра, подходяща за цялото семейство.',
    descriptionEn:
      'Collect train cards and build railway routes across the map. Complete secret destination tickets by connecting cities before your opponents block the way.',
    yearPublished: 2004,
    minPlayers: 2,
    maxPlayers: 5,
    minPlaytime: 45,
    maxPlaytime: 90,
    minAge: 8,
    weight: 1.86,
    bggRating: 7.42,
    ourRating: 8.0,
    imageUrl:
      'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__original/img/a6bM2Oe10lJFP8q6QvMFiLtLmMk=/0x0/filters:format(jpeg)/pic38668.jpg',
    thumbnailUrl:
      'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/oerIa4kLJe3WBnVoJL7UQkN62aA=/fit-in/200x150/filters:strip_icc()/pic38668.jpg',
    categories: ['Семейна', 'Стратегия'],
    mechanics: ['Събиране на карти', 'Изграждане на маршрут', 'Набиране на карти'],
    types: ['Family'],
    isActive: true,
  },
  {
    bggId: 30549,
    slug: 'pandemic',
    titleBg: 'Пандемия',
    titleEn: 'Pandemic',
    descriptionBg:
      'Играчите работят заедно като специалисти на СЗО, за да спрат четири смъртоносни болести, преди да са се разпространили по целия свят. Кооперативна класика, изпълнена с напрежение и стратегически избори.',
    descriptionEn:
      'Players work together as disease-fighting specialists to stop four deadly diseases from spreading across the globe. A tense cooperative experience.',
    yearPublished: 2008,
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 45,
    maxPlaytime: 75,
    minAge: 8,
    weight: 2.41,
    bggRating: 7.59,
    ourRating: 8.5,
    imageUrl:
      'https://cf.geekdo-images.com/S3ybV1LAJ-VQJFC9Y7_ufQ__original/img/t3TZT1E4GLNR_eVNTYJJWtX4YoA=/0x0/filters:format(jpeg)/pic1534148.jpg',
    thumbnailUrl:
      'https://cf.geekdo-images.com/S3ybV1LAJ-VQJFC9Y7_ufQ__thumb/img/gIr-mT4k1HhGBnv5wI6MbNFIR98=/fit-in/200x150/filters:strip_icc()/pic1534148.jpg',
    categories: ['Кооперативна', 'Тематична'],
    mechanics: ['Кооперативна игра', 'Управление на ресурси', 'Точково движение'],
    types: ['Thematic', 'Family'],
    isActive: true,
  },
  {
    bggId: 266192,
    slug: 'wingspan',
    titleBg: 'Размах',
    titleEn: 'Wingspan',
    descriptionBg:
      'Размах е конкурентна игра за привличане на птици в резерватите ви. Всяка птица разширява способностите ви в едно от трите местообитания — гори, ливади или влажни зони. Красиво илюстрирана и стратегически дълбока игра.',
    descriptionEn:
      'Wingspan is a competitive card-driven game where you attract birds to your wildlife preserves. Each bird extends a chain of powerful combinations in one of three habitats.',
    yearPublished: 2019,
    minPlayers: 1,
    maxPlayers: 5,
    minPlaytime: 40,
    maxPlaytime: 70,
    minAge: 10,
    weight: 2.45,
    bggRating: 8.09,
    ourRating: 9.0,
    imageUrl:
      'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/5CFT8gMLMuEFbsJ7thm1voFyiKI=/0x0/filters:format(jpeg)/pic4458123.jpg',
    thumbnailUrl:
      'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/1AhflFqcRhwKfbf8DyXl0RgJ5O0=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
    categories: ['Стратегия', 'Природа', 'Семейна'],
    mechanics: ['Изграждане на двигател', 'Набиране на карти', 'Управление на ресурси'],
    types: ['Strategy', 'Family'],
    isActive: true,
  },
  {
    bggId: 31260,
    slug: 'agricola',
    titleBg: 'Агрикола',
    titleEn: 'Agricola',
    descriptionBg:
      'В Агрикола управлявате малка ферма от 17-ти век. Разпределяйте работниците си между различни действия, за да засявате полета, отглеждате животни и разширявате дома си, преди зимата да дойде и да трябва да изхраните семейството.',
    descriptionEn:
      'In Agricola you manage a 17th-century farm. Place workers to plow fields, breed animals, and expand your home before you have to feed your family at harvest time.',
    yearPublished: 2007,
    minPlayers: 1,
    maxPlayers: 5,
    minPlaytime: 30,
    maxPlaytime: 150,
    minAge: 12,
    weight: 3.64,
    bggRating: 7.94,
    ourRating: 8.5,
    imageUrl:
      'https://cf.geekdo-images.com/dDDo2SOdgd0a-JhFBlLKLA__original/img/lXoW0xtKxTkbk23xLV42dJBlklo=/0x0/filters:format(jpeg)/pic831744.jpg',
    thumbnailUrl:
      'https://cf.geekdo-images.com/dDDo2SOdgd0a-JhFBlLKLA__thumb/img/s_6GVkXHzPkQ5WU5kVuL6bVEVFo=/fit-in/200x150/filters:strip_icc()/pic831744.jpg',
    categories: ['Стратегия', 'Управление на работници'],
    mechanics: ['Поставяне на работници', 'Управление на ресурси', 'Набиране на карти'],
    types: ['Strategy'],
    isActive: true,
  },
]

async function main() {
  console.log('🌱 Започвам попълване на базата данни...')

  await prisma.game.deleteMany()
  console.log('🗑️  Изчистени съществуващи игри')

  for (const игра of игри) {
    const създадена = await prisma.game.create({ data: игра })
    console.log(`✅ Добавена: ${създадена.titleBg} (${създадена.slug})`)
  }

  console.log('\n✨ Базата данни е попълнена с 5 примерни игри!')
}

main()
  .catch((грешка) => {
    console.error('❌ Грешка при попълване:', грешка)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
