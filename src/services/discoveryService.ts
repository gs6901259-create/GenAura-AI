import { IDiscoveryService, CreatorProfile, Shortlist } from '../contracts/discoveryContract';
import { storageService } from './storageService';

class DiscoveryService implements IDiscoveryService {
  public async getShortlists(): Promise<Shortlist[]> {
    return storageService.getShortlists();
  }

  public async getShortlistById(id: string): Promise<Shortlist | null> {
    return storageService.getShortlistById(id) || null;
  }

  public async getCreators(creatorIds?: string[]): Promise<CreatorProfile[]> {
    const all = storageService.getCreators();
    if (!creatorIds || creatorIds.length === 0) return all;
    return all.filter((c) => creatorIds.includes(c.id));
  }

  public async getCreatorById(id: string): Promise<CreatorProfile | null> {
    return storageService.getCreatorById(id) || null;
  }
}

export const discoveryService = new DiscoveryService();
