'use strict';

const wrapper = require('../middlewares/wrapper');
const { promiseFindResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('../libs/log');

const { journalEntriesCollectionName } = process.env;

const handler = async (event, context, callback) => {
  try {
    const result = await cloudwatch.trackExecTime('MongoDbFindLatancy', () => promiseFindResult(db => db
      .collection(journalEntriesCollectionName)
      .find({ user_id: context.user._id })));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result
        .sort((previous, next) => new Date(next.date).getTime() - new Date(previous.date).getTime())),
    });
  } catch (err) {
    log.error(`${context.functionName} has an error message: ${err}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
