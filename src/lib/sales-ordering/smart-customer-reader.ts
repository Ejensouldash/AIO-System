import * as xlsx from 'xlsx'
import fs from 'fs'

export interface ParsedCustomerRecord {
  customerCode: string
  sageCustomerId: string | null
  legalName: string
  tradingName: string | null
  pic: string | null
  email: string | null
  phonePrimary: string | null
  phoneSecondary: string | null
  customerType: string | null
  customerSubtype: string | null
  categoryCode: string | null
  zone: string | null
  region: string | null
  creditTermsRaw: string | null
  creditTermDays: number | null
  paymentPolicy: string | null
  salesRep1: string | null
  salesRep2: string | null
  companyRegistrationNo: string | null
  tinNo: string | null
  sstNo: string | null
  importStatus: string
  sourceSheet: string
  sourceData: Record<string, unknown>
  addressLine1: string | null
  addressLine2: string | null
  addressLine3: string | null
  city: string | null
  state: string | null
  postcode: string | null
  country: string
  fullAddress: string | null
}

const MALAYSIAN_STATES = [
  'KEDAH', 'PERLIS', 'PULAU PINANG', 'PENANG', 'PERAK', 'SELANGOR',
  'KUALA LUMPUR', 'PUTRAJAYA', 'MELAKA', 'NEGERI SEMBILAN', 'JOHOR',
  'PAHANG', 'TERENGGANU', 'KELANTAN', 'SABAH', 'SARAWAK', 'LABUAN'
]

export function cleanPhone(raw: unknown): { primary: string | null; secondary: string | null } {
  if (!raw) return { primary: null, secondary: null }
  const str = String(raw).trim()
  if (!str || str === '#N/A') return { primary: null, secondary: null }

  // Check if multiple numbers separated by slash, comma, or "or"
  const parts = str.split(/[\/,;]|\s+or\s+/i).map(p => p.trim()).filter(Boolean)
  const cleaned: string[] = []

  for (const part of parts) {
    let s = part.replace(/^(office|tel|phone|hp|h\/p|contact|no|mobile)\s*[:.-]?\s*/i, '').trim()
    s = s.replace(/[\s\-\(\)\.]/g, '')
    if (s.startsWith('+60')) s = '0' + s.slice(3)
    else if (s.startsWith('60') && s.length > 9) s = '0' + s.slice(2)
    if (/^\d{7,13}$/.test(s)) {
      cleaned.push(s)
    }
  }

  return {
    primary: cleaned[0] || (str.replace(/[^0-9+]/g, '') || null),
    secondary: cleaned[1] || null,
  }
}

