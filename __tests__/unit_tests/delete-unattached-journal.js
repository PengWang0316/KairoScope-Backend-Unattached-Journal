require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/delete-unattached-journal');

const mockDeleteOne = jest.fn();
const mockCollection = jest.fn().mockReturnValue({ deleteOne: mockDeleteOne });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('../../libs/MongoDBHelper', () => ({
  promiseInsertResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('../../libs/log', () => ({ error: jest.fn() }));
jest.mock('../../libs/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('delete-unattached-journal', () => {
  test('Verified user calls', async () => {
    const event = { queryStringParameters: { journalId: '5c2be5a983e41424f9943add' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('../../libs/MongoDBHelper');
    const cloudwatch = require('../../libs/cloudwatch');
    const log = require('../../libs/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseInsertResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.journalEntriesCollectionName);
    expect(mockDeleteOne).toHaveBeenCalledTimes(1);
    expect(mockDeleteOne).toHaveBeenLastCalledWith(
      { _id: new ObjectId(event.queryStringParameters.journalId), user_id: context.user._id },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200 });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with error', async () => {
    const event = { queryStringParameters: { journalId: '5c2be5a983e41424f9943add' } };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    const callback = jest.fn();
    const cloudwatch = require('../../libs/cloudwatch');
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');
    const log = require('../../libs/log');

    await handler(event, context, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} has an error message: Error Message`);
  });
});
