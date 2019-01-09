import { ObjectId } from 'mongodb';

import { invokeDeleteUnattachedJournal } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';
import { promiseInsertResult, initialConnects, promiseReturnResult } from '../../libs/MongoDBHelper';

let context;
let unattachedJournalId;
const userId = '59de9e5023543f8a28aaaaaa'; // This is a customized key that is only used by this test case to prevent the conflict with other tests that is running parallelly .

const addOneUnattachedJournal = () => promiseInsertResult(db => {
  const unattachedJournal = { _id: new ObjectId(), user_id: userId };
  unattachedJournalId = unattachedJournal._id.toString();
  return db.collection(process.env.journalEntriesCollectionName).insertOne(unattachedJournal);
});

describe('delete-unattached-journal: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
    await initialConnects(context.dbUrl, context.dbName);
    await addOneUnattachedJournal();
  });

  test('invoke delete-unattached-journal function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWRlOWU1MDIzNTQzZjhhMjhhYWFhYWEiLCJpYXQiOjF9.Mlxi9iFuyBqShIVRmJVkrc6cHyhFyJbRfO9zScGtzn0',
        journalId: unattachedJournalId,
      },
    };

    let number = await promiseReturnResult(db => db.collection(process.env.journalEntriesCollectionName).countDocuments({ _id: new ObjectId(unattachedJournalId) }));
    expect(number).toBe(1);

    const res = await invokeDeleteUnattachedJournal(event, context);

    number = await promiseReturnResult(db => db.collection(process.env.journalEntriesCollectionName).countDocuments({ _id: new ObjectId(unattachedJournalId) }));

    expect(res.statusCode).toBe(200);
    expect(number).toBe(0);
  });
});
