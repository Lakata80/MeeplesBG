import NewsletterForm from '@/components/newsletter/NewsletterForm'

export default function NewsletterSection() {
  return (
    <section className="py-16 bg-brand-600 text-white">
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 className="text-3xl font-bold mb-3">Не изпускай нищо</h2>
        <p className="text-brand-100 text-lg mb-8">
          Получавай седмичен дайджест с нови игри, отстъпки и събития
        </p>

        <div className="max-w-md mx-auto [&_input]:text-gray-900 [&_input]:bg-white [&_input::placeholder]:text-gray-400">
          <NewsletterForm />
        </div>

        <p className="mt-5 text-xs text-brand-200">
          Без спам. Можеш да се отпишеш по всяко време.
        </p>
      </div>
    </section>
  )
}
