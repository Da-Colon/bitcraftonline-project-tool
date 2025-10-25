import skillDesc from "../../GameData/BitCraft_GameData/server/region/skill_desc.json";

export type SkillDef = {
  id: number;
  name: string;
  title: string;
  icon_asset_name?: string;
  max_level?: number;
};

const SKILL_MAP: Map<number, SkillDef> = new Map(
  (skillDesc as unknown[]).map((s) => {
    const skill = s as { id: number; name: string; title: string; icon_asset_name?: string; max_level?: number }
    return [skill.id, {
      id: skill.id,
      name: skill.name,
      title: skill.title,
      icon_asset_name: skill.icon_asset_name,
      max_level: skill.max_level,
    }]
  })
);

export function getSkillDef(id: number): SkillDef | undefined {
  return SKILL_MAP.get(id);
}
