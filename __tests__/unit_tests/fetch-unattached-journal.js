require('../helpers/initailEnvsForUnitTest');
const { ObjectId } = require('mongodb');
const { handler } = require('../../functions/fetch-unattached-journal');

const findReturnValue = { _id: 'testId' };
const mockFind = jest.fn().mockReturnValue(findReturnValue);
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  promiseNextResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-unattached-journal', () => {
  test('Verified user calls', async () => {
    const event = { queryStringParameters: { journalId: '5c2be5a983e41424f9943add' } };
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('@kevinwang0316/mongodb-helper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    const log = require('@kevinwang0316/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseNextResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.journalEntriesCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith(
      { _id: new ObjectId(event.queryStringParameters.journalId), user_id: context.user._id },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 200, body: JSON.stringify(findReturnValue) });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with error', async () => {
    const event = { queryStringParameters: { journalId: '5c2be5a983e41424f9943add' } };
    const context = {
      user: { _id: 'id' },
      functionName: 'functionName',
    };
    const callback = jest.fn();
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    cloudwatch.trackExecTime.mockRejectedValueOnce('Error Message');
    const log = require('@kevinwang0316/log');

    await handler(event, context, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, { statusCode: 500 });
    expect(log.error).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenLastCalledWith(`${context.functionName} has an error message: Error Message`);
  });
});
