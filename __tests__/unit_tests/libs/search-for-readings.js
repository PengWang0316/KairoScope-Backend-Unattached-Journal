require('../../helpers/initailEnvsForUnitTest');

const searchForReadings = require('../../../functions/libs/search-for-readings');

const mockToArray = jest.fn().mockImplementation(cb => cb(null, ['result']));
const mockSort = jest.fn().mockReturnValue({ toArray: mockToArray });
const mockFind = jest.fn().mockReturnValue({ sort: mockSort });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../../libs/MongoDBHelper', () => ({ getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })) }));
jest.mock('../../../functions/libs/find-hexagram-images', () => jest.fn());
jest.mock('../../../libs/log', () => ({ error: jest.fn() }));

describe('search-for-readings', () => {
  test('search-for-readings with 0 results', () => {
    const { getDB } = require('../../../libs/MongoDBHelper');
    const findHexagramImages = require('../../../functions/libs/find-hexagram-images');
    const { error } = require('../../../libs/log');
    const query = {};
    const callback = jest.fn();
    const results = [];

    searchForReadings(query, callback, results);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith([]);
    expect(getDB).not.toHaveBeenCalled();
    expect(findHexagramImages).not.toHaveBeenCalled();
    expect(mockCollection).not.toHaveBeenCalled();
    expect(mockFind).not.toHaveBeenCalled();
    expect(mockSort).not.toHaveBeenCalled();
    expect(mockToArray).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  test('search-for-readings with no results', () => {
    const { getDB } = require('../../../libs/MongoDBHelper');
    const findHexagramImages = require('../../../functions/libs/find-hexagram-images');
    const { error } = require('../../../libs/log');
    const query = {};
    const callback = jest.fn();
    const results = null;

    searchForReadings(query, callback, results);

    // expect(callback).toHaveBeenCalledTimes(1);
    // expect(callback).toHaveBeenLastCalledWith('result');
    expect(getDB).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenCalledTimes(1);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(1);
    expect(mockFind).toHaveBeenLastCalledWith({ $and: [{}] });
    expect(mockSort).toHaveBeenCalledTimes(1);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(mockToArray).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
    expect(findHexagramImages).toHaveBeenCalledTimes(1);
    expect(findHexagramImages).toHaveBeenLastCalledWith(['result'], callback);
  });

  test('search-for-readings with 1 results and endDate', () => {
    const { getDB } = require('../../../libs/MongoDBHelper');
    const findHexagramImages = require('../../../functions/libs/find-hexagram-images');
    const { error } = require('../../../libs/log');
    const query = { endDate: '03/16/1982', startDate: '03/15/1982' };
    const callback = jest.fn();
    const results = [{ img_arr: 'imgArr' }];
    const endDate = new Date(query.endDate);
    endDate.setDate(endDate.getDate() + 1);

    mockToArray.mockImplementationOnce(cb => cb(null, []));

    searchForReadings(query, callback, results);

    // expect(callback).toHaveBeenCalledTimes(1);
    // expect(callback).toHaveBeenLastCalledWith('result');
    expect(getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenLastCalledWith({
      $and: [
        { $or: [{ hexagram_arr_1: 'imgArr' }, { hexagram_arr_2: 'imgArr' }] },
        { $and: [{ date: { $gte: new Date(query.startDate) } }, { date: { $lt: new Date(endDate) } }] },
      ],
    });
    expect(mockSort).toHaveBeenCalledTimes(2);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(mockToArray).toHaveBeenCalledTimes(2);
    expect(error).not.toHaveBeenCalled();
    expect(findHexagramImages).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith([]);
  });

  test('search-for-readings with 1 results not endDate', () => {
    const { getDB } = require('../../../libs/MongoDBHelper');
    const findHexagramImages = require('../../../functions/libs/find-hexagram-images');
    const { error } = require('../../../libs/log');
    const query = { startDate: '03/15/1982', people: 'people', userId: 'userId' };
    const callback = jest.fn();
    const results = [{ img_arr: 'imgArr' }];
    const endDate = new Date(query.startDate);
    endDate.setDate(endDate.getDate() + 1);

    mockToArray.mockImplementationOnce(cb => cb('error message', []));

    searchForReadings(query, callback, results);

    expect(getDB).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenCalledTimes(3);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.readingCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(3);
    expect(mockFind).toHaveBeenLastCalledWith({
      $and: [
        { people: new RegExp(`.*${query.people}.*`) },
        { user_id: query.userId },
        { $or: [{ hexagram_arr_1: 'imgArr' }, { hexagram_arr_2: 'imgArr' }] },
        { $and: [{ date: { $gte: new Date(query.startDate) } }, { date: { $lt: endDate } }] },
      ],
    });
    expect(mockSort).toHaveBeenCalledTimes(3);
    expect(mockSort).toHaveBeenLastCalledWith({ date: -1 });
    expect(mockToArray).toHaveBeenCalledTimes(3);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenLastCalledWith('searchForReadings: error message');
    expect(findHexagramImages).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith([]);
  });
});
