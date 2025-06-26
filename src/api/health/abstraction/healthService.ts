// src/services/health/HealthService.ts
// Abstract contract that all platform-specific health services (AndroidHealthService,
// AppleHealthService, WebHealthService, MockHealthService …) must implement.
//
// ⚙️  Usage example:
// import healthService from "@/services/health/healthServiceFactory";
// const steps = await healthService.getSteps();
//
// Each concrete class should wrap its native SDK
// (e.g. react-native-health-connect on Android or react-native-health-kit on iOS)
// and take care of init / permission flow internally.

import {RecordType, ReadRecordsResult, AggregateResultRecordType} from 'react-native-health-connect';

/** Minimal DTO for sleep sessions used in UI & persistence layer */
export interface SleepSession {
  start: string; // ISO 8601
  end: string; // ISO 8601
  durationHours: number;
}

/**
 * Common health‑metric API for all platforms.
 * Methods that a platform cannot support **must** return `null` (for single value)
 * or an empty collection, never throw. This guarantees callers write single‑path code
 * without platform `if` branches.
 */
export abstract class HealthService {
  /* ─────────────────────────── Generic helpers ─────────────────────────── */
  /** Initialises underlying SDK / client. Re‑entrant safe. */
  abstract init(): Promise<boolean>;

  /**
   * Requests read permissions for the given record types. Should be silent if already granted.
   * Returns `true` if every requested permission is granted, otherwise `false`.
   */
  abstract requestReadPermission(recordTypes: RecordType[]): Promise<boolean>;

  /** Reads raw records for the given type & range (platform specific mapping inside). */
  abstract readSampleData<T extends RecordType>(
    recordType: T,
    startTime?: Date,
    endTime?: Date,
  ): Promise<ReadRecordsResult<T> | undefined>;

  /** Aggregated helper – platforms without aggregation support may fallback to manual reduce. */
  abstract aggregatedSampleData<T extends AggregateResultRecordType>(
    recordType: T,
    startTime?: Date,
    endTime?: Date,
  ): Promise<Record<string, unknown> | undefined>;

  /* ─────────────────────────── Simple metrics ─────────────────────────── */
  abstract getHeartRate(): Promise<number>; // bpm of latest measurement
  abstract getSteps(): Promise<number>; // steps in range (default: today)
  abstract getAggregatedSteps(): Promise<number>; // steps via aggregate API
  abstract getActiveCaloriesBurned(): Promise<number>; // kcal in range
  abstract getAggregatedActiveCaloriesBurned(): Promise<number>; // kcal via aggregate API
  abstract getTotalCaloriesBurned(): Promise<number>; // BMR + active kcal

  /* ─────────────────────────── Sleep ─────────────────────────── */
  abstract getTotalSleepHours(): Promise<number>; // hours slept in range (default: today)
  abstract getLastSleepSession(): Promise<SleepSession | null>;
  abstract getAllSleepSessions(): Promise<SleepSession[]>;
}
