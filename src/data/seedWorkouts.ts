import type { MuscleGroup } from '../types/database';

interface SeedExercise {
  name: string;
  muscle_group: MuscleGroup;
  machine_info?: string;
  target_sets_reps?: string;
}

interface SeedRoutine {
  name: string;
  exercises: SeedExercise[];
}

export const seedRoutines: SeedRoutine[] = [
  {
    name: 'Oberkörper Drücken',
    exercises: [
      {
        name: 'Bankdrücken',
        muscle_group: 'chest',
        machine_info: 'Flachbank mit Langhantel',
        target_sets_reps: '4x8-10',
      },
      {
        name: 'Schrägbankdrücken',
        muscle_group: 'chest',
        machine_info: 'Schrägbank 30°, Kurzhanteln',
        target_sets_reps: '3x10-12',
      },
      {
        name: 'Schulterdrücken',
        muscle_group: 'shoulders',
        machine_info: 'Sitzend, Kurzhanteln',
        target_sets_reps: '4x8-10',
      },
      {
        name: 'Seitheben',
        muscle_group: 'shoulders',
        target_sets_reps: '3x12-15',
      },
      {
        name: 'Trizepsdrücken am Kabel',
        muscle_group: 'triceps',
        machine_info: 'Kabelzug, Seil-Griff',
        target_sets_reps: '3x12-15',
      },
    ],
  },
  {
    name: 'Oberkörper Ziehen',
    exercises: [
      {
        name: 'Klimmzüge',
        muscle_group: 'back',
        target_sets_reps: '4x6-10',
      },
      {
        name: 'Langhantelrudern',
        muscle_group: 'back',
        machine_info: 'Langhantel, vorgebeugt',
        target_sets_reps: '4x8-10',
      },
      {
        name: 'Latzug eng',
        muscle_group: 'back',
        machine_info: 'Latzugmaschine, enger Griff',
        target_sets_reps: '3x10-12',
      },
      {
        name: 'Face Pulls',
        muscle_group: 'shoulders',
        machine_info: 'Kabelzug, Seil-Griff',
        target_sets_reps: '3x15-20',
      },
      {
        name: 'Bizepscurls',
        muscle_group: 'biceps',
        machine_info: 'Kurzhanteln',
        target_sets_reps: '3x10-12',
      },
    ],
  },
  {
    name: 'Beine und Gesäß',
    exercises: [
      {
        name: 'Kniebeugen',
        muscle_group: 'legs',
        machine_info: 'Langhantel, Squat-Rack',
        target_sets_reps: '4x6-8',
      },
      {
        name: 'Rumänisches Kreuzheben',
        muscle_group: 'glutes',
        machine_info: 'Langhantel',
        target_sets_reps: '4x8-10',
      },
      {
        name: 'Beinpresse',
        muscle_group: 'legs',
        machine_info: 'Beinpresse 45°',
        target_sets_reps: '3x10-12',
      },
      {
        name: 'Beinbeuger',
        muscle_group: 'legs',
        machine_info: 'Beinbeuger-Maschine',
        target_sets_reps: '3x10-12',
      },
      {
        name: 'Wadenheben',
        muscle_group: 'calves',
        machine_info: 'Stehend, Maschine',
        target_sets_reps: '4x12-15',
      },
    ],
  },
  {
    name: 'Ganzkörper Kraft',
    exercises: [
      {
        name: 'Kreuzheben',
        muscle_group: 'full_body',
        machine_info: 'Langhantel',
        target_sets_reps: '4x5',
      },
      {
        name: 'Überkopfdrücken',
        muscle_group: 'shoulders',
        machine_info: 'Langhantel, stehend',
        target_sets_reps: '4x6-8',
      },
      {
        name: 'Ausfallschritte',
        muscle_group: 'legs',
        machine_info: 'Kurzhanteln',
        target_sets_reps: '3x10 pro Seite',
      },
      {
        name: 'Liegestütze',
        muscle_group: 'chest',
        target_sets_reps: '3x15-20',
      },
      {
        name: 'Plank',
        muscle_group: 'abs',
        target_sets_reps: '3x45-60s',
      },
    ],
  },
];
