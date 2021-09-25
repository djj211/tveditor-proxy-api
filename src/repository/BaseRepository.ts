import { DataMapper } from '@aws/dynamodb-data-mapper';
import { DynamoDB } from 'aws-sdk';
import {
  greaterThanOrEqualTo,
  AndExpression,
  ConditionExpressionSubject,
  GreaterThanOrEqualToExpressionPredicate,
} from '@aws/dynamodb-expressions';
import { BaseTvEditorTableModel } from '../orm/BaseTvEditorTableModel';
import { enumerableErrors } from '../ErrorHandler';

export class BaseRepository {
  mapper: DataMapper;
  name: string;

  static SECOND_INDEX = 'secondSortIndex'; // type String
  static THIRD_INDEX = 'thirdSortIndex'; // type Number

  /**
   *
   * @param name name of the derived class
   */
  constructor(name: string) {
    this.name = name;

    const options: DynamoDB.ClientConfiguration = {
      region: process.env.DYNAMODB_LOCAL_REGION,
      endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT,
    };
    const client = new DynamoDB(options);
    this.mapper = new DataMapper({ client });
  }

  async put<T>(record: T): Promise<T> {
    return this.mapper.put(record);
  }

  async putBatch<T>(records: T[]): Promise<T[]> {
    const saved: T[] = [];

    try {
      for await (const persisted of this.mapper.batchPut(records)) {
        // items will be yielded as they are successfully written
        saved.push(persisted);
      }
    } catch (err) {
      console.error(
        `putBatch exception. ${saved.length} saved out of ${records.length}`,
        JSON.stringify(err, enumerableErrors),
      );
      const notSaved = records.filter(
        (value: any) => saved.findIndex((persisted: any) => persisted.sortId === value.sortId) === -1,
      );
      console.log('putBatch notSaved', JSON.stringify(notSaved));

      if (saved.length !== records.length) {
        const errors: Error[] = [];
        console.log('putBatch failed.  falling back to individual saves');
        for (const item of records as any[]) {
          if (saved.findIndex((savedItem: any) => savedItem.sortId === item.sortId) > -1) {
            continue;
          }
          try {
            await this.put(item);
            saved.push(item);
          } catch (err) {
            errors.push(err);
            console.error(
              'failed to save individual item',
              JSON.stringify(item),
              JSON.stringify(err, enumerableErrors),
            );
          }
        }
        if (errors.length) {
          throw new Error('failed to save all items in batch');
        }
      }
    }
    console.log(`${this.name} put ${records.length} record(s)`);
    return saved;
  }

  async patch<T>(record: T): Promise<T> {
    const patchRecord: BaseTvEditorTableModel<T> = record as unknown as BaseTvEditorTableModel<T>;
    let updateDate = new Date();
    updateDate = new Date(
      updateDate.getUTCFullYear(),
      updateDate.getUTCMonth(),
      updateDate.getUTCDate(),
      updateDate.getUTCHours(),
      updateDate.getUTCMinutes(),
      updateDate.getUTCSeconds(),
    );
    patchRecord.updatedAt = updateDate;
    return this.mapper.update(record, { onMissing: 'skip' });
  }

  async delete<T>(entity: T): Promise<T | undefined> {
    return this.mapper.delete(entity);
  }

  async deleteBatch<T>(records: T[]): Promise<T[]> {
    const confirmedDeletes: T[] = [];

    try {
      for await (const deleted of this.mapper.batchDelete(records)) {
        // items will be yielded as they are successfully deleted
        confirmedDeletes.push(deleted);
      }
    } catch (err) {
      console.error(
        `deleteBatch exception. ${confirmedDeletes.length} deleted out of ${records.length}`,
        JSON.stringify(err, enumerableErrors),
      );
      const notDeleted = records.filter(
        (value: any) => confirmedDeletes.findIndex((deleted: any) => deleted.sortId === value.sortId) === -1,
      );
      console.log('deleteBatch notSaved', JSON.stringify(notDeleted));

      if (confirmedDeletes.length !== records.length) {
        const errors: Error[] = [];
        console.log('deleteBatch failed.  falling back to individual deletes');

        for (const item of records as any[]) {
          if (confirmedDeletes.findIndex((deleteItem: any) => deleteItem.sortId === item.sortId) > -1) {
            continue;
          }
          try {
            await this.delete(item);
            confirmedDeletes.push(item);
          } catch (err) {
            errors.push(err);
            console.error(
              'failed to delete individual item',
              JSON.stringify(item),
              JSON.stringify(err, enumerableErrors),
            );
          }
        }
        if (errors.length) {
          throw new Error('failed to delete all items in batch');
        }
      }

      throw err;
    }

    console.log(`${this.name} deleted ${confirmedDeletes.length} record(s)`);
    return confirmedDeletes;
  }

  buildDateQueryFilter(inputDate: string): AndExpression | undefined {
    let queryFilter: AndExpression | undefined = { type: 'And', conditions: [] };
    const date = Math.floor(new Date(inputDate).getTime() / 1000);
    console.log('querying using date filter => ', date);

    const dateFilter: ConditionExpressionSubject & GreaterThanOrEqualToExpressionPredicate = {
      subject: 'updatedAt',
      ...greaterThanOrEqualTo(date),
    };

    queryFilter.conditions.push(dateFilter);

    return queryFilter;
  }
}
