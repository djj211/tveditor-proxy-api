import * as DelugeRPC from 'deluge-rpc';
import { DELUGE_DOWNLOAD_TYPE } from '../interfaces';

export class DelugeService {
  private deluge: DelugeRPC;
  private delugeUrl: string = process.env.DELUGE_URL!;
  private delugeWebPass: string = process.env.DELUGE_WEB_PASS!;
  private downloadPath: string = process.env.DELUGE_DOWNLOAD_PATH!;
  private moveCompleteMoviePath: string = process.env.DELUGE_MOVE_COMPLETE_MOVIE_PATH!;
  private moveCompleteShowPath: string = process.env.DELUGE_MOVE_COMPLETE_SHOW_PATH!;

  constructor() {
    this.deluge = new DelugeRPC(this.delugeUrl, this.delugeWebPass);
  }

  private async connect() {
    // Authenticate to deluge (set cookie)
    await this.deluge.auth();

    const isConnected = await this.deluge.call('web.connected');

    if (!isConnected)
      // connect to the first host
      await this.deluge.connect(0);
  }

  private getMoveCompletePath(downloadType?: DELUGE_DOWNLOAD_TYPE, appendPath?: string) {
    const moveCompletePath =
      downloadType === DELUGE_DOWNLOAD_TYPE.MOVIE ? this.moveCompleteMoviePath : this.moveCompleteShowPath;

    if (appendPath) {
      return `${moveCompletePath}/${appendPath}`;
    }

    console.log(moveCompletePath);
    return moveCompletePath;
  }

  public async addTorrentFromMagnet(
    magnetUrl: string,
    downloadType?: DELUGE_DOWNLOAD_TYPE,
    appendPath?: string,
  ): Promise<string> {
    const moveCompletePath = this.getMoveCompletePath(downloadType, appendPath);

    await this.connect();

    return this.deluge.call<string>('core.add_torrent_magnet', [
      magnetUrl,
      {
        download_location: this.downloadPath,
        move_completed: true,
        move_completed_path: moveCompletePath,
      },
    ]);
  }
}
