import { table, attribute } from '@aws/dynamodb-data-mapper-annotations';
import { BaseTvEditorTableModel } from './BaseTvEditorTableModel';

/**
 * Internal data model for a map in the tvEditor table
 *
 */
@table(process.env.TV_EDITOR_TABLE!)
export class ShowMappingModel extends BaseTvEditorTableModel<ShowMappingModel> {
  @attribute()
  flexgetId: number;

  @attribute()
  tvdbId: string;

  @attribute()
  name: string;
}
