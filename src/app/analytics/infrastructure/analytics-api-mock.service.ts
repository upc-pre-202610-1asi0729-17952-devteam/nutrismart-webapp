import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AnalyticsApi } from './analytics-api';
import {
  AnalyticsData,
  AnalyticsPeriod,
  AdherenceHistoryEntry,
  BehavioralEvent,
  DailyCaloriesHistory,
  MacroAnalysis,
} from '../domain/model/analytics-models';

/**
 * Mock implementation of AnalyticsApi for local development and preview.
 * This service does not make actual HTTP requests.
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsApiMockService extends AnalyticsApi {
  // Implementaciones mock para los métodos abstractos.
  // Para el modo preview, estos métodos no serán llamados si usas loadPreviewData
  // directamente, pero son necesarios para que el inyector de dependencias
  // de Angular pueda resolver AnalyticsApi.

  getWeeklyHistory(userId: number): Observable<AnalyticsData> {
    console.warn('AnalyticsApiMockService: getWeeklyHistory called. Returning mock data.');
    return of(this.createMockAnalyticsData('7_DAYS'));
  }

  getMonthlyHistory(userId: number): Observable<AnalyticsData> {
    console.warn('AnalyticsApiMockService: getMonthlyHistory called. Returning mock data.');
    return of(this.createMockAnalyticsData('30_DAYS'));
  }

  getQuarterlyHistory(userId: number): Observable<AnalyticsData> {
    console.warn('AnalyticsApiMockService: getQuarterlyHistory called. Returning mock data.');
    return of(this.createMockAnalyticsData('90_DAYS'));
  }

  getWeeklyMacroAnalysis(userId: number): Observable<MacroAnalysis[]> {
    console.warn('AnalyticsApiMockService: getWeeklyMacroAnalysis called. Returning mock data.');
    return of([]); // AnalyticsStore's loadPreviewData handles this
  }

  getAdherenceHistory(userId: number): Observable<AdherenceHistoryEntry[]> {
    console.warn('AnalyticsApiMockService: getAdherenceHistory called. Returning mock data.');
    return of([]); // AnalyticsStore's loadPreviewData handles this
  }

  exportPdfReport(userId: number, fromDate: string, toDate: string): Observable<Blob> {
    console.warn('AnalyticsApiMockService: exportPdfReport called. Returning mock Blob.');
    return of(new Blob(['Mock PDF content'], { type: 'application/pdf' }));
  }

  // Helper para crear datos mock básicos si los métodos de la API son llamados
  private createMockAnalyticsData(period: AnalyticsPeriod): AnalyticsData {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    return {
      period: period,
      averageCalorieIntake: 1750,
      averageProteinIntake: 110,
      currentStreak: 7,
      weightChange: -0.5,
      weightChangeDirection: 'down',
      weightChangeStatus: 'positive',
      dailyCaloriesHistory: [
        { date: formatDate(new Date(today.setDate(today.getDate() - 6))), calories: 1800, goal: 1800 },
        { date: formatDate(new Date(today.setDate(today.getDate() + 1))), calories: 1700, goal: 1800 },
      ],
      macroAnalysis: [
        { name: 'Protein', consumed: 110, target: 120, colorClass: 'text-teal-500' },
      ],
      daysWithCompleteLog: [true, true, true, true, true, true, true],
      weightEvolution: [
        { date: formatDate(new Date(today.setDate(today.getDate() - 10))), weight: 70 },
        { date: formatDate(new Date(today.setDate(today.getDate() + 5))), weight: 69.5 },
      ],
      goalWeight: 65,
      adherenceHistory: [],
      behavioralEvents: [],
      proteinCompliance: undefined,
    };
  }
}
