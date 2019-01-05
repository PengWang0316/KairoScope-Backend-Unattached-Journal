require('../../helpers/initailEnvsForUnitTest');

const findHexagramImages = require('../../../functions/libs/find-hexagram-images');

const mockNext = jest.fn().mockImplementationOnce(cb => cb(null, 'imgInfo1')).mockImplementationOnce(cb => cb(null, 'imgInfo2'));
const mockFind = jest.fn().mockReturnValue({ next: mockNext });
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });

jest.mock('../../../libs/MongoDBHelper', () => ({ getDB: jest.fn().mockImplementation(() => ({ collection: mockCollection })) }));

describe('find-hexagram-images', () => {
  test('findHexagramImages', () => {
    const { getDB } = require('../../../libs/MongoDBHelper');
    const mockCallback = jest.fn();
    const readings = [{ hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2' }];

    findHexagramImages(readings, mockCallback);

    expect(getDB).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockCollection).toHaveBeenLastCalledWith(process.env.hexagramCollectionName);
    expect(mockFind).toHaveBeenCalledTimes(2);
    expect(mockFind).toHaveBeenNthCalledWith(1, { img_arr: 'hexagramArr1' });
    expect(mockFind).toHaveBeenNthCalledWith(2, { img_arr: 'hexagramArr2' });
    expect(mockNext).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenLastCalledWith([{
      hexagram_arr_1: 'hexagramArr1', hexagram_arr_2: 'hexagramArr2', img1Info: 'imgInfo1', img2Info: 'imgInfo2',
    }]);
  });
});
