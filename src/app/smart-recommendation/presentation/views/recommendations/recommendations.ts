import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { RecommendationsStore } from '../../../application/recommendations.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { NutritionStore } from '../../../../nutrition-tracking/application/nutrition.store';
import { WeatherType } from '../../../domain/model/weather-type.enum';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';

@Component({
  selector: 'app-recommendations',
  imports: [RouterLink, NgClass, MatSlideToggle],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.css',
})
export class RecommendationsView implements OnInit {
  protected store      = inject(RecommendationsStore);
  protected iamStore   = inject(IamStore);
  private nutStore     = inject(NutritionStore);

  protected manualCity = signal<string>('');
  protected rightPanel = signal<'none'>('none');

  // ─── Demo bar state ───────────────────────────────────────────────────────

  protected demoWeather    = signal<'hot' | 'cold'>('hot');
  protected demoAdherence  = signal<'on_track' | 'at_risk' | 'dropped'>('on_track');
  protected demoTravel     = signal<boolean>(false);

  protected isPro = computed(() => this.iamStore.currentUser()?.isPro() ?? false);

  // ─── Daily balance ────────────────────────────────────────────────────────

  protected dailyTarget    = computed(() => this.iamStore.currentUser()?.dailyCalorieTarget ?? 1800);
  protected dailyConsumed  = computed(() => this.nutStore.dailyTotals().calories);
  protected dailyRemaining = computed(() =>
    Math.max(0, this.dailyTarget() - this.dailyConsumed())
  );

  // ─── Derived display helpers ──────────────────────────────────────────────

  protected weatherIcon = computed(() => {
    const w = this.store.weatherContext();
    if (!w) return '◎';
    return w.isHot() ? '☀' : '❄';
  });

  protected weatherBannerClass = computed(() => {
    const w = this.store.weatherContext();
    if (!w) return 'banner--hot';
    return w.isHot() ? 'banner--hot' : 'banner--cold';
  });

  protected travelCity = computed(() => this.store.travelContext()?.city ?? '');

  protected sectionTitle = computed(() => {
    if (this.store.isTravelMode()) return `Traditional dishes from ${this.travelCity()}`;
    const w = this.store.weatherContext();
    if (!w) return 'Recommendations';
    return w.isHot() ? 'Recommendations for hot weather' : 'Recommendations for cold weather';
  });

  protected sectionSubtitle = computed(() => {
    const w = this.store.weatherContext();
    const user = this.iamStore.currentUser();
    const goalLabel = user?.goal?.toLowerCase()?.replace('_', ' ') ?? 'your profile';

    if (this.store.isTravelMode()) {
      const travel = this.store.travelContext();
      return `Filtered by your profile · Local weather: ${w?.temperatureCelsius ?? '?'}°C · Travel mode active`;
    }
    return `Filtered by your ${goalLabel} profile and active restrictions · ${w?.city ?? ''}, ${w?.country ?? ''}`;
  });

  protected headerBadgeLabel = computed(() => {
    if (this.store.isTravelMode()) {
      const t = this.store.travelContext();
      const w = this.store.weatherContext();
      return `Travel Mode · ${t?.city ?? ''} · ${w?.temperatureCelsius ?? '?'}°C`;
    }
    return this.store.weatherContext()?.formattedLabel() ?? '';
  });

  protected headerBadgeIcon = computed(() =>
    this.store.isTravelMode() ? '📍' : this.weatherIcon()
  );

  protected travelDetectedAuto = computed(() =>
    this.store.isTravelMode() && !this.store.travelContext()?.isManual
  );

  protected session = computed(() => this.store.session());

  async ngOnInit(): Promise<void> {
    await this.store.initialise();
    await this.nutStore.fetchDailyBalance();
    await this.nutStore.fetchMealEntries();
  }

  // ─── Demo bar actions ─────────────────────────────────────────────────────

  setDemoWeather(type: 'hot' | 'cold'): void {
    this.demoWeather.set(type);
    this.store.setWeatherType(type === 'hot' ? WeatherType.HOT : WeatherType.COLD);
  }

  setDemoAdherence(state: 'on_track' | 'at_risk' | 'dropped'): void {
    this.demoAdherence.set(state);
    const map: Record<string, AdherenceStatus> = {
      on_track: AdherenceStatus.ON_TRACK,
      at_risk:  AdherenceStatus.AT_RISK,
      dropped:  AdherenceStatus.DROPPED,
    };
    this.store.setAdherenceStatus(map[state]);
  }

  onTravelToggleChange(event: MatSlideToggleChange): void {
    if (event.checked) {
      const city = this.manualCity().trim() || 'Cusco';
      this.store.activateTravelMode(city, '', true);
      this.demoTravel.set(true);
    } else {
      this.onTurnOffTravel();
    }
  }

  toggleDemoTravel(): void {
    const next = !this.demoTravel();
    this.demoTravel.set(next);
    if (next) {
      this.store.activateTravelMode('Cusco', 'Peru', false);
    } else {
      this.store.deactivateTravelMode();
    }
  }

  // ─── Travel mode user actions ─────────────────────────────────────────────

  onConfirmManualCity(): void {
    const city = this.manualCity().trim();
    if (!city) return;
    this.store.activateTravelMode(city, '', true);
    this.demoTravel.set(true);
  }

  onTurnOffTravel(): void {
    this.store.deactivateTravelMode();
    this.demoTravel.set(false);
    this.manualCity.set('');
  }

  onAddToLog(_cardId: number): void {}

  onAcceptSimplifiedPlan(): void {
    this.store.setAdherenceStatus(AdherenceStatus.ON_TRACK);
    this.demoAdherence.set('on_track');
  }

  onLogPreventiveNow(): void {
    this.store.setAdherenceStatus(AdherenceStatus.ON_TRACK);
    this.demoAdherence.set('on_track');
  }
}
