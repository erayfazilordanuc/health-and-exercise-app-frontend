// src/services/health/AndroidHealthService.ts
// Concrete implementation of HealthService for Android, built on top of
// react-native‑health‑connect helper functions.

import {
  initialize,
  requestPermission,
  readRecords,
  aggregateRecord,
  RecordType,
  ReadRecordsResult,
  AggregateResultRecordType,
} from 'react-native-health-connect';

import {HealthService, SleepSession} from './healthService';

/** Default date helpers */
const todayStart = () => new Date(new Date().setHours(0, 0, 0, 0));
const todayEnd = () => new Date(new Date().setHours(23, 59, 59, 999));

export class HealthConnectService extends HealthService {
  /* ───────────────────────── Generic helpers ───────────────────────── */
  private isInitialized = false;

  async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    this.isInitialized = await initialize();
    console.log('[HC] init →', this.isInitialized);
    return this.isInitialized;
  }

  async requestReadPermission(recordTypes: RecordType[]): Promise<boolean> {
    if (!(await this.init())) return false;
    const granted = await requestPermission(
      recordTypes.map(rt => ({accessType: 'read', recordType: rt})),
    );
    console.log('[HC] granted →', granted);
    return granted.length === recordTypes.length;
  }

  async readSampleData<T extends RecordType>(
    recordType: T,
    startTime: Date = todayStart(),
    endTime: Date = todayEnd(),
  ): Promise<ReadRecordsResult<T> | undefined> {
    if (!(await this.requestReadPermission([recordType]))) return;

    return readRecords(recordType, {
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
  }

  async aggregatedSampleData<T extends AggregateResultRecordType>(
    recordType: T,
    startTime: Date = todayStart(),
    endTime: Date = todayEnd(),
  ): Promise<Record<string, unknown> | undefined> {
    if (!(await this.requestReadPermission([recordType]))) return;

    return aggregateRecord({
      recordType,
      timeRangeFilter: {
        operator: 'between',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    });
  }

  /* ───────────────────────── Simple metrics ───────────────────────── */
  async getHeartRate(): Promise<number> {
    const res: any = await this.readSampleData('HeartRate');
    if (!res?.records?.length) return 0;
    const latest = res.records.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )[0];
    return latest.value;
  }

  async getSteps(): Promise<number> {
    const res: any = await this.readSampleData('Steps');
    if (!res?.records) return 0;
    return res.records.reduce((sum: number, r: any) => sum + (r.count ?? 0), 0);
  }

  async getAggregatedSteps(): Promise<number> {
    const result: any = await this.aggregatedSampleData('Steps');
    return result?.COUNT_TOTAL ?? 0;
  }

  async getActiveCaloriesBurned(): Promise<number> {
    const res: any = await this.readSampleData('ActiveCaloriesBurned');
    if (!res?.records) return 0;
    const kcal = res.records.reduce(
      (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
      0,
    );
    return Math.floor(kcal);
  }

  async getAggregatedActiveCaloriesBurned(): Promise<number> {
    const result: any = await this.aggregatedSampleData('ActiveCaloriesBurned');
    return result?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0;
  }

  async getTotalCaloriesBurned(): Promise<number> {
    const res: any = await this.readSampleData('TotalCaloriesBurned');
    if (!res?.records) return 0;
    return res.records.reduce(
      (sum: number, r: any) => sum + (r.energy?.inKilocalories ?? 0),
      0,
    );
  }

  /* ─────────────────────────── Sleep ─────────────────────────── */
  async getTotalsleepMinutes(): Promise<number> {
    const res: any = await this.readSampleData('SleepSession');
    if (!res?.records?.length) return 0;

    const totalMs = res.records.reduce((sum: number, r: any) => {
      if (!r.startDate || !r.endDate) return sum;
      return (
        sum + (new Date(r.endDate).getTime() - new Date(r.startDate).getTime())
      );
    }, 0);

    return parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
  }

  async getLastSleepSession(): Promise<SleepSession | null> {
    const res: any = await this.readSampleData('SleepSession');
    if (!res?.records?.length) return null;

    const last = res.records.sort(
      (a: any, b: any) =>
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
    )[0];

    const durationHours =
      (new Date(last.endDate).getTime() - new Date(last.startDate).getTime()) /
      (1000 * 60 * 60);

    return {
      start: last.startDate,
      end: last.endDate,
      durationHours: parseFloat(durationHours.toFixed(2)),
    };
  }

  async getAllSleepSessions(): Promise<SleepSession[]> {
    const res: any = await this.readSampleData('SleepSession');
    if (!res?.records?.length) return [];

    return res.records
      .sort(
        (a: any, b: any) =>
          new Date(b.endDate).getTime() - new Date(a.endDate).getTime(),
      )
      .map((s: any) => {
        const durationHours =
          (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) /
          (1000 * 60 * 60);
        return {
          start: s.startDate,
          end: s.endDate,
          durationHours: parseFloat(durationHours.toFixed(2)),
        } as SleepSession;
      });
  }
}
