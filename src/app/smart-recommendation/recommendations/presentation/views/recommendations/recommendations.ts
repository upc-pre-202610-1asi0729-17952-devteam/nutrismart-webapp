import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { RecommendationsStore } from '../../../application/recommendations.store';
import { IamStore } from '../../../../../iam/application/iam.store';
import { NutritionStore } from '../../../../../nutrition-tracking/application/nutrition.store';
import { WeatherType } from '../../../domain/model/weather-type.enum';
import { AdherenceStatus } from '../../../domain/model/adherence-status.enum';

/**
 * Main Recommendations view — route `/recommendations`.
 *
 * Orchestrates the weather context banner, recommendation card list,
 * AT_RISK preventive card (T34), DROPPED intervention card (T35),
 * travel mode panel (T36), and active-filters / daily-balance right panel.
 *
 * Includes a demo bar to cycle through all display states without a backend.
 *
 * @author Espinoza Cruz, Angela Milagros
 */
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

  /** Manual city input value for location-denied travel mode fallback. */
  protected manualCity = signal<string>('');

  /** Controls which right panel is visible when header buttons are pressed. */
  protected rightPanel = signal<'none'>('none');

  // ─── Demo bar state ───────────────────────────────────────────────────────

  /** Active demo weather state for the demo bar. */
  protected demoWeather    = signal<'hot' | 'cold'>('hot');

  /** Active demo adherence state for the demo bar. */
  protected demoAdherence  = signal<'on_track' | 'at_risk' | 'dropped'>('on_track');

  /** Whether the demo travel toggle is on. */
  protected demoTravel     = signal<boolean>(false);

  /** Whether the user has a Pro/Premium plan. */
  protected isPro = computed(() => this.iamStore.currentUser()?.isPro() ?? false);

  // ─── Daily balance (pulled from nutrition store) ──────────────────────────

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

  /**
   * Switches the weather demo state and reloads weather recommendation cards.
   *
   * @param type - 'hot' or 'cold'.
   */
  setDemoWeather(type: 'hot' | 'cold'): void {
    this.demoWeather.set(type);
    this.store.setWeatherType(type === 'hot' ? WeatherType.HOT : WeatherType.COLD);
  }

  /**
   * Switches the adherence demo state and loads the appropriate card.
   *
   * @param state - One of 'on_track' | 'at_risk' | 'dropped'.
   */
  setDemoAdherence(state: 'on_track' | 'at_risk' | 'dropped'): void {
    this.demoAdherence.set(state);
    const map: Record<string, AdherenceStatus> = {
      on_track: AdherenceStatus.ON_TRACK,
      at_risk:  AdherenceStatus.AT_RISK,
      dropped:  AdherenceStatus.DROPPED,
    };
    this.store.setAdherenceStatus(map[state]);
  }

  /**
   * Handler for the MatSlideToggle change event in the right panel.
   * Activates or deactivates travel mode based on the toggle state.
   *
   * @param event - MatSlideToggleChange emitted by the slide toggle.
   */
  onTravelToggleChange(event: MatSlideToggleChange): void {
    if (event.checked) {
      const city = this.manualCity().trim() || 'Cusco';
      this.store.activateTravelMode(city, '', true);
      this.demoTravel.set(true);
    } else {
      this.onTurnOffTravel();
    }
  }

  /**
   * Toggles the travel mode demo state.
   */
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

  /**
   * Activates travel mode from the manual city input in the right panel.
   */
  onConfirmManualCity(): void {
    const city = this.manualCity().trim();
    if (!city) return;
    this.store.activateTravelMode(city, '', true);
    this.demoTravel.set(true);
  }

  /**
   * Turns off travel mode from the right panel Turn off button.
   */
  onTurnOffTravel(): void {
    this.store.deactivateTravelMode();
    this.demoTravel.set(false);
    this.manualCity.set('');
  }

  /** No-op stub — would call the backend nutrition log in a real implementation. */
  onAddToLog(cardId: number): void {
    // Mock: card is added; a real implementation would call NutritionStore.addMealEntry()
  }

  /** Accepts the simplified intervention plan (stub). */
  onAcceptSimplifiedPlan(): void {
    this.store.setAdherenceStatus(AdherenceStatus.ON_TRACK);
    this.demoAdherence.set('on_track');
  }

  /** Logs the preventive recommendation now (stub). */
  onLogPreventiveNow(): void {
    this.store.setAdherenceStatus(AdherenceStatus.ON_TRACK);
    this.demoAdherence.set('on_track');
  }
}
