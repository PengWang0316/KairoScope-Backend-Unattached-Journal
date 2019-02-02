'use strict';

const { ObjectId } = require('mongodb');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { promiseInsertResult } = require('@kevinwang0316/mongodb-helper');

const wrapper = require('../middlewares/wrapper');

const { journalEntriesCollectionName } = process.env;

const handler = async (event, context, callback) => {
  const { journalId } = event.queryStringParameters;
  try {
    await cloudwatch.trackExecTime('MongoDbFindLatancy', () => promiseInsertResult(db => db
      .collection(journalEntriesCollectionName)
      .deleteOne({ _id: new ObjectId(journalId), user_id: context.user._id })));

    callback(null, {
      statusCode: 200,
    });
  } catch (err) {
    log.error(`${context.functionName} has an error message: ${err}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
