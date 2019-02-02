require('../helpers/initailEnvsForUnitTest');

const { handler } = require('../../functions/fetch-unattached-journals');

const findReturnValue = [{ date: new Date('01/01/1982') }, { date: new Date('01/02/1982') }];
const mockFind = jest.fn().mockReturnValue([...findReturnValue]);
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../middlewares/wrapper', () => functionHandler => functionHandler);
jest.mock('@kevinwang0316/mongodb-helper', () => ({
  promiseFindResult: jest.fn().mockImplementation(cb => cb({ collection: mockCollection })),
}));
jest.mock('@kevinwang0316/log', () => ({ error: jest.fn() }));
jest.mock('@kevinwang0316/cloudwatch', () => ({ trackExecTime: jest.fn().mockImplementation((name, func) => func()) }));

describe('fetch-unattached-journals', () => {
  test('Verified user calls', async () => {
    const event = {};
    const context = {
      user: { _id: 'id' },
    };
    const callback = jest.fn();
    const mongodb = require('@kevinwang0316/mongodb-helper');
    const cloudwatch = require('@kevinwang0316/cloudwatch');
    const log = require('@kevinwang0316/log');

    await handler(event, context, callback);

    expect(cloudwatch.trackExecTime).toHaveBeenCalledTimes(1);
    expect(mongodb.promiseFindResult).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.journalEntriesCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith(
      { user_id: context.user._id },
    );
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null, {
      statusCode: 200,
      body: JSON.stringify(findReturnValue
        .sort((previous, next) => new Date(next.date).getTime() - new Date(previous.date).getTime())),
    });
    expect(log.error).not.toHaveBeenCalled();
  });

  test('Verified user calls with error', async () => {
    const event = {};
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