export function parseSmartAddress(raw: unknown): {
  addressLine1: string | null
  addressLine2: string | null
  addressLine3: string | null
  postcode: string | null
  city: string | null
  state: string | null
  country: string
  fullAddress: string | null
} {
  if (!raw) {
    return {
      addressLine1: null,
      addressLine2: null,
      addressLine3: null,
      postcode: null,
      city: null,
      state: null,
      country: 'MALAYSIA',
      fullAddress: null,
    }
  }

  const full = String(raw).trim()
  if (!full || full === '#N/A') {
    return {
      addressLine1: null,
      addressLine2: null,
      addressLine3: null,
      postcode: null,
      city: null,
      state: null,
      country: 'MALAYSIA',
      fullAddress: null,
    }
  }

  // Handle Walk-in
  if (/^walk\s*in$/i.test(full)) {
    return {
      addressLine1: 'Walk-in Customer',
      addressLine2: 'Langkawi Counter',
      addressLine3: null,
      postcode: '07000',
      city: 'LANGKAWI',
      state: 'KEDAH',
      country: 'MALAYSIA',
      fullAddress: 'Walk in, 07000 Langkawi, Kedah',
    }
  }

  // Extract postcode (5 digits in Malaysia)
  const postcodeMatch = full.match(/\b(\d{5})\b/)
  const postcode = postcodeMatch ? postcodeMatch[1] : null

  // Extract State
  let state: string | null = null
  for (const st of MALAYSIAN_STATES) {
    if (new RegExp(`\\b${st}\\b`, 'i').test(full)) {
      state = st === 'PENANG' ? 'PULAU PINANG' : st
      break
    }
  }
  if (!state && /langkawi/i.test(full)) state = 'KEDAH'

  // Extract City
  let city: string | null = null
  if (/langkawi/i.test(full)) city = 'LANGKAWI'
  else if (/kuah/i.test(full)) city = 'KUAH'
  else if (/subang\s*jaya/i.test(full)) city = 'SUBANG JAYA'
  else if (/balakong|seri\s*kembangan/i.test(full)) city = 'SERI KEMBANGAN'
  else if (/kuala\s*lumpur/i.test(full)) city = 'KUALA LUMPUR'
  else if (/george\s*town|penang/i.test(full)) city = 'PULAU PINANG'
  else if (/alor\s*setar/i.test(full)) city = 'ALOR SETAR'

  // Split lines (max 30 chars each)
  const segments = full.split(/,\s*/).map(s => s.trim()).filter(Boolean)
  let l1 = ''
  let l2 = ''
  let l3 = ''

  if (segments.length === 1) {
    l1 = segments[0].slice(0, 30)
    if (segments[0].length > 30) l2 = segments[0].slice(30, 60)
    if (segments[0].length > 60) l3 = segments[0].slice(60, 90)
  } else if (segments.length === 2) {
    l1 = segments[0].slice(0, 30)
    l2 = segments[1].slice(0, 30)
  } else {
    l1 = segments[0].slice(0, 30)
    l2 = segments[1].slice(0, 30)
    l3 = segments.slice(2).join(', ').slice(0, 30)
  }

  return {
    addressLine1: l1 || null,
    addressLine2: l2 || null,
    addressLine3: l3 || null,
    postcode,
    city,
    state,
    country: 'MALAYSIA',
    fullAddress: full,
  }
}

function normalizeCustomerName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(sdn|bhd|enterprise|holdings?|group|co|trading|snd)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

export function parseCreditTerms(raw: string) {
  const normal = raw.trim().toUpperCase()
  const dayMatch = normal.match(/^(\d{1,3})(?:\s*DAYS?)?$/)
  if (dayMatch) return { days: Number(dayMatch[1]), policy: 'CREDIT' }
  if (normal.includes('DEPOSIT')) return { days: null, policy: 'DEPOSIT' }
  if (normal === 'CASH') return { days: null, policy: 'CASH' }
  if (normal === 'COD') return { days: null, policy: 'COD' }
  return { days: null, policy: normal ? 'OTHER' : null }
}

function findSmartHeader(rows: unknown[][]): { index: number; headers: string[] } | null {
  let bestIdx = -1
  let maxScore = -1

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i]
    if (!Array.isArray(row)) continue
    const nonEmpty = row.filter(c => String(c ?? '').trim().length > 0)
    if (nonEmpty.length < 2) continue

    let score = 0
    const rowStr = row.map(c => String(c ?? '').trim().toLowerCase()).join(' ')
    if (/customer|company|syarikat|client/i.test(rowStr)) score += 4
    if (/name|nama/i.test(rowStr)) score += 3
    if (/address|alamat/i.test(rowStr)) score += 3
    if (/tel|phone|contact|no\.\s*tel|mobile/i.test(rowStr)) score += 3
    if (/no\.|no|bil/i.test(rowStr)) score += 1
    if (/type|jenis|category/i.test(rowStr)) score += 2
    if (/customer\s*id|customer\s*code|cust\s*id/i.test(rowStr)) score += 5

    if (score > maxScore) {
      maxScore = score
      bestIdx = i
    }
  }

  if (bestIdx >= 0 && maxScore >= 5) {
    return {
      index: bestIdx,
      headers: (rows[bestIdx] as unknown[]).map(c => String(c ?? '').trim()),
    }
  }
  return null
}

