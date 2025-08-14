// // src/services/health/AppleHealthService.ts
// // Concrete implementation of HealthService for iOS (Apple HealthKit)
// // Requires: "react-native-health" (or @kingstinct/react-native-health) linked & configured.
// // NOTE: HealthKit API isimleri Android Health Connect'ten farklıdır. İstatistikler HKStatisticsQuery
// // veya HKStatisticsCollectionQuery ile hesaplanır.

// import AppleHealthKit, {
//   HealthKitPermissions,
//   HealthValue,
//   HKQuantityType,
//   HKCategoryType,
// } from '@kingstinct/react-native-healthkit';

// import {HealthService, SleepSession} from './HealthService';

// /* Helper: bugün 00:00 & 23:59 */
// const todayStart = () => new Date(new Date().setHours(0, 0, 0, 0));
// const todayEnd = () => new Date(new Date().setHours(23, 59, 59, 999));

// export class HealthKitService extends HealthService {
//   private _initialised = false;

//   /* ──────────────── Generic helpers ─────────────── */
//   async init(): Promise<boolean> {
//     if (this._initialised) return true;

//     return new Promise(resolve => {
//       const perms: HealthKitPermissions = {
//         permissions: {
//           read: [
//             HKQuantityType.StepCount,
//             HKQuantityType.HeartRate,
//             HKQuantityType.ActiveEnergyBurned,
//             HKQuantityType.DietaryEnergyConsumed,
//             HKQuantityType.BasalEnergyBurned,
//             HKCategoryType.SleepAnalysis,
//           ],
//           write: [],
//         },
//       };

//       AppleHealthKit.initHealthKit(perms, (error: string) => {
//         if (error) {
//           console.warn('[HK] Init error', error);
//           resolve(false);
//         } else {
//           this._initialised = true;
//           resolve(true);
//         }
//       });
//     });
//   }

//   async requestReadPermission(): Promise<boolean> {
//     // HealthKit izinleri init sırasında verilir; ek runtime prompt yoktur.
//     return this.init();
//   }

//   // HealthKit tarafında ham kayıt okuma – adım, kalori vs.
//   // Tip güvenliği basit tutuldu; ileri kullanımda dilediğin generic eklenebilir
//   async readSampleData<T extends string>(
//     quantityType: T,
//     startTime: Date = todayStart(),
//     endTime: Date = todayEnd(),
//   ): Promise<HealthValue[] | undefined> {
//     if (!(await this.requestReadPermission())) return;

//     return new Promise(resolve => {
//       AppleHealthKit.getSamples(
//         {
//           startDate: startTime.toISOString(),
//           endDate: endTime.toISOString(),
//           type: quantityType,
//         },
//         (_err: string, results: HealthValue[]) => {
//           resolve(results);
//         },
//       );
//     });
//   }

//   async aggregatedSampleData<T extends AggregateRecordType>(
//     _recordType: T, // HK aggregation custom yapılır; şu an kullanılmıyor
//     _startTime?: Date,
//     _endTime?: Date,
//   ): Promise<Record<string, unknown> | undefined> {
//     // Basit örnek: HKStatisticsQuery kullanılarak aggregate alınabilir.
//     // Bu demo implementasyonunda support olmadığını göstermek için undefined dönüyoruz.
//     return undefined;
//   }

//   /* ──────────────── Simple metrics ─────────────── */
//   async getHeartRate(): Promise<number> {
//     const samples = await this.readSampleData(HKQuantityType.HeartRate);
//     if (!samples?.length) return 0;
//     // samples zaten kronolojik gelir → sonuncu en yeni
//     return samples[samples.length - 1].value;
//   }

//   async getSteps(): Promise<number> {
//     const samples = await this.readSampleData(HKQuantityType.StepCount);
//     return samples?.reduce((sum, s) => sum + (s.value as number), 0) ?? 0;
//   }

//   async getAggregatedSteps(): Promise<number> {
//     // HealthKit’te günlük toplamı HKStatisticsQuery ile almak gerekir
//     // Demo amaçlı: getSteps() çağırıyoruz
//     return this.getSteps();
//   }

//   async getActiveCaloriesBurned(): Promise<number> {
//     const samples = await this.readSampleData(
//       HKQuantityType.ActiveEnergyBurned,
//     );
//     return samples?.reduce((sum, s) => sum + (s.value as number), 0) ?? 0;
//   }

//   async getAggregatedActiveCaloriesBurned(): Promise<number> {
//     return this.getActiveCaloriesBurned(); // Basit yaklaşım
//   }

//   async getTotalCaloriesBurned(): Promise<number> {
//     const active = await this.getActiveCaloriesBurned();
//     const basalSamples = await this.readSampleData(
//       HKQuantityType.BasalEnergyBurned,
//     );
//     const basal =
//       basalSamples?.reduce((sum, s) => sum + (s.value as number), 0) ?? 0;
//     return active + basal;
//   }

//   /* ──────────────── Sleep ─────────────── */
//   async getTotalsleepMinutes(): Promise<number> {
//     const samples = await this.readSampleData(HKCategoryType.SleepAnalysis);
//     if (!samples?.length) return 0;

//     const totalMs = samples.reduce(
//       (sum, s) => sum + (s.endDate! - s.startDate!),
//       0,
//     );
//     return parseFloat((totalMs / 3.6e6).toFixed(2));
//   }

//   async getLastSleepSession(): Promise<SleepSession | null> {
//     const samples = await this.readSampleData(HKCategoryType.SleepAnalysis);
//     if (!samples?.length) return null;

//     const last = samples[samples.length - 1];
//     const durationHours = (last.endDate! - last.startDate!) / 3.6e6;

//     return {
//       start: new Date(last.startDate!).toISOString(),
//       end: new Date(last.endDate!).toISOString(),
//       durationHours: parseFloat(durationHours.toFixed(2)),
//     };
//   }

//   async getAllSleepSessions(): Promise<SleepSession[]> {
//     const samples = await this.readSampleData(HKCategoryType.SleepAnalysis);
//     if (!samples?.length) return [];

//     return samples.map(s => {
//       const durationHours = (s.endDate! - s.startDate!) / 3.6e6;
//       return {
//         start: new Date(s.startDate!).toISOString(),
//         end: new Date(s.endDate!).toISOString(),
//         durationHours: parseFloat(durationHours.toFixed(2)),
//       } as SleepSession;
//     });
//   }
// }
