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

export type MatchStatus = "scheduled" | "pending_review" | "approved" | "declined" | "ff" | "checked_in";

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
  /** Knockout only: epoch ms the match is scheduled to start (check-in opens here). */
  scheduledAt?: number;
  /** Knockout only: which team already checked in. */
  checkedIn?: string | null;
  /** Knockout only: team that won by forfeit (no-show. */
  ffWinner?: string | null;
  /** Knockout only: epoch ms the FF deadline (scheduledAt +  15 min). */
  ffDeadline?: number;
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
  photo?: string; // data URL del marcador final (todos los jugadores visibles
  createdAt: number;
};

export type Standing = {
  teamId: string;
  w: number;
  l: number;
  pts: number;
};
