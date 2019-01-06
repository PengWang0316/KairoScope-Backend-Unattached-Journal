import { invokeFetchUnattachedJournal } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-unattached-journal: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-unattached-journal function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: process.env.jwt,
        journalId: '5c2be5a983e41424f9943add',
      },
    };
    const res = await invokeFetchUnattachedJournal(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body).not.toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(res.body, '_id')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body, 'user_id')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body, 'date')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body, 'shareList')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body, 'uploadImages')).toBe(true);
  });
});
