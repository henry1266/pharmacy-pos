import express from 'express';
import request from 'supertest';
import router from '../../modules/daily-journals/daily-journalCategories';
import AccountingCategory from '../../modules/daily-journals/daily-journalCategory';

jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: jest.fn((req, _res, next) => {
    const rawUser = req.headers['x-test-user'];
    const resolvedUser = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    req.user = { id: resolvedUser ?? 'tester' };
    next();
  })
}));

jest.mock('../../models/AccountingCategory', () => ({
  __esModule: true,
  default: jest.fn()
}));

const AccountingCategoryMock = AccountingCategory as jest.MockedFunction<any>;

AccountingCategoryMock.find = jest.fn();
AccountingCategoryMock.findById = jest.fn();
AccountingCategoryMock.findOne = jest.fn();

const findMock = AccountingCategoryMock.find as jest.Mock;
const findByIdMock = AccountingCategoryMock.findById as jest.Mock;
const findOneMock = AccountingCategoryMock.findOne as jest.Mock;

const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/', router);
  return app;
};

const buildCategoryDoc = (overrides: Partial<any> = {}) => {
  const base = {
    _id: overrides._id ?? '507f1f77bcf86cd799439011',
    name: overrides.name ?? 'General',
    description: overrides.description ?? '',
    isActive: overrides.isActive ?? true,
    order: overrides.order ?? 1
  };
  const save = jest.fn().mockResolvedValue({ ...base, ...overrides });
  return { ...base, ...overrides, save };
};

describe('AccountingCategories routes', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  it('lists active categories', async () => {
    const categories = [buildCategoryDoc({ _id: 'cat-1' }), buildCategoryDoc({ _id: 'cat-2' })];
    const sortMock = jest.fn().mockResolvedValue(categories);
    findMock.mockReturnValue({ sort: sortMock } as any);

    const response = await request(app)
      .get('/')
      .set('x-test-user', 'tester')
      .expect(200);

    expect(sortMock).toHaveBeenCalledWith({ order: 1, name: 1 });
    expect(response.body.data).toHaveLength(2);
  });

  it('rejects invalid id when fetching a category', async () => {
    await request(app)
      .get('/invalid')
      .set('x-test-user', 'tester')
      .expect(400);
  });

  it('responds 404 when category not found', async () => {
    findByIdMock.mockResolvedValue(null);

    await request(app)
      .get('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('returns category details by id', async () => {
    const category = buildCategoryDoc({ name: 'Operating' });
    findByIdMock.mockResolvedValue(category);

    const response = await request(app)
      .get('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(200);

    expect(response.body.data.name).toBe('Operating');
  });

  it('validates payload when creating a category', async () => {
    await request(app)
      .post('/')
      .set('x-test-user', 'tester')
      .send({})
      .expect(400);
  });

  it('prevents duplicate category names on create', async () => {
    findOneMock.mockResolvedValueOnce(buildCategoryDoc({ _id: 'existing' }));

    await request(app)
      .post('/')
      .set('x-test-user', 'tester')
      .send({ name: 'General' })
      .expect(400);
  });

  it('creates a new category', async () => {
    findOneMock.mockResolvedValueOnce(null);
    AccountingCategoryMock.mockImplementationOnce((data: any) => {
      const doc = buildCategoryDoc({ ...data, _id: 'new-cat' });
      doc.save.mockResolvedValue(doc);
      return doc;
    });

    const response = await request(app)
      .post('/')
      .set('x-test-user', 'tester')
      .send({ name: 'Utilities', description: 'Monthly expenses' })
      .expect(200);

    expect(AccountingCategoryMock).toHaveBeenCalledWith({
      name: 'Utilities',
      description: 'Monthly expenses'
    });
    expect(response.body.data._id).toBe('new-cat');
  });

  it('rejects invalid id on update', async () => {
    await request(app)
      .put('/invalid')
      .set('x-test-user', 'tester')
      .send({ name: 'Updated' })
      .expect(400);
  });

  it('validates payload on update', async () => {
    await request(app)
      .put('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({})
      .expect(400);
  });

  it('prevents duplicate names on update', async () => {
    findOneMock.mockResolvedValueOnce(buildCategoryDoc({ _id: 'other-id' }));

    await request(app)
      .put('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({ name: 'General' })
      .expect(400);
  });

  it('returns 404 when updating non-existent category', async () => {
    findOneMock.mockResolvedValueOnce(null);
    findByIdMock.mockResolvedValueOnce(null);

    await request(app)
      .put('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({ name: 'General' })
      .expect(404);
  });

  it('updates an existing category', async () => {
    findOneMock.mockResolvedValueOnce(null);
    const category = buildCategoryDoc();
    category.save.mockResolvedValue({ ...category, name: 'Updated', description: 'Desc' });
    findByIdMock.mockResolvedValueOnce(category);

    const response = await request(app)
      .put('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({ name: 'Updated', description: 'Desc', isActive: false, order: 5 })
      .expect(200);

    expect(category.save).toHaveBeenCalled();
    expect(response.body.data.name).toBe('Updated');
  });

  it('rejects invalid id on delete', async () => {
    await request(app)
      .delete('/invalid')
      .set('x-test-user', 'tester')
      .expect(400);
  });

  it('returns 404 when deleting non-existent category', async () => {
    findByIdMock.mockResolvedValueOnce(null);

    await request(app)
      .delete('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('soft deletes a category', async () => {
    const category = buildCategoryDoc();
    category.save.mockResolvedValue({ ...category, isActive: false });
    findByIdMock.mockResolvedValueOnce(category);

    const response = await request(app)
      .delete('/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(200);

    expect(category.isActive).toBe(false);
    expect(category.save).toHaveBeenCalled();
    expect(response.body.success).toBe(true);
  });
});
