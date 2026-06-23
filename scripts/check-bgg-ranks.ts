async function main() {
  const token   = process.env.BGG_API_TOKEN ?? ''
  const cookie  = process.env.BGG_SESSION_COOKIE ?? ''
  const res = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=161936&stats=1', {
    headers: {
      'User-Agent':    'MeeplesBG/1.0 (https://meeplesbg.com)',
      'Accept':        'application/xml,text/xml',
      ...(token  ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(cookie ? { 'Cookie': cookie }                   : {}),
    }
  })
  console.log('HTTP status:', res.status)
  if (!res.ok) { console.log('Failed'); return }
  const xml = await res.text()
  const matches = [...xml.matchAll(/<rank[^>]+>/g)]
  matches.forEach(m => console.log(m[0]))
}
main()
