import Anthropic        from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'

const МОДЕЛ       = 'claude-haiku-4-5-20251001'
const МАКС_ТОКЕНИ = 4096
const BGG_IDS     = [473061, 451772]

const SYSTEM_PROMPT = `Ти си професионален преводач и редактор на настолни игри (board games), специализиран в превод от английски на български.

Твоята задача е да превеждаш описания, правила, инструкции и текстове за настолни игри от английски на български по начин, подходящ за публикуване.

Основни изисквания:

1. Преводът НЕ трябва да бъде буквален.
Превеждай смисъла и използвай естествен български език, както би го написал професионален издател на настолни игри.

2. Запази:
- структурата на текста;
- заглавията;
- списъци;
- удебеляване/форматиране;
- имена на карти, фази, компоненти и специални термини;
- числови стойности и символи.

3. Стил:
Използвай стил на официален правилник за настолна игра:
- ясен;
- кратък;
- точен;
- без излишни обяснения;
- лесен за разбиране от играчи.

4. Терминология:
Поддържай еднакъв превод на термините.

game = игра
board game = настолна игра
player = играч
turn = ход
round = рунд
phase = фаза
setup = подготовка
rule = правило
action = действие
ability = умение/способност (според контекста)
card = карта
deck = тесте
draw a card = изтеглете карта
discard = изхвърлете/отхвърлете
score = точки/точкуване
victory points = победни точки
goal = цел
objective = задача/цел
token = жетон
tile = плочка/тайл (според контекста)
meeple = мийпъл
resource = ресурс
upgrade = подобрение
player mat = табло на играча
expansion = разширение

5. Имена:
- Не превеждай имена на игри.
- Не превеждай собствени имена.
- Не променяй названия на уникални карти, герои или фракции, освен ако няма официален превод.

6. Формат на отговора:
Дай само готовия превод.
Не добавяй обяснения преди или след текста, освен ако не откриеш терминологичен проблем (в такъв случай добави "Бележка за редактор: ..." в края).`

async function main() {
  const ключ = process.env.ANTHROPIC_API_KEY
  if (!ключ) { console.error('❌ Липсва ANTHROPIC_API_KEY в .env'); process.exit(1) }

  const anthropic = new Anthropic({ apiKey: ключ })
  const prisma    = new PrismaClient()

  try {
    const игри = await prisma.game.findMany({
      where: { bggId: { in: BGG_IDS } },
      select: { id: true, bggId: true, titleEn: true, descriptionEn: true, descriptionBg: true },
    })

    console.log(`🎲 Превод на описания за ${игри.length} игри...\n`)

    for (const игра of игри) {
      console.log(`⟳  "${игра.titleEn}" (BGG ${игра.bggId})`)

      if (!игра.descriptionEn) {
        console.log('   ⏭  Пропусната — няма английско описание\n')
        continue
      }
      if (игра.descriptionBg) {
        console.log('   ⏭  Пропусната — вече има превод\n')
        continue
      }

      const отговор = await anthropic.messages.create({
        model:      МОДЕЛ,
        max_tokens: МАКС_ТОКЕНИ,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: игра.descriptionEn }],
      })

      const блок = отговор.content[0]
      if (блок.type !== 'text') throw new Error('Неочакван тип отговор от Claude')
      const превод = блок.text.trim()

      await prisma.game.update({
        where: { id: игра.id },
        data:  { descriptionBg: превод },
      })

      console.log(`   ✅ Преведено (${превод.length} символа)\n`)
    }

    console.log('✅ Готово!')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((г) => { console.error('\n❌ Грешка:', г); process.exit(1) })
