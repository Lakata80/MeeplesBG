const BG: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',
  ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sht',ъ:'a',ь:'',ю:'yu',я:'ya',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((c) => BG[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function uniqueSlug(title: string): string {
  const base   = slugify(title)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base}-${suffix}`
}
