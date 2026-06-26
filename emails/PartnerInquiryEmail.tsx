import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Link,
  Hr,
  Button,
} from '@react-email/components'

interface Props {
  shopName:    string
  contactName?: string
  shopUrl?:    string
  siteUrl?:    string
}

const СТ = {
  body: {
    backgroundColor: '#f4f4f5',
    fontFamily:      '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    margin:          '0',
    padding:         '0',
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius:    '12px',
    margin:          '32px auto',
    maxWidth:        '600px',
    padding:         '0',
    overflow:        'hidden' as const,
  },
  header: {
    backgroundColor: '#1e40af',
    padding:         '32px 40px',
    textAlign:       'center' as const,
  },
  headerTitle: {
    color:      '#ffffff',
    fontSize:   '26px',
    fontWeight: '700',
    margin:     '0',
  },
  headerSubtitle: {
    color:    '#bfdbfe',
    fontSize: '14px',
    margin:   '8px 0 0',
  },
  body2: {
    padding: '36px 40px',
  },
  greeting: {
    color:      '#111827',
    fontSize:   '17px',
    fontWeight: '600',
    margin:     '0 0 16px',
  },
  text: {
    color:      '#374151',
    fontSize:   '15px',
    lineHeight: '1.7',
    margin:     '0 0 16px',
  },
  highlightBox: {
    backgroundColor: '#eff6ff',
    borderLeft:      '4px solid #2563eb',
    borderRadius:    '6px',
    margin:          '20px 0',
    padding:         '16px 20px',
  },
  highlightText: {
    color:      '#1e40af',
    fontSize:   '14px',
    lineHeight: '1.6',
    margin:     '0',
  },
  bulletItem: {
    color:       '#374151',
    fontSize:    '14px',
    lineHeight:  '1.6',
    margin:      '0 0 8px',
    paddingLeft: '8px',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius:    '8px',
    color:           '#ffffff',
    display:         'inline-block',
    fontSize:        '15px',
    fontWeight:      '600',
    padding:         '12px 28px',
    textDecoration:  'none',
  },
  signature: {
    color:      '#374151',
    fontSize:   '15px',
    lineHeight: '1.6',
    margin:     '24px 0 0',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin:      '28px 0',
  },
  footer: {
    color:      '#9ca3af',
    fontSize:   '12px',
    lineHeight: '1.5',
    margin:     '0',
    textAlign:  'center' as const,
  },
  footerLink: {
    color:          '#9ca3af',
    textDecoration: 'underline',
  },
}

export default function PartnerInquiryEmail({
  shopName,
  contactName,
  shopUrl,
  siteUrl = 'https://meeplesbg.com',
}: Props) {
  const поздрав = contactName ? `Уважаеми ${contactName},` : `Уважаеми екип на ${shopName},`

  return (
    <Html lang="bg" dir="ltr">
      <Head />
      <Preview>Покана за партньорство — MeeplesBG, водещата платформа за настолни игри в България</Preview>

      <Body style={СТ.body}>
        <Container style={СТ.container}>

          {/* Хедър */}
          <Section style={СТ.header}>
            <Text style={СТ.headerTitle}>🎲 MeeplesBG</Text>
            <Text style={СТ.headerSubtitle}>Общността за настолни игри в България</Text>
          </Section>

          {/* Тяло */}
          <Section style={СТ.body2}>
            <Heading style={СТ.greeting}>{поздрав}</Heading>

            <Text style={СТ.text}>
              Казвам се Лазар Ендаров и съм основател на{' '}
              <Link href={siteUrl} style={{ color: '#2563eb' }}>MeeplesBG</Link> —
              първата българска платформа, посветена изцяло на настолните игри.
              Сайтът обединява каталог с над 2 000 игри, общностни функции, пазар за
              покупко-продажба и редакционно съдържание на български език.
            </Text>

            <Section style={СТ.highlightBox}>
              <Text style={СТ.highlightText}>
                Обръщам се към Вас с предложение за техническо партньорство —
                интеграция на Вашия продуктов каталог в MeeplesBG чрез API или
                продуктов фийд, която да насочи заинтересовани играчи директно
                към Вашия магазин.
              </Text>
            </Section>

            <Text style={{ ...СТ.text, fontWeight: '600', color: '#111827' }}>
              Какво предлагаме на партньорите:
            </Text>
            <Text style={СТ.bulletItem}>📦 Показване на наличност и цена в реално време до страницата на всяка игра</Text>
            <Text style={СТ.bulletItem}>🔗 Директен линк към продукта в магазина при всяко търсене</Text>
            <Text style={СТ.bulletItem}>📊 Видимост пред таргетирана аудитория от активни играчи</Text>
            <Text style={СТ.bulletItem}>🆓 Безплатно за партньорите в началната фаза</Text>

            <Text style={{ ...СТ.text, marginTop: '20px' }}>
              За да стартираме интеграцията, имаме нужда от достъп до Вашия продуктов
              API или XML/JSON фийд. Ако разполагате с документация или тестови
              credentials, бихме се радвали да ги получим.
            </Text>

            <Section style={{ textAlign: 'center' as const, margin: '28px 0' }}>
              <Button href={siteUrl} style={СТ.button}>
                Разгледайте MeeplesBG →
              </Button>
            </Section>

            <Text style={СТ.text}>
              Готов съм да отговоря на всякакви въпроси или да насрочим кратък разговор
              за обсъждане на детайлите. Очаквам с нетърпение Вашия отговор.
            </Text>

            <Text style={СТ.signature}>
              С уважение,
              <br />
              <strong>Лазар Ендаров</strong>
              <br />
              Основател, MeeplesBG
              <br />
              <Link href={`mailto:partners@meeplesbg.com`} style={{ color: '#2563eb' }}>
                partners@meeplesbg.com
              </Link>
              {shopUrl && (
                <>
                  <br />
                  <Link href={siteUrl} style={{ color: '#6b7280', fontSize: '13px' }}>
                    {siteUrl}
                  </Link>
                </>
              )}
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ padding: '0 40px 32px' }}>
            <Hr style={СТ.hr} />
            <Text style={СТ.footer}>
              Този имейл е изпратен от екипа на{' '}
              <Link href={siteUrl} style={СТ.footerLink}>meeplesbg.com</Link>.
              <br />
              Ако не желаете да получавате съобщения от нас, моля отговорете на този имейл.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
