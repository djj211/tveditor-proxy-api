import * as TorrentSearchApi from 'torrent-search-api';

import { TORRENT_SEARCH_TYPE } from '../interfaces';

export class TorrentSearchService {
  private searchProvider: string | undefined;

  constructor(provider?: string) {
    this.searchProvider = provider;
  }

  public setProvider(provider: string) {
    this.searchProvider = provider;
  }

  private setupProviders(category: string) {
    TorrentSearchApi.disableAllProviders();

    if (this.searchProvider) {
      TorrentSearchApi.enableProvider(this.searchProvider);
      return;
    }

    TorrentSearchApi.enablePublicProviders();

    TorrentSearchApi.disableProvider('Eztv');
    TorrentSearchApi.disableProvider('TorrentProject');

    if (category === TORRENT_SEARCH_TYPE.ALL) {
      return;
    }

    const activeProviders = TorrentSearchApi.getActiveProviders();
    activeProviders.forEach((provider) => {
      const categories = provider.categories as Array<string>;
      const hasCateogry = categories.some((c) => c === category);
      if (!hasCateogry) {
        TorrentSearchApi.disableProvider(provider.name);
      }
    });
  }

  // private setupSingleProvider(provider: string) {
  //   TorrentSearchApi.disableAllProviders();

  //   TorrentSearchApi.enableProvider(provider);
  // }

  private async doSearch(query: string, category: string, limit: number) {
    try {
      this.setupProviders(category);

      const torrents = await TorrentSearchApi.search(query, category, limit);

      console.log('RESULTS => ', torrents);

      return torrents.reduce((acc, torrent) => {
        let containsSearchString = torrent.title.toLowerCase().includes(query.toLowerCase());

        if (!containsSearchString && torrent.desc) {
          containsSearchString = torrent.desc.toLowerCase().includes(query.toLowerCase());
        }

        // Don't return torrents that do not contain serach string. Wastes my time.
        if (!containsSearchString) {
          return acc;
        }

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
    } catch (ex) {
      console.log('Error Performing Search => ', ex);
      return Promise.resolve([] as Array<TorrentSearchApi.Torrent>);
    }
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

  public async searchShows(query: string, limit: number) {
    const torrents = await this.doSearch(query, 'TV', limit);
    /*
    this.setupSingleProvider('Eztv');
    const ezTVTorrents = await this.doSearch(query, 'All', 100);

    const combinedResults = [...torrents, ...ezTVTorrents];
    */
    return torrents.sort((torrentA: any, torrentB: any) => (torrentA.seeds > torrentB.seeds ? -1 : 1));
  }

  public searchMovies(query: string, limit: number) {
    console.log('DOING MOVIES SEARCH');
    return this.doSearch(query, 'Movies', limit);
  }

  public getTorrentMagnet(torrent: TorrentSearchApi.Torrent) {
    return TorrentSearchApi.getMagnet(torrent);
  }
}
