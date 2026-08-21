export type Player = {
  id: string;
  handle: string;
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  captainId: string;
  groupId: string;
};

export type Group = { id: string; name: string };

export type StatLine = {
  playerId: string;
  teamId: string;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
};

export type MatchStatus = "scheduled" | "pending_review" | "approved" | "declined";

export type Stage = "group" | "qf" | "sf" | "f";

export type Match = {
  id: string;
  stage: Stage;
  groupId?: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  stats: StatLine[];
};

export type SubmissionStatus = "pending" | "approved" | "declined";

export type Submission = {
  id: string;
  matchId: string;
  submittedBy: string;
  homeScore: number;
  awayScore: number;
  stats: StatLine[];
  status: SubmissionStatus;
  note?: string;
  createdAt: number;
};

export type Standing = {
  teamId: string;
  w: number;
  l: number;
  pts: number;
};
