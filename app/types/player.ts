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

export type PlayerExperience = {
  quantity: number; // xp
  skill_id: number;
};

export type PlayerLocation = {
  entityId: string;
  name: string;
  regionId: number;
  locationX: number;
  locationZ: number;
};

export type PlayerSkillMapEntry = {
  id: number;
  name: string;
  title: string;
  skillCategoryStr: string;
};

export type PlayerDetail = {
  player: Player & {
    teleportLocationX?: number;
    teleportLocationZ?: number;
    teleportLocationDimension?: number;
    teleportLocationType?: string;
    sessionStartTimestamp?: string;
    signInTimestamp?: string;
    experience?: PlayerExperience[];
    regionId?: number;
    location?: PlayerLocation | null;
    skillMap?: Record<string, PlayerSkillMapEntry>;
  };
};
