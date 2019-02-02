'use strict';

const { ObjectId } = require('mongodb');
const log = require('@kevinwang0316/log');
const cloudwatch = require('@kevinwang0316/cloudwatch');
const { promiseInsertResult } = require('@kevinwang0316/mongodb-helper');

const wrapper = require('../middlewares/wrapper');

const handler = async (event, context, callback) => {
  const { journal } = JSON.parse(event.body);
  try {
    await cloudwatch.trackExecTime('MongoDbInsertOneLatancy', () => promiseInsertResult(db => {
      journal.date = new Date(journal.date);
      journal.user_id = context.user._id;
      journal._id = new ObjectId();
      delete journal.readings;
      return db.collection(process.env.journalEntriesCollectionName).insertOne(journal);
    }));

    callback(null, {
      statusCode: 200,
    });
  } catch (err) {
    log.error(`${context.functionName} has an error message: ${err}`);
    callback(null, { statusCode: 500 });
  }
};
module.exports.handler = wrapper(handler);
