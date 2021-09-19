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

export interface FlexgetShow {
  id: number;
  name: string;
  begin_episode?: Episode;
  latest_entity?: FlexgetLastSeen;
}

export interface TVDBItem {
  aliases: string[];
  id: string;
  name: string;
  network?: string;
  image_url: string;
  status: string;
  overview?: string;
  latestEpisode?: TVDBepisode;
  nextEpisode?: TVDBepisode;
}

export interface Show {
  flexget: FlexgetShow;
  tvdb: TVDBItem;
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
