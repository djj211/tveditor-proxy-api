import axios, { AxiosRequestConfig } from 'axios';
import { CreateFlexget, Episode, FlexgetLastSeen, FlexgetMovie, FlexgetShow, FlexgetTask } from '../interfaces';
import { MovieMappingRepository } from '../repository/MovieMappingRepository';
import { ShowMappingRepository } from '../repository/ShowMappingRepository';

interface FlexgetMovieRes {
  added_on: string;
  id: number;
  list_id: number;
  title: string;
  year: number;
  movies_list_ids: number[];
}

interface FlexgetTVRes {
  id: number;
  name: string;
  begin_episode?: Episode;
  latest_entity?: FlexgetLastSeen;
}

export class FlexgetService {
  private AXIOS_CONFIG: AxiosRequestConfig = {
    auth: {
      username: process.env.FLEXGET_API_USER!,
      password: process.env.FLEXGET_API_PASSWORD!,
    },
  };
  private BASE_URL = process.env.FLEXGET_API_URL!;
  private TASK_NAME = process.env.TASK_NAME!;
  private MOVIE_LIST_ID = process.env.MOVIE_LIST_ID!;

  private showMappingRepo: ShowMappingRepository;
  private movieMappingRepo: MovieMappingRepository;

  constructor() {
    this.showMappingRepo = new ShowMappingRepository();
    this.movieMappingRepo = new MovieMappingRepository();
  }

  private getCreateFlexgetShow = (name: string, season: number, episode: number): CreateFlexget => {
    const formattedSeason = season < 10 ? `0${season}` : `${season}`;
    const formattedEpisode = episode < 10 ? `0${episode}` : `${episode}`;

    return {
      name,
      begin_episode: `S${formattedSeason}E${formattedEpisode}`,
      alternate_names: [],
    };
  };

  private getTask = () => {
    return axios.get<FlexgetTask>(`${this.BASE_URL}/tasks/${this.TASK_NAME}`, this.AXIOS_CONFIG);
  };

  public getSingleSeries = async (seriesId: string): Promise<FlexgetShow | undefined> => {
    const { data: series } = await axios.get<FlexgetTVRes | undefined>(
      `${this.BASE_URL}/series/${seriesId}`,
      this.AXIOS_CONFIG,
    );

    if (!series) return undefined;

    return {
      name: series.name,
      id: series.id,
      begin_episode: series.begin_episode,
      latest_entity: series.latest_entity,
    };
  };

  public getSeries = async (): Promise<FlexgetShow[]> => {
    const { data: series } = await axios.get<FlexgetTVRes[]>(
      `${this.BASE_URL}/series?in_config=all&order=asc&sort_by=show_name`,
      this.AXIOS_CONFIG,
    );
    return series.map((s) => ({
      name: s.name,
      id: s.id,
      begin_episode: s.begin_episode,
      latest_entity: s.latest_entity,
    }));
  };

  public getTVDBShowMapping = (flexgetId: number) => {
    return this.showMappingRepo.get(flexgetId);
  };

  public getTVDBMovieMapping = (flexgetId: number) => {
    return this.movieMappingRepo.get(flexgetId);
  };

  public addSeries = async (name: string, season: number, episode: number, tvdbId: string): Promise<FlexgetShow> => {
    const { data: task } = await this.getTask();

    const existing = task.config.series.default.find((s) => s === name);

    if (existing) {
      throw new Error('Show already exists');
    }

    task.config.series.default = [...task.config.series.default, name];

    await axios.put<FlexgetTask>(`${this.BASE_URL}/tasks/${this.TASK_NAME}`, task, this.AXIOS_CONFIG);

    const createShow = this.getCreateFlexgetShow(name, season, episode);

    const { data: show } = await axios.post<FlexgetTVRes>(`${this.BASE_URL}/series`, createShow, this.AXIOS_CONFIG);

    await this.showMappingRepo.post(show.id, tvdbId, name);

    return {
      name: show.name,
      id: show.id,
      begin_episode: show.begin_episode,
      latest_entity: show.latest_entity,
    };
  };

  public editSeries = async (showId: number, name: string, season: number, episode: number): Promise<FlexgetShow> => {
    const createShow = this.getCreateFlexgetShow(name, season, episode);

    const { data: show } = await axios.put<FlexgetTVRes>(
      `${this.BASE_URL}/series/${showId}`,
      createShow,
      this.AXIOS_CONFIG,
    );

    return show;
  };

  public deleteSeries = async (showId: number, name: string) => {
    const { data: task } = await this.getTask();
    task.config.series.default = task.config.series.default.filter((s) => s !== name);

    const showMappingToDelete = await this.showMappingRepo.get(showId);
    await this.showMappingRepo.delete(showMappingToDelete);

    await axios.put<FlexgetTask>(`${this.BASE_URL}/tasks/${this.TASK_NAME}`, task, this.AXIOS_CONFIG);

    const { data: show } = await axios.delete<FlexgetTVRes>(`${this.BASE_URL}/series/${showId}`, this.AXIOS_CONFIG);

    return show;
  };

  public getSingleMovie = async (movieId: string): Promise<FlexgetMovie | undefined> => {
    const { data: movie } = await axios.get<FlexgetMovieRes | undefined>(
      `${this.BASE_URL}/movie_list/${this.MOVIE_LIST_ID}/movies/${movieId}`,
      this.AXIOS_CONFIG,
    );

    if (!movie) return undefined;

    return {
      name: movie.title,
      id: movie.id,
      year: movie.year,
      list_id: movie.list_id,
      added_on: movie.added_on,
      movies_list_ids: movie.movies_list_ids,
    };
  };

  public getAllMovies = async (): Promise<FlexgetMovie[]> => {
    const { data: movies } = await axios.get<FlexgetMovieRes[]>(
      `${this.BASE_URL}/movie_list/${this.MOVIE_LIST_ID}/movies?order=asc`,
      this.AXIOS_CONFIG,
    );

    return movies.map((movie) => ({
      name: movie.title,
      id: movie.id,
      year: movie.year,
      list_id: movie.list_id,
      added_on: movie.added_on,
      movies_list_ids: movie.movies_list_ids,
    }));
  };

  public addMovie = async (name: string, year: number, tvdbId: string): Promise<FlexgetMovie> => {
    const movieToAdd = {
      movie_name: name,
      movie_year: year,
    };
    const { data: movie } = await axios.post<FlexgetMovieRes>(
      `${this.BASE_URL}/movie_list/${this.MOVIE_LIST_ID}/movies`,
      movieToAdd,
      this.AXIOS_CONFIG,
    );

    await this.movieMappingRepo.post(movie.id, tvdbId, name);

    return {
      name: movie.title,
      id: movie.id,
      year: movie.year,
      list_id: movie.list_id,
      added_on: movie.added_on,
      movies_list_ids: movie.movies_list_ids,
    };
  };

  public deleteMovie = async (movieId: number) => {
    const { data: movie } = await axios.delete<FlexgetMovieRes>(
      `${this.BASE_URL}/movie_list/${this.MOVIE_LIST_ID}/movies/${movieId}`,
      this.AXIOS_CONFIG,
    );

    const movieMappingToDelete = await this.movieMappingRepo.get(movieId);
    await this.movieMappingRepo.delete(movieMappingToDelete);

    return movie;
  };
}