export function parseCustomerWorkbook(
  workbook: xlsx.WorkBook,
  startingCodeNum: number = 1
): {
  records: ParsedCustomerRecord[]
  summary: {
    totalSheets: number
    parsedSheets: string[]
    totalExtracted: number
    uniqueCustomers: number
    regularCount: number
  }
} {
  const mergedMap = new Map<string, {
    record: ParsedCustomerRecord
    sources: string[]
  }>()

  const parsedSheets: string[] = []
  let codeCounter = startingCodeNum

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    const rawRows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: false })
    if (rawRows.length < 2) continue

    const headerResult = findSmartHeader(rawRows)
    if (!headerResult) continue

    parsedSheets.push(sheetName)
    const { index: hIdx, headers } = headerResult

    // Match column indexes intelligently
    const nameColIdx = headers.findIndex(h =>
      /^(company\s*[\/\&]?\s*customer\s*name|customer\s*name|company\s*name|legal\s*name|description\(1\)|nama\s*syarikat|nama\s*pelanggan)$/i.test(h) ||
      (/name|nama|company|customer/i.test(h) && !/month|no|pic|tel|phone|contact|type|id/i.test(h))
    )

    const tradingNameColIdx = headers.findIndex(h =>
      /^(trading\s*name|description\(2\)|store\s*name|branch|cawangan)$/i.test(h)
    )

    const addrColIdx = headers.findIndex(h =>
      /^(address|full\s*address|alamat|location|lokasi|address\s*line\s*1)$/i.test(h) ||
      /address|alamat/i.test(h)
    )

    const telColIdx = headers.findIndex(h =>
      /^(tel\s*number|tel\s*no\.?|phone\s*no\.?|phone|telephone|mobile|contact\s*no|no\.?\s*tel)$/i.test(h) ||
      /tel|phone|mobile|phone\s*no/i.test(h)
    )

    const picColIdx = headers.findIndex(h =>
      /^(contact\s*person|pic|person\s*in\s*charge|attn|contact|nama\s*pic)$/i.test(h) ||
      /contact\s*person|pic|person\s*in\s*charge/i.test(h)
    )

    const typeColIdx = headers.findIndex(h =>
      /^(customer\s*type|type|category|jenis\s*pelanggan|jenis|classification|newtype)$/i.test(h) ||
      /customer\s*type|jenis/i.test(h)
    )

    // Strict customer code/ID match: ignore simple "No." or "Bil"
    const idColIdx = headers.findIndex(h =>
      /^(customer\s*id|customer\s*code|code\s*id|cust\s*id|sage\s*id|kod\s*pelanggan)$/i.test(h)
    )

    const emailColIdx = headers.findIndex(h => /email|e-mail/i.test(h))
    const regNoColIdx = headers.findIndex(h => /registration|reg\s*no|nric|passport/i.test(h))
    const tinColIdx = headers.findIndex(h => /tin|tax/i.test(h))
    const sstColIdx = headers.findIndex(h => /sst/i.test(h))
    const ctColIdx = headers.findIndex(h => /credit\s*term|terms?|ct/i.test(h))
    const salesRepColIdx = headers.findIndex(h => /sales\s*rep/i.test(h))

    for (let r = hIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r] as unknown[]
      if (!Array.isArray(row)) continue

      const rawName = nameColIdx >= 0 ? String(row[nameColIdx] ?? '').trim() : ''
      if (!rawName || rawName === '#N/A') continue
      // Skip banner remnants or repeat headers
      if (/^(company|customer|nama|month|no\.?)$/i.test(rawName) || rawName.toLowerCase().includes('customer name list')) {
        continue
      }

      const rawAddr = addrColIdx >= 0 ? String(row[addrColIdx] ?? '').trim() : ''
      const rawTel = telColIdx >= 0 ? String(row[telColIdx] ?? '').trim() : ''
      const rawPic = picColIdx >= 0 ? String(row[picColIdx] ?? '').trim() : ''
      const rawType = typeColIdx >= 0 ? String(row[typeColIdx] ?? '').trim() : ''
      const rawId = idColIdx >= 0 ? String(row[idColIdx] ?? '').trim() : ''
      const rawTrading = tradingNameColIdx >= 0 ? String(row[tradingNameColIdx] ?? '').trim() : ''
      const rawEmail = emailColIdx >= 0 ? String(row[emailColIdx] ?? '').trim() : ''
      const rawRegNo = regNoColIdx >= 0 ? String(row[regNoColIdx] ?? '').trim() : ''
      const rawTin = tinColIdx >= 0 ? String(row[tinColIdx] ?? '').trim() : ''
      const rawSst = sstColIdx >= 0 ? String(row[sstColIdx] ?? '').trim() : ''
      const rawCt = ctColIdx >= 0 ? String(row[ctColIdx] ?? '').trim() : ''
      const rawSalesRep = salesRepColIdx >= 0 ? String(row[salesRepColIdx] ?? '').trim() : ''

      const isRegularSheet = /regular/i.test(sheetName)
      const computedType = rawType || (isRegularSheet ? 'Regular' : 'General')
      const credit = parseCreditTerms(rawCt)
      const phoneInfo = cleanPhone(rawTel)
      const addrInfo = parseSmartAddress(rawAddr)

      const normKey = normalizeCustomerName(rawName) || rawName.toLowerCase()

      const existingEntry = mergedMap.get(normKey)
      if (!existingEntry) {
        // Auto-generate code if none provided in Excel
        const customerCode = rawId && rawId !== '#N/A'
          ? rawId
          : `3000/${String(codeCounter++).padStart(3, '0')}`

        const record: ParsedCustomerRecord = {
          customerCode,
          sageCustomerId: rawId ? rawId : null,
          legalName: rawName,
          tradingName: rawTrading && rawTrading !== '#N/A' ? rawTrading : null,
          pic: rawPic && rawPic !== '#N/A' ? rawPic : null,
          email: rawEmail && rawEmail !== '#N/A' ? rawEmail : null,
          phonePrimary: phoneInfo.primary,
          phoneSecondary: phoneInfo.secondary,
          customerType: computedType,
          customerSubtype: isRegularSheet ? 'REGULAR' : null,
          categoryCode: isRegularSheet ? 'REG' : null,
          zone: addrInfo.city || 'LANGKAWI',
          region: addrInfo.state || 'KEDAH',
          creditTermsRaw: rawCt || null,
          creditTermDays: credit.days,
          paymentPolicy: credit.policy,
          salesRep1: rawSalesRep || null,
          salesRep2: null,
          companyRegistrationNo: rawRegNo || null,
          tinNo: rawTin || null,
          sstNo: rawSst || null,
          importStatus: 'READY',
          sourceSheet: sheetName,
          sourceData: {
            sheetName,
            rawRow: row,
            detectedHeaders: headers,
          },
          addressLine1: addrInfo.addressLine1,
          addressLine2: addrInfo.addressLine2,
          addressLine3: addrInfo.addressLine3,
          city: addrInfo.city,
          state: addrInfo.state,
          postcode: addrInfo.postcode,
          country: addrInfo.country,
          fullAddress: addrInfo.fullAddress,
        }

        mergedMap.set(normKey, { record, sources: [sheetName] })
      } else {
        // Enrich existing entry with new information
        const rec = existingEntry.record
        existingEntry.sources.push(sheetName)

        if (!rec.pic && rawPic && rawPic !== '#N/A') rec.pic = rawPic
        if (!rec.phonePrimary && phoneInfo.primary) {
          rec.phonePrimary = phoneInfo.primary
          rec.phoneSecondary = phoneInfo.secondary
        }
        if (!rec.fullAddress && addrInfo.fullAddress) {
          rec.fullAddress = addrInfo.fullAddress
          rec.addressLine1 = addrInfo.addressLine1
          rec.addressLine2 = addrInfo.addressLine2
          rec.addressLine3 = addrInfo.addressLine3
          rec.city = addrInfo.city
          rec.state = addrInfo.state
          rec.postcode = addrInfo.postcode
        }
        if (isRegularSheet || /regular/i.test(computedType)) {
          rec.customerType = 'Regular'
          rec.customerSubtype = 'REGULAR'
          rec.categoryCode = 'REG'
        }
      }
    }
  }

  const records = Array.from(mergedMap.values()).map(v => v.record)
  const regularCount = records.filter(r => r.customerType === 'Regular').length

  return {
    records,
    summary: {
      totalSheets: workbook.SheetNames.length,
      parsedSheets,
      totalExtracted: records.length,
      uniqueCustomers: records.length,
      regularCount,
    },
  }
}
