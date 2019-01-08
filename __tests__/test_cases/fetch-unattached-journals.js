import { invokeFetchUnattachedJournals } from '../helpers/InvokeHelper';
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

  test('invoke fetch-unattached-journals function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: process.env.jwt,
      },
    };
    const res = await invokeFetchUnattachedJournals(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(10);
    res.body.forEach(journal => {
      expect(Object.prototype.hasOwnProperty.call(journal, '_id')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(journal, 'user_id')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(journal, 'date')).toBe(true);
    });
  });
});
