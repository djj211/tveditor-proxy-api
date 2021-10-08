import { Torrent } from 'torrent-search-api';

export interface Episode {
  season: number;
  number: number;
}

export interface FlexgetLastSeen extends Episode {
  first_seen?: string;
}

export interface TVDBepisode extends Episode {
  airDate?: string;
}

interface BaseFlexgetItem {
  id: number;
  name: string;
}

export interface FlexgetShow extends BaseFlexgetItem {
  begin_episode?: Episode;
  latest_entity?: FlexgetLastSeen;
}

interface TVDBBaseItem {
  id: string;
  name: string;
  image_url: string;
  overview?: string;
}

export interface TVDBShowItem extends TVDBBaseItem {
  aliases: string[];
  network?: string;
  status: string;
  latestEpisode?: TVDBepisode;
  nextEpisode?: TVDBepisode;
}

export interface FlexgetMovie extends BaseFlexgetItem {
  added_on: string;
  list_id: number;
  year: number;
  movies_list_ids: number[];
}

export interface TVDBMovieItem extends TVDBBaseItem {
  releaseDate: string;
}

export interface Movie {
  flexget: FlexgetMovie;
  tvdb: TVDBMovieItem;
}

export interface Show {
  flexget: FlexgetShow;
  tvdb: TVDBShowItem;
}

export interface FlexgetTask {
  config: {
    content_filter: {
      reject: string[];
      require_mainfile: boolean;
      strict: boolean;
    };
    deluge: {
      label: string;
      main_file_only: boolean;
    };
    discover: {
      from: [
        {
          rarbg: {
            category: number[];
            limit: number;
            min_leechers: number;
            min_seeders: number;
            ranked: boolean;
            sorted_by: string;
            use_tvdb: boolean;
          };
        },
        {
          '1337x': boolean;
        },
        {
          limetorrents: {
            category: string;
            order_by: string;
          };
        },
      ];
      interval: string;
      release_estimations: string;
      what: [
        {
          next_series_episodes: {
            backfill: boolean;
            from_start: boolean;
            only_same_season: boolean;
          };
        },
      ];
    };
    no_entries_ok: boolean;
    series: {
      default: string[];
      settings: {
        default: {
          propers: boolean;
          set: {
            content_filename: string;
            move_completed_path: string;
          };
          target: string;
          timeframe: string;
          upgrade: boolean;
        };
      };
    };
    template: string;
  };
  name: string;
}

export interface CreateFlexget {
  begin_episode: string;
  name: string;
  alternate_names?: string[];
}

export enum DELUGE_DOWNLOAD_TYPE {
  MOVIE = 'movie',
  SHOW = 'show',
}

export interface DownloadOptions {
  appendPath?: string;
}

interface BaseDelugeDownload {
  downloadType?: DELUGE_DOWNLOAD_TYPE;
  options?: DownloadOptions;
}

export interface DelugeDownload extends BaseDelugeDownload {
  magnetUrl: string;
}

export enum TORRENT_SEARCH_TYPE {
  MOVIES = 'Movies',
  SHOWS = 'TV',
  ALL = 'ALL',
}

export interface TorrentSearch {
  query: string;
  limit: number;
  type?: TORRENT_SEARCH_TYPE;
}

export interface TorrentSearchDownload extends BaseDelugeDownload {
  torrent: Torrent;
}
