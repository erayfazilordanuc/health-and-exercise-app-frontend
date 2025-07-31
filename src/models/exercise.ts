// import { User } from "./user";

// export type ExerciseVideoDTO = {
//   id?: number;
//   name?: string;
//   videoUrl: string;
//   exerciseId: number;
//   createdAt: Date;
// };

// export type CreateExerciseVideoDTO = {
//   name: string;
//   videoUrl: string | null;
//   exerciseId: number | null;
// };

// export type NewVideoDTO = {
//   name: string;
//   videoUrl: string | null;
// };

// export type Exercise = {
//   id?: number;
//   name: string;
//   description: string;
//   point: number;
//   videos: ExerciseVideoDTO[];
//   admin: User;
//   createdAt: Date | null;
//   updatedAt: Date | null;
// };

// export type ExerciseDTO = {
//   id: number | null;
//   name: string | null;
//   description: string | null;
//   point: number | null;
//   videos: ExerciseVideoDTO[];
//   adminId: number | null;
//   createdAt: Date | null;
//   updatedAt: Date | null;
// };

// export type CreateExerciseDTO = {
//   name: string;
//   description: string;
//   point: number;
// };

// export type UpdateExerciseDTO = {
//   name: string;
//   description: string;
//   point: number;
// };

// export type ExerciseProgressDTO = {
//   id: number;
//   userId: number;
//   exerciseDTO: ExerciseDTO;
//   progressRatio: number;
//   createdAt: Date;
//   updatedA?: Date | null;
// };

// export type AchievementDTO = {
//   id: number;
//   userId: number;
//   exerciseDTO: ExerciseDTO;
//   createdAt: Date;
// };
