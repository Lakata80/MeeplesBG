// Sanity Studio схема за MeeplesBG
// Използва се в Sanity Studio за дефиниране на типовете съдържание.

// ── Типове изображения (блок за вграждане в portable text) ──

const imageBlock = {
  type: 'image',
  options: { hotspot: true },
  fields: [
    {
      name: 'alt',
      type: 'string',
      title: 'Алтернативен текст',
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name: 'caption',
      type: 'string',
      title: 'Надпис под снимка',
    },
  ],
}

// ── Автор ─────────────────────────────────────────────────

export const author = {
  name:   'author',
  type:   'document',
  title:  'Автор',
  fields: [
    {
      name:       'name',
      type:       'string',
      title:      'Име',
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:    'image',
      type:    'image',
      title:   'Снимка',
      options: { hotspot: true },
    },
    {
      name:  'bio',
      type:  'text',
      title: 'Биография',
      rows:  3,
    },
  ],
  preview: {
    select: { title: 'name', media: 'image' },
  },
}

// ── Статия/Пост ───────────────────────────────────────────

export const post = {
  name:   'post',
  type:   'document',
  title:  'Статия',
  fields: [
    {
      name:       'title',
      type:       'string',
      title:      'Заглавие',
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:    'slug',
      type:    'slug',
      title:   'Slug (URL)',
      options: { source: 'title', maxLength: 96 },
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:  'excerpt',
      type:  'text',
      title: 'Кратко описание (извадка)',
      rows:  3,
    },
    {
      name:    'mainImage',
      type:    'image',
      title:   'Главна снимка',
      options: { hotspot: true },
      fields: [
        {
          name:  'alt',
          type:  'string',
          title: 'Алтернативен текст',
        },
      ],
    },
    {
      name:  'author',
      type:  'reference',
      title: 'Автор',
      to:    [{ type: 'author' }],
    },
    {
      name:  'publishedAt',
      type:  'datetime',
      title: 'Публикувано на',
    },
    {
      name:    'category',
      type:    'string',
      title:   'Категория',
      options: {
        list: [
          { title: 'Новини',      value: 'NEWS' },
          { title: 'Ревю',        value: 'REVIEW' },
          { title: 'Блог',        value: 'BLOG' },
          { title: 'Наръчник',    value: 'GUIDE' },
        ],
        layout: 'radio',
      },
      initialValue: 'BLOG',
    },
    {
      name:  'body',
      type:  'array',
      title: 'Съдържание',
      of: [
        {
          type:   'block',
          styles: [
            { title: 'Нормален',         value: 'normal' },
            { title: 'Заглавие 2',        value: 'h2' },
            { title: 'Заглавие 3',        value: 'h3' },
            { title: 'Заглавие 4',        value: 'h4' },
            { title: 'Цитат',            value: 'blockquote' },
          ],
          lists: [
            { title: 'Точков списък',    value: 'bullet' },
            { title: 'Номериран списък', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Удебелен',       value: 'strong' },
              { title: 'Курсив',         value: 'em' },
              { title: 'Подчертан',      value: 'underline' },
              { title: 'Код',            value: 'code' },
            ],
            annotations: [
              {
                name:   'link',
                type:   'object',
                title:  'Линк',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                  {
                    name:    'blank',
                    type:    'boolean',
                    title:   'Отвори в нов прозорец',
                    initialValue: false,
                  },
                ],
              },
            ],
          },
        },
        imageBlock,
      ],
    },
  ],
  preview: {
    select: {
      title:    'title',
      author:   'author.name',
      media:    'mainImage',
      category: 'category',
    },
    prepare({ title, author, media, category }: Record<string, string>) {
      const КАТЕ: Record<string, string> = {
        NEWS: 'Новини', REVIEW: 'Ревю', BLOG: 'Блог', GUIDE: 'Наръчник',
      }
      return {
        title,
        subtitle: `${КАТЕ[category] ?? category} · ${author ?? 'Без автор'}`,
        media,
      }
    },
  },
}

// ── Игра на седмицата ─────────────────────────────────────
// Slug формат: {gameSlug}-{YYYY}-w{WW}  (напр. cascadia-2026-w27)

export const weeklyGame = {
  name:   'weeklyGame',
  type:   'document',
  title:  'Игра на седмицата',
  fields: [
    {
      name:    'slug',
      type:    'slug',
      title:   'Slug (URL)',
      description: 'Формат: cascadia-2026-w27',
      options: { source: 'gameName', maxLength: 96 },
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:       'gameSlug',
      type:       'string',
      title:      'Slug на играта в MeeplesBG',
      description: 'Напр. cascadia — трябва да съвпада с /igri/[slug]',
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:       'gameName',
      type:       'string',
      title:      'Заглавие на играта',
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:  'weekLabel',
      type:  'string',
      title: 'Етикет на седмицата',
      description: 'Напр. "Седмица 27, 2026"',
    },
    {
      name:       'headlineBg',
      type:       'string',
      title:      'Редакционно заглавие (БГ)',
      description: 'Показва се в банера — напр. "Идеална за двама"',
      validation: (R: { required: () => unknown }) => R.required(),
    },
    {
      name:  'teaserBg',
      type:  'text',
      title: 'Кратко описание (БГ)',
      rows:  3,
      description: 'Защо е избрана тази игра тази седмица',
    },
    {
      name:    'bannerImage',
      type:    'image',
      title:   'Банер снимка (висока резолюция)',
      options: { hotspot: true },
      fields: [
        {
          name:  'alt',
          type:  'string',
          title: 'Алтернативен текст',
        },
      ],
    },
    {
      name:         'isActive',
      type:         'boolean',
      title:        'Активна',
      description:  'Само една трябва да е активна наведнъж',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title:    'gameName',
      subtitle: 'weekLabel',
      media:    'bannerImage',
    },
    prepare({ title, subtitle, media }: Record<string, string>) {
      return { title, subtitle: subtitle ?? '', media }
    },
  },
}

export default [post, author, weeklyGame]
