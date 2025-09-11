import skillDesc from "../../GameData/BitCraft_GameData/server/region/skill_desc.json";

export type SkillDef = {
  id: number;
  name: string;
  title: string;
  icon_asset_name?: string;
  max_level?: number;
};

const SKILL_MAP: Map<number, SkillDef> = new Map(
  (skillDesc as any[]).map((s) => [s.id as number, {
    id: s.id,
    name: s.name,
    title: s.title,
    icon_asset_name: s.icon_asset_name,
    max_level: s.max_level,
  }])
);

export function getSkillDef(id: number): SkillDef | undefined {
  return SKILL_MAP.get(id);
}
