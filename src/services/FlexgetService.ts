import axios, { AxiosRequestConfig } from 'axios';
import { CreateFlexget, FlexgetShow, FlexgetTask } from '../interfaces';
import { ShowMappingRepository } from '../repository/ShowMappingRepository';

export class FlexgetService {
  private AXIOS_CONFIG: AxiosRequestConfig = {
    auth: {
      username: process.env.FLEXGET_API_USER!,
      password: process.env.FLEXGET_API_PASSWORD!,
    },
  };
  private BASE_URL = process.env.FLEXGET_API_URL!;
  private TASK_NAME = process.env.TASK_NAME!;
  private showMappingRepo: ShowMappingRepository;

  constructor() {
    this.showMappingRepo = new ShowMappingRepository();
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

  public getSingleSeries = async (seriesId: string) => {
    const { data: series } = await axios.get<FlexgetShow | undefined>(
      `${this.BASE_URL}/series/${seriesId}`,
      this.AXIOS_CONFIG,
    );
    return series;
  };

  public getSeries = async () => {
    const { data: series } = await axios.get<FlexgetShow[]>(
      `${this.BASE_URL}/series?in_config=all&order=asc&sort_by=show_name`,
      this.AXIOS_CONFIG,
    );
    return series;
  };

  public getTVDBMapping = (flexgetId: number) => {
    return this.showMappingRepo.get(flexgetId);
  };

  public addSeries = async (name: string, season: number, episode: number, tvdbId: string) => {
    const { data: task } = await this.getTask();

    const existing = task.config.series.default.find((s) => s === name);

    if (existing) {
      throw new Error('Show already exists');
    }

    task.config.series.default = [...task.config.series.default, name];

    await axios.put<FlexgetTask>(`${this.BASE_URL}/tasks/${this.TASK_NAME}`, task, this.AXIOS_CONFIG);

    const createShow = this.getCreateFlexgetShow(name, season, episode);

    const { data: show } = await axios.post<FlexgetShow>(`${this.BASE_URL}/series`, createShow, this.AXIOS_CONFIG);

    await this.showMappingRepo.post(show.id, tvdbId, name);

    return show;
  };

  public editSeries = async (showId: number, name: string, season: number, episode: number) => {
    const createShow = this.getCreateFlexgetShow(name, season, episode);

    const { data: show } = await axios.put<FlexgetShow>(
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

    const { data: show } = await axios.delete<FlexgetShow>(`${this.BASE_URL}/series/${showId}`, this.AXIOS_CONFIG);

    return show;
  };
}
