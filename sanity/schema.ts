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

export default [post, author]
