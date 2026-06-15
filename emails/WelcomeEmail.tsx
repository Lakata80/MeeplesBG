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

// ── Пропси ────────────────────────────────────────────────────

interface Props {
  email:          string
  unsubscribeUrl: string
  siteUrl?:       string
}

// ── Стилове (inline — имейл клиентите не поддържат CSS класове) ──

const СТИЛОВЕ = {
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
    maxWidth:        '560px',
    padding:         '0',
    overflow:        'hidden' as const,
  },
  header: {
    backgroundColor: '#2563eb',
    padding:         '32px 40px',
    textAlign:       'center' as const,
  },
  headerTitle: {
    color:      '#ffffff',
    fontSize:   '24px',
    fontWeight: '700',
    margin:     '0',
  },
  headerSubtitle: {
    color:      '#bfdbfe',
    fontSize:   '14px',
    margin:     '8px 0 0',
  },
  body2: {
    padding: '32px 40px',
  },
  greeting: {
    color:      '#111827',
    fontSize:   '18px',
    fontWeight: '600',
    margin:     '0 0 12px',
  },
  text: {
    color:      '#4b5563',
    fontSize:   '15px',
    lineHeight: '1.6',
    margin:     '0 0 16px',
  },
  benefitItem: {
    color:      '#374151',
    fontSize:   '14px',
    lineHeight: '1.6',
    margin:     '0 0 8px',
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
  unsubLink: {
    color:          '#9ca3af',
    textDecoration: 'underline',
  },
}

// ── Компонент ─────────────────────────────────────────────────

export default function WelcomeEmail({
  email,
  unsubscribeUrl,
  siteUrl = 'https://meeplebg.com',
}: Props) {
  return (
    <Html lang="bg" dir="ltr">
      <Head />
      <Preview>Добре дошъл в MeeplesBG! Радваме се, че се присъедини.</Preview>

      <Body style={СТИЛОВЕ.body}>
        <Container style={СТИЛОВЕ.container}>

          {/* Хедър */}
          <Section style={СТИЛОВЕ.header}>
            <Text style={{ ...СТИЛОВЕ.headerTitle, color: '#ffffff', fontSize: '28px' }}>
              🎲 MeeplesBG
            </Text>
            <Text style={СТИЛОВЕ.headerSubtitle}>
              Общността за настолни игри в България
            </Text>
          </Section>

          {/* Тяло */}
          <Section style={СТИЛОВЕ.body2}>
            <Heading style={СТИЛОВЕ.greeting}>
              Добре дошъл в MeeplesBG!
            </Heading>

            <Text style={СТИЛОВЕ.text}>
              Благодарим, че се абонира за нашия бюлетин! Радваме се да те имаме в нашата
              общност от любители на настолни игри.
            </Text>

            <Text style={{ ...СТИЛОВЕ.text, fontWeight: '600', color: '#111827' }}>
              Какво ще получаваш:
            </Text>

            <Text style={СТИЛОВЕ.benefitItem}>🎯 Седмичен дайджест с нови игри</Text>
            <Text style={СТИЛОВЕ.benefitItem}>🏆 Топ класации и препоръки</Text>
            <Text style={СТИЛОВЕ.benefitItem}>📰 Новини и ревюта</Text>
            <Text style={СТИЛОВЕ.benefitItem}>🎉 Специални оферти и събития</Text>

            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button href={siteUrl} style={СТИЛОВЕ.button}>
                Разгледай MeeplesBG →
              </Button>
            </Section>

            <Text style={СТИЛОВЕ.text}>
              Ако имаш въпроси или предложения, отговори на този имейл — с удоволствие
              ще ти помогнем.
            </Text>

            <Text style={{ ...СТИЛОВЕ.text, marginBottom: '0' }}>
              С уважение,
              <br />
              <strong>Екипът на MeeplesBG</strong>
            </Text>
          </Section>

          {/* Разделител и footer */}
          <Section style={{ padding: '0 40px 32px' }}>
            <Hr style={СТИЛОВЕ.hr} />
            <Text style={СТИЛОВЕ.footer}>
              Получаваш този имейл, защото се абонира с адрес{' '}
              <span style={{ color: '#6b7280' }}>{email}</span>.
              <br />
              <Link href={unsubscribeUrl} style={СТИЛОВЕ.unsubLink}>
                Отпиши се от бюлетина
              </Link>
              {' · '}
              <Link href={siteUrl} style={СТИЛОВЕ.unsubLink}>
                meeplebg.com
              </Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
