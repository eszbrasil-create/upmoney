import type { ReactNode } from 'react'
import { Callout } from '../components/Callout'

export type MdxLiteMeta = {
  title: string
  duration: string
}

export type MdxLiteDoc = {
  meta: Partial<MdxLiteMeta>
  nodes: ReactNode[]
}

const META_BLOCK_RE = /^export const meta\s*=\s*{[\s\S]*?}\s*\n+/m

function parseMeta(source: string): Partial<MdxLiteMeta> {
  const meta: Partial<MdxLiteMeta> = {}
  const titleMatch = source.match(/title:\s*(['"])(.*?)\1/)
  const durationMatch = source.match(/duration:\s*(['"])(.*?)\1/)
  if (titleMatch?.[2]) meta.title = titleMatch[2]
  if (durationMatch?.[2]) meta.duration = durationMatch[2]
  return meta
}

function isHeading(line: string) {
  return line.startsWith('# ')
    || line.startsWith('## ')
    || line.startsWith('### ')
}

function isUnorderedListItem(line: string) {
  return /^\s*-\s+/.test(line)
}

function isOrderedListItem(line: string) {
  return /^\s*\d+\.\s+/.test(line)
}

function isCalloutStart(line: string) {
  return /^\s*<Callout\b/.test(line)
}

function isSpecialLine(line: string) {
  return (
    isHeading(line)
    || isUnorderedListItem(line)
    || isOrderedListItem(line)
    || isCalloutStart(line)
    || /^\s*<\/Callout>\s*$/.test(line)
  )
}

function parseInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let key = 0

  while (true) {
    const m = rest.match(/\*\*(.+?)\*\*/)
    if (!m || m.index == null) {
      if (rest) out.push(rest)
      break
    }

    const before = rest.slice(0, m.index)
    if (before) out.push(before)
    out.push(<strong key={`b-${key++}`}>{m[1]}</strong>)
    rest = rest.slice(m.index + m[0].length)
  }

  return out
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function parseBlocks(lines: string[], baseKey: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let i = 0
  let key = 0

  const nextKey = () => `${baseKey}-${key++}`

  while (i < lines.length) {
    const raw = lines[i]
    const line = raw ?? ''

    if (!line.trim()) {
      i += 1
      continue
    }

    if (line.startsWith('# ')) {
      nodes.push(<h1 key={nextKey()}>{parseInline(line.slice(2).trim())}</h1>)
      i += 1
      continue
    }

    if (line.startsWith('## ')) {
      nodes.push(<h2 key={nextKey()}>{parseInline(line.slice(3).trim())}</h2>)
      i += 1
      continue
    }

    if (line.startsWith('### ')) {
      nodes.push(<h3 key={nextKey()}>{parseInline(line.slice(4).trim())}</h3>)
      i += 1
      continue
    }

    if (isCalloutStart(line)) {
      const tipoMatch = line.match(/tipo=\s*(['"])(.*?)\1/)
      const tipo = (tipoMatch?.[2] as 'ideia' | undefined) ?? 'ideia'
      i += 1
      const inner: string[] = []
      while (i < lines.length && !/^\s*<\/Callout>\s*$/.test(lines[i] ?? '')) {
        inner.push(lines[i] ?? '')
        i += 1
      }
      if (i < lines.length) i += 1 // skip </Callout>

      const innerNodes = parseBlocks(inner, `${baseKey}-callout-${key}`)
      nodes.push(
        <Callout key={nextKey()} tipo={tipo}>
          {innerNodes}
        </Callout>
      )
      continue
    }

    if (isUnorderedListItem(line)) {
      const items: string[] = []
      while (i < lines.length && isUnorderedListItem(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*-\s+/, '').trim())
        i += 1
      }
      nodes.push(
        <ul key={nextKey()}>
          {items.map((item, idx) => (
            <li key={`${baseKey}-ul-${key}-${idx}`}>{parseInline(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    if (isOrderedListItem(line)) {
      const items: string[] = []
      while (i < lines.length && isOrderedListItem(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*\d+\.\s+/, '').trim())
        i += 1
      }
      nodes.push(
        <ol key={nextKey()}>
          {items.map((item, idx) => (
            <li key={`${baseKey}-ol-${key}-${idx}`}>{parseInline(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Paragraph
    const paraLines: string[] = [line]
    i += 1
    while (i < lines.length) {
      const next = lines[i] ?? ''
      if (!next.trim()) break
      if (isSpecialLine(next)) break
      paraLines.push(next)
      i += 1
    }

    const paragraph = normalizeText(paraLines.join(' '))
    nodes.push(<p key={nextKey()}>{parseInline(paragraph)}</p>)
  }

  return nodes
}

export function parseMdxLite(source: string): MdxLiteDoc {
  const meta = parseMeta(source)
  const body = source.replace(META_BLOCK_RE, '')
  const lines = body.split(/\r?\n/)
  const nodes = parseBlocks(lines, 'mdx')
  return { meta, nodes }
}

