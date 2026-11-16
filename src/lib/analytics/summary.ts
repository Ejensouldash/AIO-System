import type { AnalyticsPayload, ExecutiveSummary } from "./types"

const fmt = (n: number) => n.toLocaleString("en-MY")
const dmy = (iso: string) => {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

/**
 * Deterministic executive summary built purely from the numbers.
 *
 * Used as the fallback whenever Gemini is unavailable (no API key, quota, 503), and also as the
 * factual brief that is handed to the model so it never has to invent figures.
 */
export function buildRuleBasedSummary(d: AnalyticsPayload): ExecutiveSummary {
  const { kpi, extremes, problems, coverage, bySku } = d

  const topSku = bySku[0]
  const topSection = problems.downtimeBySection[0]
  const topReject = problems.paretoRejects[0]

  const overview: string[] = [
    `From ${dmy(d.range.from)} to ${dmy(d.range.to)} (${d.range.workingDays} working days), total production was ${fmt(kpi.totalBoxes)} boxes equivalent to ${fmt(kpi.totalPcs)} bottles.`,
    `Average production of ${fmt(kpi.avgBoxesPerWorkingDay)} boxes per working day.`,
    `Total rejects recorded: ${fmt(kpi.totalRejects)} units at an overall rate of ${kpi.rejectRate}%.`,
    `Total downtime recorded: ${fmt(kpi.totalDowntime)} minutes across ${kpi.downtimeIncidents} incidents.`,
  ]

  const findings: string[] = []
  if (topSku && topSku.boxes > 0) {
    findings.push(`SKU ${topSku.label} dominated production with ${fmt(topSku.boxes)} boxes (${topSku.share}% of total volume).`)
  }
  if (extremes.bestDay) {
    findings.push(`Peak production day was ${extremes.bestDay.dayName} ${dmy(extremes.bestDay.date)} with ${fmt(extremes.bestDay.boxes)} boxes.`)
  }
  if (extremes.worstDay) {
    findings.push(`Lowest production day was ${extremes.worstDay.dayName} ${dmy(extremes.worstDay.date)} with only ${fmt(extremes.worstDay.boxes)} boxes.`)
  }
  if (extremes.bestShiftLabel && extremes.worstShiftLabel && extremes.bestShiftLabel !== extremes.worstShiftLabel) {
    const best = d.byShift.find(s => s.shift === extremes.bestShiftLabel)
    const worst = d.byShift.find(s => s.shift === extremes.worstShiftLabel)
    if (best && worst) {
      findings.push(`Shift ${best.shift} produced ${fmt(best.boxes)} boxes compared to Shift ${worst.shift} with ${fmt(worst.boxes)} boxes.`)
    }
  }
  if (topReject) {
    findings.push(`Top reject contributor was ${topReject.name} with ${fmt(topReject.value)} units (${topReject.cumulative}% cumulative).`)
  }

  const risks: string[] = []
  if (topSection) {
    risks.push(`${topSection.section} contributed the highest downtime at ${fmt(topSection.minutes)} minutes across ${topSection.incidents} incidents.`)
  }
  if (problems.longestIncident) {
    risks.push(`Longest single incident was ${problems.longestIncident.minutes} minutes at ${problems.longestIncident.section} on ${dmy(problems.longestIncident.date)} Shift ${problems.longestIncident.shift}.`)
  }
  if (coverage.missing.length > 0) {
    const list = coverage.missing.slice(0, 5).map(m => `${dmy(m.date)} ${m.shift} ${m.line}`).join("; ")
    risks.push(`${coverage.missing.length} report slot(s) missing: ${list}${coverage.missing.length > 5 ? " and others" : ""}.`)
  }
  if (coverage.notApproved.length > 0) {
    risks.push(`${coverage.notApproved.length} report(s) are pending approval and excluded from metrics above.`)
  }
  const highRate = Object.entries(d.rates.categoryStats).filter(([, s]) => s.comparable && s.rate > 5)
  if (highRate.length > 0) {
    risks.push(`Reject rate exceeds 5% for ${highRate.map(([c, s]) => `${c} (${s.rate}%)`).join(", ")}.`)
  }

  const recommendations: string[] = []
  if (topSection) {
    recommendations.push(`Investigate recurring downtime causes in ${topSection.section} — accounts for ${Math.round((topSection.minutes / Math.max(kpi.totalDowntime, 1)) * 100)}% of total downtime.`)
  }
  if (coverage.missing.length > 0) {
    recommendations.push(`Ensure each shift completes mandatory logs. Current form compliance is ${kpi.compliancePct}% (${kpi.reportsSubmitted}/${kpi.reportsExpected} slots).`)
  }
  if (coverage.notApproved.length > 0) {
    recommendations.push(`Approve pending shift reports so analytics reflect actual plant throughput.`)
  }
  if (topReject) {
    recommendations.push(`Focus corrective actions on ${topReject.name} as it constitutes the primary reject volume.`)
  }
  if (recommendations.length === 0) {
    recommendations.push("No critical operational issues detected in this period. Maintain current standard operating procedures.")
  }

  const headline = extremes.bestDay
    ? `${fmt(kpi.totalBoxes)} boxes produced with ${kpi.rejectRate}% reject rate and ${kpi.compliancePct}% form compliance`
    : `No production recorded for the period ${dmy(d.range.from)} – ${dmy(d.range.to)}`

  return { headline, overview, findings, risks, recommendations, source: "rule-based" }
}

/** Compact factual brief handed to the model. Keeps the prompt small and the figures exact. */
export function buildAnalyticsBrief(d: AnalyticsPayload) {
  return {
    tempoh: { dari: d.range.from, hingga: d.range.to, hariBekerja: d.range.workingDays },
    jumlah: {
      kotak: d.kpi.totalBoxes,
      botol: d.kpi.totalPcs,
      reject: d.kpi.totalRejects,
      rejectSebelum: d.kpi.totalRejectsBefore,
      rejectSelepas: d.kpi.totalRejectsAfter,
      kadarRejectPeratus: d.kpi.rejectRate,
      downtimeMinit: d.kpi.totalDowntime,
      insidenDowntime: d.kpi.downtimeIncidents,
      // This is form-submission compliance, not a quality or yield figure.
      peratusBorangDiisi: d.kpi.compliancePct,
      purataKotakSehari: d.kpi.avgBoxesPerWorkingDay,
    },
    ikutSku: d.bySku.map(s => ({ sku: s.label, kotak: s.boxes, botol: s.pcs, peratusShare: s.share, reject: s.rejects })),
    ikutShift: d.byShift.map(s => ({ shift: s.shift, kotak: s.boxes, reject: s.rejects, downtimeMinit: s.downtime, bilanganReport: s.reports })),
    ikutLine: d.byLine.map(l => ({ line: l.line, kotak: l.boxes, reject: l.rejects })),
    harian: d.byDay.map(x => ({ tarikh: x.date, hari: x.dayName, hariBekerja: x.isWorkingDay, kotak: x.boxes, reject: x.rejects, downtimeMinit: x.downtime, reportDiterima: x.reports, reportDijangka: x.expectedReports })),
    hariTerbaik: d.extremes.bestDay ? { tarikh: d.extremes.bestDay.date, hari: d.extremes.bestDay.dayName, kotak: d.extremes.bestDay.boxes } : null,
    hariTerendah: d.extremes.worstDay ? { tarikh: d.extremes.worstDay.date, hari: d.extremes.worstDay.dayName, kotak: d.extremes.worstDay.boxes } : null,
    downtimeIkutSeksyen: d.problems.downtimeBySection.map(s => ({ seksyen: s.section, minit: s.minutes, insiden: s.incidents, sebab: s.reasons.slice(0, 3) })),
    rejectTerbesar: d.problems.paretoRejects.slice(0, 6),
    kadarIkutKategori: Object.entries(d.rates.categoryStats).map(([kategori, s]) => ({
      kategori,
      guna: s.usage,
      reject: s.rejects,
      // Only quote kadarPeratus when bolehDibanding is true. Where it is false the usage and
      // reject figures are in different units, so the percentage is meaningless.
      kadarPeratus: s.comparable ? s.rate : null,
      bolehDibanding: s.comparable,
      nota: s.comparable ? null : `Unit tidak sepadan (${s.unit}) — kadar tidak sah untuk dilaporkan`,
    })),
    borangTidakDiisi: d.coverage.missing,
    borangBelumDiluluskan: d.coverage.notApproved.map(n => ({ tarikh: n.date, shift: n.shift, line: n.line, status: n.status })),
  }
}
