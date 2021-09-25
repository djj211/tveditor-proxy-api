import { ReadConsistency } from '@aws/dynamodb-data-mapper';

import { configHashKey, showMappingModel } from '../Label';
import { ShowMappingModel } from '../orm/ShowMappingModel';
import { BaseRepository } from './BaseRepository';

/**
 * ShowMapping Repository
 */
export class ShowMappingRepository extends BaseRepository {
  constructor() {
    super(ShowMappingRepository.name);
  }

  static getHashId(): string {
    return `${configHashKey}.${showMappingModel}`;
  }

  async get(flexgetId: number, readConsistency?: ReadConsistency): Promise<ShowMappingModel | undefined> {
    try {
      const showMapping = new ShowMappingModel();
      showMapping.hashId = ShowMappingRepository.getHashId();
      showMapping.sortId = `${flexgetId}`;
      showMapping.flexgetId = flexgetId;
      return await this.mapper.get(showMapping, { readConsistency });
    } catch (e) {
      return;
    }
  }

  async post(flexgetId: number, tvdbId: string, name: string) {
    const showMapping = new ShowMappingModel();
    showMapping.flexgetId = flexgetId;
    showMapping.hashId = ShowMappingRepository.getHashId();
    showMapping.sortId = `${flexgetId}`;
    showMapping.tvdbId = tvdbId;
    showMapping.name = name;
    return this.put(showMapping);
  }
}
