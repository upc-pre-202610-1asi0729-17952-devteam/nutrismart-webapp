import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { RecommendationsStore } from '../../../application/recommendations.store';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';
import { WeatherContext } from '../../../domain/model/weather-context.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import { NutritionStore } from '../../../../nutrition-tracking/application/nutrition.store';
import { LocationPicker } from '../../components/location-picker/location-picker';

@Component({
  selector: 'app-recommendations',
  imports: [RouterLink, NgClass, TranslatePipe, LocationPicker],
  templateUrl: './recommendations.html',
  styleUrl: './recommendations.css',
})
export class RecommendationsView implements OnInit {
  protected store      = inject(RecommendationsStore);
  protected iamStore   = inject(IamStore);
  private nutStore     = inject(NutritionStore);
  private translate    = inject(TranslateService);

  protected isPro = computed(() => this.iamStore.currentUser()?.isPro() ?? false);

  protected displayTemperature = computed(() =>
    this.store.demoTemperature() ?? this.store.weatherContext()?.temperatureCelsius ?? null
  );

  // ─── Daily balance ────────────────────────────────────────────────────────

  protected dailyTarget    = computed(() => this.iamStore.currentUser()?.dailyCalorieTarget ?? 1800);
  protected dailyConsumed  = computed(() => this.nutStore.dailyTotals().calories);
  protected dailyRemaining = computed(() =>
    Math.max(0, this.dailyTarget() - this.dailyConsumed())
  );

  // ─── Derived display helpers ──────────────────────────────────────────────

  protected isDisplayHot = computed(() =>
    (this.displayTemperature() ?? this.store.weatherContext()?.temperatureCelsius ?? 0) >= 21
  );

  protected weatherIcon = computed(() => {
    if (!this.store.weatherContext()) return '◎';
    return this.isDisplayHot() ? '☀' : '❄';
  });

  protected weatherBannerClass = computed(() => {
    if (!this.store.weatherContext()) return 'banner--hot';
    return this.isDisplayHot() ? 'banner--hot' : 'banner--cold';
  });

  protected travelCity = computed(() => this.store.travelContext()?.city ?? '');

  protected sectionTitle = computed(() => {
    if (this.store.isTravelMode()) {
      return this.translate.instant('recommendations.section_travel', { city: this.travelCity() });
    }
    if (!this.store.weatherContext()) return this.translate.instant('recommendations.section_default');
    return this.isDisplayHot()
      ? this.translate.instant('recommendations.section_hot')
      : this.translate.instant('recommendations.section_cold');
  });

  protected sectionSubtitle = computed(() => {
    const w    = this.store.weatherContext();
    const user = this.iamStore.currentUser();
    const goalLabel = user?.goal?.toLowerCase()?.replace('_', ' ') ?? '';

    if (this.store.isTravelMode()) {
      return this.translate.instant('recommendations.subtitle_travel_filtered', {
        temp: w?.temperatureCelsius ?? '?',
      });
    }
    return this.translate.instant('recommendations.subtitle_filtered', {
      goal:    goalLabel,
      city:    w?.city ?? '',
      country: w?.country ?? '',
    });
  });

  protected pickerLabel = computed(() => {
    const temp = this.displayTemperature();
    if (this.store.isTravelMode()) {
      const t = this.store.travelContext();
      return `${t?.city ?? ''} · ${temp ?? '?'}°C`;
    }
    const w = this.store.weatherContext();
    if (!w) return '';
    return `${w.city} · ${temp ?? w.temperatureCelsius}°C`;
  });

  protected weatherConditionLabel = computed(() => {
    if (!this.store.weatherContext()) return '';
    return this.isDisplayHot()
      ? this.translate.instant('recommendations.condition_hot')
      : this.translate.instant('recommendations.condition_cold');
  });

  protected weatherUpdatedAgo = computed(() => {
    const w = this.store.weatherContext();
    if (!w) return '';
    const diff = Math.round((Date.now() - new Date(w.updatedAt).getTime()) / 60000);
    if (diff < 1) return this.translate.instant('recommendations.updated_just_now');
    return this.translate.instant('recommendations.updated_mins_ago', { mins: diff });
  });

  protected session = computed(() => this.store.session());

  async ngOnInit(): Promise<void> {
    await this.store.initialise();
    await this.nutStore.loadDailyBalance();
    await this.nutStore.loadMealHistory();
  }

  // ─── Location picker ──────────────────────────────────────────────────────

  onCitySelected(loc: WeatherContext): void {
    const homeCity = this.iamStore.currentUser()?.homeCity ?? '';
    if (loc.city === homeCity) {
      void this.store.deactivateTravelMode();
    } else {
      void this.store.activateTravelMode(loc.city, loc.country, true);
    }
  }

  onTemperatureChanged(temp: number): void {
    this.store.setDemoTemperature(temp);
  }

  // ─── Travel mode user actions ─────────────────────────────────────────────

  onDisableAutoTravel(): void {
    void this.store.deactivateTravelMode();
  }

  // TODO: wire to NutritionStore once cross-BC integration is ready
  onAddToLog(_cardId: number | string): void {}

  onAcceptSimplifiedPlan(): void {
    this.store.setAdherenceStatus(AdherenceStatus.ON_TRACK);
  }

  onLogPreventiveNow(): void {
    this.store.setAdherenceStatus(AdherenceStatus.ON_TRACK);
  }
}
