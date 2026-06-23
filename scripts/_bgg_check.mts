import { fetchGameById } from './lib/bgg/client.ts'
const game = await fetchGameById(161936)
// Print the raw ranks from BGG by re-fetching with raw XML
const res = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=161936&stats=1', {
  headers: { 'User-Agent': 'MeeplesBG/1.0 (https://meeplesbg.com)', 'Accept': 'application/xml' }
})
const xml = await res.text()
const matches = [...xml.matchAll(/<rank[^>]+>/g)]
matches.forEach(m => console.log(m[0]))
