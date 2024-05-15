import { hashKey, rangeKey, attribute } from '@nova-odm/annotations';

/**
 * The base object that shouldb e used when writing to the online ordering table
 *
 */
export class BaseTvEditorTableModel<T> {
  constructor(copy?: Partial<T>) {
    if (copy) {
      Object.assign(this, copy);
    }
  }

  @hashKey()
  hashId: string;

  @rangeKey()
  sortId: string;

  @attribute({ defaultProvider: () => new Date() })
  updatedAt?: Date;
}
