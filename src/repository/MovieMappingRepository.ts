import { ReadConsistency } from '@nova-odm/mapper';

import { configHashKey, movieMappingModel } from '../Label';
import { MovieMappingModel } from '../orm/MovieMappingModel';
import { BaseRepository } from './BaseRepository';

/**
 * MovieMapping Repository
 */
export class MovieMappingRepository extends BaseRepository {
  constructor() {
    super(MovieMappingRepository.name);
  }

  static getHashId(): string {
    return `${configHashKey}.${movieMappingModel}`;
  }

  async get(flexgetId: number, readConsistency?: ReadConsistency): Promise<MovieMappingModel | undefined> {
    try {
      const showMapping = new MovieMappingModel();
      showMapping.hashId = MovieMappingRepository.getHashId();
      showMapping.sortId = `${flexgetId}`;
      showMapping.flexgetId = flexgetId;
      return await this.mapper.get(showMapping, { readConsistency });
    } catch (e) {
      return;
    }
  }

  async post(flexgetId: number, tvdbId: string, name: string) {
    const showMapping = new MovieMappingModel();
    showMapping.flexgetId = flexgetId;
    showMapping.hashId = MovieMappingRepository.getHashId();
    showMapping.sortId = `${flexgetId}`;
    showMapping.tvdbId = tvdbId;
    showMapping.name = name;
    return this.put(showMapping);
  }
}
