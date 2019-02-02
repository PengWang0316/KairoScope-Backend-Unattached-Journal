import { ObjectId } from 'mongodb';
import mongodbHelper from '@kevinwang0316/mongodb-helper';
import cloudwatch from '@kevinwang0316/cloudwatch';
import log from '@kevinwang0316/log';

import { handler } from '../../functions/create-journal';

require('../helpers/initailEnvsForUnitTest');

const mockInsertOne = jest.fn();
const mockCollection = jest.fn().mockReturnValue({ insertOne: mockInsertOne });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));
jest.mock('mongodb', () => ({ ObjectId: jest.fn() }));

describe('create-journal', () => {
  beforeAll(() => {
    mongodbHelper.promiseInsertResult.mockClear();
    log.error.mockClear();
    cloudwatch.trackExecTime.mockClear();
  });

  test('Verified user calls', async () => {
    const event = { body: '{"journal":{"date":"01/12/2019", "readings": []}}' };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.journalEntriesCollectionName);
    expect(mockInsertOne).toHaveBeenCalledTimes(1);
    expect(mockInsertOne).toHaveBeenLastCalledWith(
      { _id: new ObjectId(), user_id: context.user._id, date: new Date('01/12/2019') },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200 });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with an error', async () => {
    const event = { body: '{"journal":{"date":"01/12/2019", "readings": []}}' };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    const callback = jest.fn();
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');

    await handler(event, context, callback);

    // expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    // expect(mongodbHelper.promiseInsertResult).toHaveBeenCalledTimes(1);
    // expect(mockCollection).toHaveBeenCalledTimes(1);
    // expect(mockCollection).toHaveBeenLastCalledWith(process.env.journalEntriesCollectionName);
    // expect(mockInsertOne).toHaveBeenCalledTimes(1);
    // expect(mockInsertOne).toHaveBeenLastCalledWith(
    //   { _id: new ObjectId(), user_id: context.user._id, date: new Date('01/12/2019') },
    // );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} has an error message: Error Message`);
  });
});
