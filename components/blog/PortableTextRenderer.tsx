import { PortableText }  from 'next-sanity'
import type { PortableTextBlock } from '@portabletext/types'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity/image'

// ── Персонализирани компоненти за Portable Text ───────────────

const компоненти = {
  types: {
    image: ({ value }: { value: { asset: { _ref: string }; alt?: string; caption?: string } }) => {
      if (!value?.asset?._ref) return null
      return (
        <figure className="my-8">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={urlFor(value).width(1200).url()}
              alt={value.alt ?? ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
          {value.caption && (
            <figcaption className="text-center text-sm text-gray-500 mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },

  block: {
    normal:     ({ children }: { children?: React.ReactNode }) => (
      <p className="mb-4 leading-relaxed text-gray-800">{children}</p>
    ),
    h2:         ({ children }: { children?: React.ReactNode }) => (
      <h2 className="mt-8 mb-3 text-2xl font-bold text-gray-900">{children}</h2>
    ),
    h3:         ({ children }: { children?: React.ReactNode }) => (
      <h3 className="mt-6 mb-2 text-xl font-bold text-gray-900">{children}</h3>
    ),
    h4:         ({ children }: { children?: React.ReactNode }) => (
      <h4 className="mt-4 mb-2 text-lg font-semibold text-gray-900">{children}</h4>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-6 pl-4 border-l-4 border-brand-400 text-gray-700 italic">
        {children}
      </blockquote>
    ),
  },

  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="mb-4 ml-6 list-disc space-y-1 text-gray-800">{children}</ul>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-1 text-gray-800">{children}</ol>
    ),
  },

  listItem: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
    number: ({ children }: { children?: React.ReactNode }) => (
      <li className="leading-relaxed">{children}</li>
    ),
  },

  marks: {
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-gray-900">{children}</strong>
    ),
    em: ({ children }: { children?: React.ReactNode }) => (
      <em className="italic">{children}</em>
    ),
    underline: ({ children }: { children?: React.ReactNode }) => (
      <span className="underline">{children}</span>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="px-1.5 py-0.5 bg-gray-100 text-red-600 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({
      value,
      children,
    }: {
      value?: { href?: string; blank?: boolean }
      children?: React.ReactNode
    }) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : undefined}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="text-brand-600 hover:underline"
      >
        {children}
      </a>
    ),
  },
}

// ── Главен компонент ─────────────────────────────────────────

export default function PortableTextRenderer({ body }: { body: PortableTextBlock[] }) {
  return (
    <div className="prose-custom max-w-none">
      <PortableText value={body} components={компоненти as never} />
    </div>
  )
}
