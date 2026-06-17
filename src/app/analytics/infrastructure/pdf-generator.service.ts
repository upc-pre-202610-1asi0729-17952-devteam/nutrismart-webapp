import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { AnalyticsData, AdherenceStatus } from '../domain/model/analytics-models';

export interface PdfReportOptions {
  fromDate: string;
  toDate: string;
  includeDaily: boolean;
  includeMacros: boolean;
  includeWeight: boolean;
  includeAdherence: boolean;
  includeActivity: boolean;
}

type RGB = [number, number, number];

const T: RGB  = [0, 137, 123];   // brand teal
const B: RGB  = [26, 26, 26];    // near-black
const G6: RGB = [85, 85, 85];    // gray-600
const G3: RGB = [204, 204, 204]; // gray-300
const G1: RGB = [245, 245, 245]; // gray-100
const W: RGB  = [255, 255, 255];
const GR: RGB = [46, 125, 50];   // green
const AM: RGB = [245, 127, 23];  // amber
const RE: RGB = [198, 40, 40];   // red
const BL: RGB = [21, 101, 192];  // blue

const PW = 210; const PH = 297; const M = 16; const CW = PW - M * 2;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

@Injectable({ providedIn: 'root' })
export class PdfGeneratorService {

  generate(data: AnalyticsData, options: PdfReportOptions, userName?: string): Blob {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const d   = this.filterByRange(data, options.fromDate, options.toDate);

    this.cover(doc, options, userName);
    this.summary(doc, d);

    if (options.includeDaily     && d.dailyCaloriesHistory.length > 0) this.sectionDaily(doc, d);
    if (options.includeMacros    && d.macroAnalysis.length > 0)        this.sectionMacros(doc, d);
    if (options.includeWeight    && d.weightEvolution.length > 0)      this.sectionWeight(doc, d);
    if (options.includeAdherence && (d.adherenceHistory?.length ?? 0) > 0) this.sectionAdherence(doc, d);

    this.stampPageNumbers(doc);
    return doc.output('blob');
  }

  // ─── Data filter ──────────────────────────────────────────────────────────────

  private filterByRange(data: AnalyticsData, from: string, to: string): AnalyticsData {
    const ok = (dt: string) => dt >= from && dt <= to;
    return {
      ...data,
      dailyCaloriesHistory: data.dailyCaloriesHistory.filter(r => ok(r.date)),
      weightEvolution:      data.weightEvolution.filter(r => ok(r.date)),
      adherenceHistory:     data.adherenceHistory?.filter(r => ok(r.date)),
      behavioralEvents:     data.behavioralEvents?.filter(r => ok(r.date)),
    };
  }

  // ─── Cover ────────────────────────────────────────────────────────────────────

