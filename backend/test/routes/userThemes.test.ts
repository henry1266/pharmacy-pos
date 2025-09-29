import express from 'express';
import request from 'supertest';
import router from '../../routes/userThemes';

jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: jest.fn((req, _res, next) => {
    const rawUser = req.headers['x-test-user'];
    const resolvedUser = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    req.user = { id: resolvedUser ?? 'user-123' };
    next();
  })
}));

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
};

const createTheme = async (
  app: express.Express,
  overrides: Partial<{
    userId: string;
    primaryColor: string;
    themeName: string;
    mode: 'light' | 'dark' | 'auto';
    customSettings: any;
  }> = {}
) => {
  const userId = overrides.userId ?? 'user-123';
  const response = await request(app)
    .post('/')
    .set('x-test-user', userId)
    .send({
      userId,
      primaryColor: overrides.primaryColor ?? '#3366ff',
      themeName: overrides.themeName ?? 'Primary Theme',
      mode: overrides.mode ?? 'light',
      customSettings: overrides.customSettings ?? { contrast: 'normal' }
    })
    .expect(201);

  return response.body.data;
};

const clearThemes = async (app: express.Express, userId: string) => {
  const listResponse = await request(app)
    .get(`/user/${userId}`)
    .set('x-test-user', userId);

  const themes: Array<{ _id: string }> = listResponse.body?.data ?? [];

  for (const theme of themes) {
    await request(app)
      .delete(`/${theme._id}`)
      .set('x-test-user', userId);
  }
};

describe('UserThemes routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(async () => {
    await clearThemes(app, 'user-123');
    await clearThemes(app, 'another-user');
    await clearThemes(app, 'intruder');
  });

  it('denies access when requesting themes for another user', async () => {
    await request(app)
      .get('/user/user-123')
      .set('x-test-user', 'someone-else')
      .expect(403);
  });

  it('creates a theme and lists themes for the owner', async () => {
    const createdTheme = await createTheme(app);

    const listResponse = await request(app)
      .get('/user/user-123')
      .set('x-test-user', 'user-123')
      .expect(200);

    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]._id).toBe(createdTheme._id);
  });

  it('returns 404 when default theme is missing, then resolves after creation', async () => {
    await request(app)
      .get('/user/user-123/default')
      .set('x-test-user', 'user-123')
      .expect(404);

    const createdTheme = await createTheme(app, { themeName: 'Latest' });

    const defaultResponse = await request(app)
      .get('/user/user-123/default')
      .set('x-test-user', 'user-123')
      .expect(200);

    expect(defaultResponse.body.data._id).toBe(createdTheme._id);
  });

  it('validates payload when creating a theme', async () => {
    const response = await request(app)
      .post('/')
      .set('x-test-user', 'user-123')
      .send({ userId: 'user-123' })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('prevents creating theme for a different user', async () => {
    await request(app)
      .post('/')
      .set('x-test-user', 'user-123')
      .send({
        userId: 'another-user',
        primaryColor: '#ff0000',
        themeName: 'Mismatch',
        mode: 'dark'
      })
      .expect(403);
  });

  it('fetches and updates a theme by id', async () => {
    const createdTheme = await createTheme(app);

    const fetchResponse = await request(app)
      .get(`/${createdTheme._id}`)
      .set('x-test-user', 'user-123')
      .expect(200);

    expect(fetchResponse.body.data._id).toBe(createdTheme._id);

    const updateResponse = await request(app)
      .put(`/${createdTheme._id}`)
      .set('x-test-user', 'user-123')
      .send({
        primaryColor: '#123456',
        themeName: 'Updated',
        mode: 'dark'
      })
      .expect(200);

    expect(updateResponse.body.data.primaryColor).toBe('#123456');
    expect(updateResponse.body.data.themeName).toBe('Updated');
    expect(updateResponse.body.data.generatedPalette).toBeDefined();
  });

  it('only allows the owner to update or delete a theme', async () => {
    const createdTheme = await createTheme(app);

    await request(app)
      .put(`/${createdTheme._id}`)
      .set('x-test-user', 'intruder')
      .send({ themeName: 'Should Fail' })
      .expect(403);

    await request(app)
      .delete(`/${createdTheme._id}`)
      .set('x-test-user', 'intruder')
      .expect(403);
  });

  it('deletes a theme and confirms removal', async () => {
    const createdTheme = await createTheme(app);

    await request(app)
      .delete(`/${createdTheme._id}`)
      .set('x-test-user', 'user-123')
      .expect(200);

    await request(app)
      .get(`/${createdTheme._id}`)
      .set('x-test-user', 'user-123')
      .expect(404);
  });

  it('exposes default color settings', async () => {
    const response = await request(app)
      .get('/colors/defaults')
      .set('x-test-user', 'user-123')
      .expect(200);

    expect(response.body.data).toBeDefined();
    expect(response.body.success).toBe(true);
  });
});
