import { Group, Match, Player, Team } from "./types";

export const groups: Group[] = [
  { id: "A", name: "Group A" },
  { id: "B", name: "Group B" },
  { id: "C", name: "Group C" },
  { id: "D", name: "Group D" },
];

// Season 2 starts empty — teams appear when captains register.
export const players: Player[] = [];
export const teams: Team[] = [];

// Match schedule lives in the store; nothing exists until registration
// fills the groups and bracket slots.
export const initialMatches: Match[] = [];
