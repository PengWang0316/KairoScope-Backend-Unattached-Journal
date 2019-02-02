import { ObjectId } from 'mongodb';
import { initialConnects, getDB, promiseReturnResult } from '@kevinwang0316/mongodb-helper';

import { invokeCreateJournal } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;
const userId = '59de9e5023543f8a28aaaaa1'; // This is a customized key that is only used by this test case to prevent the conflict with other tests that is running parallelly .
const readingId = new ObjectId().toString();

// const addReading = () => promiseInsertResult(db => db
//   .collection(process.env.journalEntriesCollectionName)
//   .insertOne({ _id: new ObjectId(readingId), journal_entries: [], user_id: userId }));

const removeJournal = () => getDB()
  .collection(process.env.journalEntriesCollectionName).deleteOne({ user_id: userId });

describe('create-reading: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
    await initialConnects(context.dbUrl, context.dbName);
  });

  // Delete the reading after the test finished
  afterAll(async () => {
    await removeJournal();
  });

  test('invoke create-reading function', async () => {
    const event = {
      // A fake jwt message is using for testing
      body: `{ "journal":{"readings":{}, "date":"2019-01-12T00:00:00.000Z"}, "jwtMessage": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWRlOWU1MDIzNTQzZjhhMjhhYWFhYTEiLCJpYXQiOjF9.CSuq5ORx2oxMJZeNOqmsN6sVtb2krU850krqXBZpI_A" }`,
    };
    context.user = { _id: userId };
    await invokeCreateJournal(event, context);

    const result = await promiseReturnResult(db => db.collection(process.env.journalEntriesCollectionName).findOne({ user_id: userId }));
    expect(result).not.toBeUndefined();
    expect(result).not.toBeNull();
    expect(result.date).toEqual(new Date('2019-01-12T00:00:00.000Z'));
  });
});
