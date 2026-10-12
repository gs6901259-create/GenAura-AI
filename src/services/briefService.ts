import { IBriefService, CampaignBrief } from '../contracts/briefContract';
import { storageService } from './storageService';

class BriefService implements IBriefService {
  public async getBriefs(): Promise<CampaignBrief[]> {
    return storageService.getBriefs();
  }

  public async getBriefById(id: string): Promise<CampaignBrief | null> {
    return storageService.getBriefById(id) || null;
  }
}

export const briefService = new BriefService();