  private cover(doc: jsPDF, opts: PdfReportOptions, userName?: string): void {
    this.fr(doc, 0, 0, PW, 60, T);

    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    this.tc(doc, W); doc.text('NutriSmart', M, 28);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text('Intelligent Nutrition Platform', M, 38);

    doc.setFontSize(28); doc.setFont('helvetica', 'bold');
    this.tc(doc, B); doc.text('Analytics Report', M, 90);
    this.fr(doc, M, 94, 50, 1.5, T);

    this.frr(doc, M, 104, CW, 30, 3, G1);
    this.sr(doc, M, 104, CW, 30, 3, G3);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    this.tc(doc, G6); doc.text('REPORT PERIOD', M + 8, 114);
    doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    this.tc(doc, B);
    doc.text(`${this.fd(opts.fromDate)}  >>  ${this.fd(opts.toDate)}`, M + 8, 124);

    let metaY = 148;
    if (userName) {
      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); this.tc(doc, G6);
      doc.text('PREPARED FOR', M, metaY);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold'); this.tc(doc, B);
      doc.text(userName, M, metaY + 6);
      metaY += 18;
    }
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); this.tc(doc, G6);
    doc.text('GENERATED ON', M, metaY);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); this.tc(doc, B);
    doc.text(this.fd(new Date().toISOString().split('T')[0]), M, metaY + 6);

    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); this.tc(doc, G6);
    doc.text('SECTIONS INCLUDED', M, 200);
    const sects = ['Executive Summary'];
    if (opts.includeDaily)     sects.push('Daily Calories');
    if (opts.includeMacros)    sects.push('Macro Analysis');
    if (opts.includeWeight)    sects.push('Weight Evolution');
    if (opts.includeAdherence) sects.push('Adherence History');
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); this.tc(doc, B);
    doc.text(sects.join('  ·  '), M, 208);

    this.footer(doc);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────────

  private summary(doc: jsPDF, d: AnalyticsData): void {
    doc.addPage();
    let y = this.header(doc, 'Executive Summary');

    const goal    = d.dailyCaloriesHistory[0]?.goal ?? 2000;
    const protein = d.macroAnalysis.find(m => m.key === 'protein');
    const cards = [
      { label: 'Avg. Calorie Intake',  value: `${d.averageCalorieIntake} kcal`,
        sub: d.averageCalorieIntake > goal ? 'Above daily goal' : 'Within daily goal',
        color: d.averageCalorieIntake > goal ? AM : GR },
      { label: 'Avg. Protein Intake',  value: `${protein?.consumed ?? 0}g`,
        sub: d.proteinCompliance ?? 'On track', color: GR },
      { label: 'Current Streak',       value: `${d.currentStreak} days`,
        sub: 'Consecutive days logged', color: T },
      { label: 'Weight Change',
        value: `${d.weightChange > 0 ? '+' : ''}${d.weightChange} kg`,
        sub: d.weightChangeDirection === 'down' ? 'Downward trend'
           : d.weightChangeDirection === 'up'   ? 'Upward trend' : 'No change',
        color: d.weightChangeStatus === 'positive' ? GR
             : d.weightChangeStatus === 'negative' ? RE : G6 },
    ];

    const cw = (CW - 6) / 2; const ch = 32; const gap = 6;
    for (let i = 0; i < cards.length; i++) {
      const c  = cards[i];
      const cx = M + (i % 2) * (cw + gap);
      const cy = y + Math.floor(i / 2) * (ch + gap);
      this.frr(doc, cx, cy, cw, ch, 3, G1);
      this.sr(doc, cx, cy, cw, ch, 3, G3);
      this.fr(doc, cx, cy, 3, ch, c.color);
      doc.setFontSize(8);  doc.setFont('helvetica', 'normal');   this.tc(doc, G6); doc.text(c.label.toUpperCase(), cx + 8, cy + 10);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');     this.tc(doc, B);  doc.text(c.value, cx + 8, cy + 20);
      doc.setFontSize(8);  doc.setFont('helvetica', 'normal');   this.tc(doc, G6); doc.text(c.sub, cx + 8, cy + 27);
    }
    y += 2 * (ch + gap) + 10;

    const events = d.behavioralEvents ?? [];
    if (events.length > 0) {
      y = this.sectionTitle(doc, 'Key Behavioral Events', y);
      for (const ev of events.slice(0, 5)) {
        y = this.pb(doc, y, 10);
        this.fr(doc, M, y, 3, 6, AM);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold'); this.tc(doc, B);
        doc.text(this.fd(ev.date), M + 6, y + 5);
        doc.setFont('helvetica', 'normal'); this.tc(doc, G6);
        doc.text(ev.description, M + 32, y + 5);
        y += 10;
      }
    }
    this.footer(doc);
  }

  // ─── Daily Calories ───────────────────────────────────────────────────────────

  private sectionDaily(doc: jsPDF, d: AnalyticsData): void {
    doc.addPage();
    let y = this.header(doc, 'Daily Calorie History');
    const cols = [40, 42, 42, CW - 124];
    y = this.tableHeader(doc, ['Date', 'Calories (kcal)', 'Goal (kcal)', 'Status'], cols, y);

    for (let i = 0; i < d.dailyCaloriesHistory.length; i++) {
      const row  = d.dailyCaloriesHistory[i];
      const over = row.calories > row.goal;
      y = this.pb(doc, y, 8);
      if (i % 2 === 0) this.fr(doc, M, y, CW, 8, G1);

      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      let cx = M + 3;
      this.tc(doc, B); doc.text(this.fd(row.date),     cx, y + 5.5); cx += cols[0];
      this.tc(doc, B); doc.text(`${row.calories}`,      cx, y + 5.5); cx += cols[1];
      this.tc(doc, B); doc.text(`${row.goal}`,          cx, y + 5.5); cx += cols[2];

      // inline progress bar + status
      const pct = Math.min(row.calories / row.goal, 1);
      this.fr(doc, cx, y + 2, 18, 3.5, G3);
      this.fr(doc, cx, y + 2, 18 * pct, 3.5, over ? AM : T);
      this.tc(doc, over ? RE : GR);
      doc.text(over ? 'Over goal' : 'On track', cx + 21, y + 5.5);
      y += 8;
    }
    this.tableBorder(doc, y);
    this.footer(doc);
  }

  // ─── Macros ───────────────────────────────────────────────────────────────────

  private sectionMacros(doc: jsPDF, d: AnalyticsData): void {
    doc.addPage();
    let y = this.header(doc, 'Macro Nutrient Analysis');
    const cols = [38, 33, 33, 28, CW - 132];
    y = this.tableHeader(doc, ['Macro', 'Consumed', 'Target', '% of Goal', 'Progress'], cols, y);

    for (let i = 0; i < d.macroAnalysis.length; i++) {
      const m   = d.macroAnalysis[i];
      const pct = m.target > 0 ? m.consumed / m.target : 0;
      y = this.pb(doc, y, 16);
      if (i % 2 === 0) this.fr(doc, M, y, CW, 16, G1);

      doc.setFontSize(9);
      let cx = M + 3;
      doc.setFont('helvetica', 'bold');   this.tc(doc, B);  doc.text(m.key.charAt(0).toUpperCase() + m.key.slice(1), cx, y + 8); cx += cols[0];
      doc.setFont('helvetica', 'normal'); this.tc(doc, B);  doc.text(`${m.consumed}g`, cx, y + 8); cx += cols[1];
      doc.setFont('helvetica', 'normal'); this.tc(doc, G6); doc.text(`${m.target}g`, cx, y + 8); cx += cols[2];
      this.tc(doc, m.isAboveTarget ? AM : GR); doc.text(`${Math.round(pct * 100)}%`, cx, y + 8); cx += cols[3];
      this.fr(doc, cx, y + 5.5, cols[4] - 4, 4, G3);
      this.fr(doc, cx, y + 5.5, (cols[4] - 4) * Math.min(pct, 1), 4, m.isAboveTarget ? AM : T);
      y += 16;
    }
    this.tableBorder(doc, y);
    this.footer(doc);
  }

  // ─── Weight ───────────────────────────────────────────────────────────────────

  private sectionWeight(doc: jsPDF, d: AnalyticsData): void {
    doc.addPage();
    let y = this.header(doc, 'Weight Evolution');
    if (d.goalWeight) {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); this.tc(doc, G6);
      doc.text(`Goal weight: ${d.goalWeight} kg`, M, y); y += 8;
    }
    const cols = [55, 50, CW - 105];
    y = this.tableHeader(doc, ['Date', 'Weight (kg)', 'vs Previous'], cols, y);

    for (let i = 0; i < d.weightEvolution.length; i++) {
      const e    = d.weightEvolution[i];
      const prev = i > 0 ? d.weightEvolution[i - 1].weight : null;
      const diff = prev !== null ? +(e.weight - prev).toFixed(1) : null;
      const ds   = diff === null ? '—' : diff > 0 ? `+${diff} kg` : `${diff} kg`;
      y = this.pb(doc, y, 8);
      if (i % 2 === 0) this.fr(doc, M, y, CW, 8, G1);

      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      let cx = M + 3;
      this.tc(doc, B);  doc.text(this.fd(e.date),   cx, y + 5.5); cx += cols[0];
      this.tc(doc, B);  doc.text(`${e.weight} kg`,  cx, y + 5.5); cx += cols[1];
      this.tc(doc, diff === null ? G6 : diff > 0 ? RE : GR);
      doc.text(ds, cx, y + 5.5);
      y += 8;
    }
    this.tableBorder(doc, y);
    this.footer(doc);
  }

  // ─── Adherence ────────────────────────────────────────────────────────────────

  private sectionAdherence(doc: jsPDF, d: AnalyticsData): void {
    const hist = d.adherenceHistory ?? [];
    doc.addPage();
    let y = this.header(doc, 'Adherence History');

    const legend: [string, RGB][] = [['On Track', GR], ['At Risk', AM], ['Dropped', RE], ['Recovered', BL]];
    let lx = M;
    for (const [lbl, col] of legend) {
      this.fr(doc, lx, y, 7, 5, col);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal'); this.tc(doc, G6);
      doc.text(lbl, lx + 9, y + 4);
      lx += 36;
    }
    y += 12;

    const cols = [60, CW - 60];
    y = this.tableHeader(doc, ['Date', 'Status'], cols, y);

    for (let i = 0; i < hist.length; i++) {
      const e = hist[i];
      y = this.pb(doc, y, 9);
      if (i % 2 === 0) this.fr(doc, M, y, CW, 9, G1);

      doc.setFontSize(9); doc.setFont('helvetica', 'normal'); this.tc(doc, B);
      doc.text(this.fd(e.date), M + 3, y + 6);

      const col = this.statusColor(e.status);
      const lbl = this.statusLabel(e.status);
      const bw  = lbl.length * 1.8 + 8;
      this.frr(doc, M + cols[0], y + 1.5, bw, 6, 2, col);
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); this.tc(doc, W);
      doc.text(lbl, M + cols[0] + bw / 2, y + 6, { align: 'center' });
      y += 9;
    }
    this.tableBorder(doc, y);
    this.footer(doc);
  }

  // ─── Layout helpers ───────────────────────────────────────────────────────────

  private header(doc: jsPDF, title: string): number {
    this.fr(doc, 0, 0, PW, 20, T);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold');   this.tc(doc, W); doc.text('NUTRISMART', M, 10);
    doc.setFont('helvetica', 'normal'); doc.text('Analytics Report', M + 28, 10);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); this.tc(doc, B); doc.text(title, M, 32);
    this.fr(doc, M, 34, 40, 1, T);
    return 44;
  }

  private footer(doc: jsPDF): void {
    const fy = PH - 8;
    this.fr(doc, 0, fy - 3, PW, 11, T);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); this.tc(doc, W);
    doc.text('NutriSmart Analytics · Confidential', M, fy + 2);
  }

  private stampPageNumbers(doc: jsPDF): void {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      const fy = PH - 8;
      doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); this.tc(doc, W);
      doc.text(`Page ${i} of ${total}`, PW - M, fy + 2, { align: 'right' });
    }
  }

  private sectionTitle(doc: jsPDF, title: string, y: number): number {
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); this.tc(doc, B); doc.text(title, M, y);
    this.fr(doc, M, y + 2, CW, 0.5, G3);
    return y + 10;
  }

  private tableHeader(doc: jsPDF, labels: string[], cols: number[], y: number): number {
    this.fr(doc, M, y, CW, 9, T);
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); this.tc(doc, W);
    let cx = M + 3;
    for (let i = 0; i < labels.length; i++) { doc.text(labels[i], cx, y + 6); cx += cols[i]; }
    return y + 9;
  }

  private tableBorder(doc: jsPDF, endY: number): void {
    doc.setDrawColor(...G3); doc.setLineWidth(0.3);
    doc.rect(M, 53, CW, endY - 53);
  }

  private pb(doc: jsPDF, y: number, rh: number): number {
    if (y + rh > PH - 20) {
      doc.addPage();
      this.fr(doc, 0, 0, PW, 20, T);
      this.footer(doc);
      return 28;
    }
    return y;
  }

  // ─── Drawing primitives ───────────────────────────────────────────────────────

  /** Fill rect */
  private fr(doc: jsPDF, x: number, y: number, w: number, h: number, c: RGB): void {
    doc.setFillColor(...c); doc.rect(x, y, w, h, 'F');
  }
  /** Fill rounded rect */
  private frr(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, c: RGB): void {
    doc.setFillColor(...c); doc.roundedRect(x, y, w, h, r, r, 'F');
  }
  /** Stroke rounded rect */
  private sr(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, c: RGB): void {
    doc.setDrawColor(...c); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, h, r, r, 'S');
  }
  /** Fill circle */
  private fc(doc: jsPDF, cx: number, cy: number, radius: number, c: RGB): void {
    doc.setFillColor(...c); doc.circle(cx, cy, radius, 'F');
  }
  /** Set text color */
  private tc(doc: jsPDF, c: RGB): void { doc.setTextColor(...c); }

  // ─── Formatting ───────────────────────────────────────────────────────────────

  private fd(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}, ${y}`;
  }

  private statusColor(s: AdherenceStatus): RGB {
    return s === 'ON_TRACK' ? GR : s === 'AT_RISK' ? AM : s === 'DROPPED' ? RE : BL;
  }

  private statusLabel(s: AdherenceStatus): string {
    return s === 'ON_TRACK' ? 'ON TRACK' : s === 'AT_RISK' ? 'AT RISK' : s === 'DROPPED' ? 'DROPPED' : 'RECOVERED';
  }
}
