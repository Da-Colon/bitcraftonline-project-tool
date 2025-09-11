export type Player = {
  entityId: string;
  username: string;
  signedIn: boolean;
  timePlayed: number;
  timeSignedIn: number;
  createdAt: string;
  updatedAt: string;
  lastLoginTimestamp: string;
};

export type PlayerSearchResponse = {
  players: Player[];
};

