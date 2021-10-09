import * as TorrentSearchApi from 'torrent-search-api';

import { TORRENT_SEARCH_TYPE } from '../interfaces';

export class TorrentSearchService {
  constructor() {
    TorrentSearchApi.enablePublicProviders();
  }

  private async doSearch(query: string, category: string, limit: number) {
    const torrents = await TorrentSearchApi.search(query, category, limit);

    return torrents.reduce((acc, torrent) => {
      const found = acc.find(
        (a) =>
          a.desc === torrent.desc &&
          a.magnet === torrent.magnet &&
          a.size === torrent.size &&
          a.title === torrent.title,
      );

      if (!found) {
        acc.push(torrent);
      }

      return acc;
    }, [] as Array<TorrentSearchApi.Torrent>);
  }

  public search(query: string, limit: number, type?: TORRENT_SEARCH_TYPE) {
    switch (type) {
      case TORRENT_SEARCH_TYPE.MOVIES:
        return this.searchMovies(query, limit);
      case TORRENT_SEARCH_TYPE.SHOWS:
        return this.searchShows(query, limit);
      case TORRENT_SEARCH_TYPE.ALL:
      default:
        return this.searchAll(query, limit);
    }
  }

  public searchAll(query: string, limit: number) {
    console.log('DOING ALL SEARCH');
    return this.doSearch(query, 'All', limit);
  }

  public searchShows(query: string, limit: number) {
    console.log('DOING TV SEARCH');
    return this.doSearch(query, 'TV', limit);
  }

  public searchMovies(query: string, limit: number) {
    console.log('DOING MOVIES SEARCH');
    return this.doSearch(query, 'Movies', limit);
  }

  public getTorrentMagnet(torrent: TorrentSearchApi.Torrent) {
    return TorrentSearchApi.getMagnet(torrent);
  }
}
