import React from 'react'

export default function DataDeletionConfirmation({ searchParams }: { searchParams?: { confirmation_code?: string } }) {
  const code = searchParams?.confirmation_code ?? '—'
  return (
    <div style={{padding:32, maxWidth:800}}>
      <h1>Потвърждение за заявка за изтриване на данни</h1>
      <p>Код на потвърждение: <strong>{code}</strong></p>
      <p>
        Заявката ви е получена и ще бъде обработена. Ако имате въпроси, пишете на <a href="mailto:privacy@meeples.bg">privacy@meeples.bg</a>.
      </p>
      <p style={{fontSize:12,color:'#666'}}>Това е автоматична страница, използвана за потвърждение пред Facebook при обработка на заявки за изтриване.</p>
    </div>
  )
}
