import axios, { AxiosRequestConfig } from 'axios';
import jwt_decode from 'jwt-decode';

import { TVDBItem } from '../interfaces';

interface DecodedToken {
  exp: number;
}

interface TVDBResp {
  data: [
    {
      aliases: string[];
      id: string;
      objectID: string;
      name: string;
      network: string;
      image_url: string;
      status: string;
      primary_language: string;
      overview: string;
      tvdb_id: number;
      name_translated?: {
        eng?: string;
      };
      overview_translated?: {
        eng?: string;
      };
    },
  ];
}

interface TVDBEpisode {
  aired: string;
  number: number;
  seasonNumber: number;
}

interface EpisodeResp {
  data: {
    episodes: TVDBEpisode[];
  };
}

export class TVDBService {
  private TVDB_PIN = process.env.TVDB_PIN!;
  private TVDB_API_KEY = process.env.TVDB_API_KEY!;
  private BASE_URL = process.env.TVDB_API_URL!;
  private token: string;

  constructor() {}

  private login = async () => {
    if (this.token) {
      const decoded: DecodedToken = jwt_decode(this.token);
      const currTime = new Date().getTime();

      if (decoded.exp * 1000 > currTime) {
        return this.token;
      }
    }

    const { data: resp } = await axios.post<{ data: { token: string } }>(`${this.BASE_URL}/login`, {
      apikey: this.TVDB_API_KEY,
      pin: this.TVDB_PIN,
    });

    this.token = resp.data.token;
    return resp.data.token;
  };

  private getConfig = async (): Promise<AxiosRequestConfig> => {
    const token = await this.login();
    return {
      headers: { Authorization: `Bearer ${token}` },
    };
  };

  public getSeries = async (id: string): Promise<TVDBItem> => {
    return this.searchOne(id);
  };

  public searchOne = async (show: string): Promise<TVDBItem> => {
    const resp = await this.search(show, 5);
    const foundShow = resp.find((t) => t.name === show);
    if (foundShow) {
      return foundShow;
    }

    return resp[0];
  };

  public search = async (show: string, limit?: number): Promise<TVDBItem[]> => {
    const config = await this.getConfig();
    const sanitizedLimit = limit ? limit : 10;
    const { data: resp } = await axios.get<TVDBResp>(
      `${this.BASE_URL}/search?q=${show}&limit=${sanitizedLimit}&type=series`,
      config,
    );
    const today = new Date();
    const allDataPromises = resp.data.map(async (t) => {
      const seriesEps = await this.episodes(t.tvdb_id);

      const latest = seriesEps.data.episodes.reduce(
        (acc, curr) => {
          if (!acc.aired) return curr;
          const cDate = new Date(curr.aired);
          const aDate = new Date(acc.aired);
          // Handle 2 eps on same day
          if (cDate.getTime() === aDate.getTime() && cDate <= today) {
            return curr.number >= acc.number ? curr : acc;
          }
          return cDate > aDate && cDate <= today ? curr : acc;
        },
        { aired: '', number: 0, seasonNumber: 0 },
      );

      const nextUp = seriesEps.data.episodes.reduce((acc, curr) => {
        const cDate = new Date(curr.aired);

        if (cDate > today) {
          const aDate = new Date(acc.aired);

          if (aDate <= today) {
            return curr;
          }

          if (cDate <= aDate) {
            return curr;
          }
        }

        return acc;
      }, latest);

      const nextUpIsLatest = nextUp.seasonNumber === latest.seasonNumber && nextUp.number === latest.number;

      return {
        aliases: t.aliases,
        image_url: t.image_url,
        status: t.status,
        name: t.primary_language !== 'eng' && t.name_translated?.eng ? t.name_translated?.eng : t.name,
        overview: t.primary_language !== 'eng' && t.overview_translated?.eng ? t.overview_translated?.eng : t.overview,
        id: t.objectID,
        latestEpisode: {
          season: latest.seasonNumber,
          number: latest.number,
          airDate: latest.aired,
        },
        nextEpisode: {
          season: nextUpIsLatest ? latest.seasonNumber + 1 : nextUp.seasonNumber,
          number: nextUpIsLatest ? 1 : nextUp.number,
          airDate: nextUpIsLatest ? undefined : nextUp.aired,
        },
      };
    });

    return await Promise.all(allDataPromises);
  };

  private episodes = async (id: string | number): Promise<EpisodeResp> => {
    const config = await this.getConfig();
    const { data: resp } = await axios.get<EpisodeResp>(
      `${this.BASE_URL}/series/${id}/episodes/default?page=0&season=0`,
      config,
    );

    return resp;
  };
}
