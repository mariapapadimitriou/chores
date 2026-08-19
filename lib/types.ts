export type Roommate = {
  id: string;
  name: string;
  color: string;
  emoji: string;
};

export type Cadence = "once" | "daily" | "weekly" | "monthly";

export type Chore = {
  id: string;
  title: string;
  notes?: string;
  assigneeId?: string | null;
  cadence: Cadence;
  createdAt: number;
  archived?: boolean;
};

export type Completion = {
  id: string;
  choreId: string;
  choreTitle: string;
  byId: string;
  at: number;
  note?: string;
};

export type State = {
  roommates: Roommate[];
  chores: Chore[];
  history: Completion[];
  updatedAt: number;
};

export const initialState = (): State => ({
  roommates: [
    { id: "r1", name: "Maria", color: "#D96E7F", emoji: "🌸" },
    { id: "r2", name: "Sis", color: "#5B8CBE", emoji: "🌊" },
  ],
  chores: [
    { id: "c1", title: "Take out the trash", cadence: "weekly", createdAt: Date.now() },
    { id: "c2", title: "Wipe the kitchen counters", cadence: "daily", createdAt: Date.now() },
    { id: "c3", title: "Vacuum the living room", cadence: "weekly", createdAt: Date.now() },
    { id: "c4", title: "Clean the bathroom", cadence: "weekly", createdAt: Date.now() },
    { id: "c5", title: "Water the plants", cadence: "weekly", createdAt: Date.now() },
  ],
  history: [],
  updatedAt: Date.now(),
});
