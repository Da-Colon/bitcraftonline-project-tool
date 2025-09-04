import { z } from "zod";
import { getEnv } from "~/utils/env.server";

const { BITJITA_BASE_URL: BITJITA_BASE } = getEnv();

export const PlayerSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type Player = z.infer<typeof PlayerSchema>;

export const bitjitaClient = {
  async searchPlayers(query: string): Promise<Player[]> {
    // TODO: Implement proxy
    console.log(`Searching players: ${query}`);
    return [];
  },
  
  async getPlayerInventory(playerId: string) {
    // TODO: Implement
    console.log(`Getting inventory for player: ${playerId}`);
    return null;
  },
  
  async getClaimInventory(claimId: string) {
    // TODO: Implement  
    console.log(`Getting inventory for claim: ${claimId}`);
    return null;
  },
};
