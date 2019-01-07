'use strict';

const { ObjectId } = require('mongodb');

const wrapper = require('../middlewares/wrapper');
const { promiseNextResult } = require('../libs/MongoDBHelper');
const cloudwatch = require('../libs/cloudwatch');
const log = require('../libs/log');

const { journalEntriesCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journalId } = event.queryStringParameters;
  try {
    const result = await cloudwatch.trackExecTime('MongoDbFindLatancy', () => promiseNextResult(db => db
      .collection(journalEntriesCollectionName)
      .find({ _id: new ObjectId(journalId), user_id: context.user._id })));

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result),
    });
  } catch (err) {
    log.error(`${context.functionName} has an error message: ${err}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
