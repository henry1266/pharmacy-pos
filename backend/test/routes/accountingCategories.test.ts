import express from 'express';
import request from 'supertest';
import router from '../../modules/daily-journals';
import AccountingCategory from '../../modules/daily-journals/models/accountingCategory.model';

jest.mock('../../middleware/auth', () => ({
  __esModule: true,
  default: jest.fn((req, _res, next) => {
    const rawUser = req.headers['x-test-user'];
    const resolvedUser = Array.isArray(rawUser) ? rawUser[0] : rawUser;
    req.user = { id: resolvedUser ?? 'tester' };
    next();
  })
}));

jest.mock('../../modules/daily-journals/models/accountingCategory.model', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

const AccountingCategoryModel = AccountingCategory as unknown as {
  find: jest.Mock;
  findById: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
};

const findMock = AccountingCategoryModel.find;
const findByIdMock = AccountingCategoryModel.findById;
const findOneMock = AccountingCategoryModel.findOne;
const createMock = AccountingCategoryModel.create;

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

const mockFindResult = (categories: any[]) => {
  const exec = jest.fn().mockResolvedValue(categories);
  const sort = jest.fn().mockReturnValue({ exec });
  findMock.mockReturnValue({ sort } as any);
  return { sort, exec };
};

const mockFindOneOnce = (value: any) => {
  const exec = jest.fn().mockResolvedValue(value);
  const lean = jest.fn().mockReturnValue({ exec });
  findOneMock.mockReturnValueOnce({ lean } as any);
  return { lean, exec };
};

describe('AccountingCategories routes', () => {
  let app: express.Express;

beforeEach(() => {
  app = createApp();
  jest.clearAllMocks();
  const defaultExec = jest.fn().mockResolvedValue(null);
  findOneMock.mockReturnValue({ lean: () => ({ exec: defaultExec }) } as any);
  createMock.mockReset();
});

  it('lists active categories', async () => {
    const categories = [buildCategoryDoc({ _id: 'cat-1' }), buildCategoryDoc({ _id: 'cat-2' })];
    const { sort } = mockFindResult(categories);

    const response = await request(app)
      .get('/accounting-categories')
      .set('x-test-user', 'tester')
      .expect(200);

    expect(sort).toHaveBeenCalledWith({ order: 1, name: 1 });
    expect(response.body.data).toHaveLength(2);
  });

  it('rejects invalid id when fetching a category', async () => {
    await request(app)
      .get('/accounting-categories/invalid')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('responds 404 when category not found', async () => {
    findByIdMock.mockResolvedValue(null);

    await request(app)
      .get('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('returns 404 for unsupported category lookup by id', async () => {
    await request(app)
      .get('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('validates payload when creating a category', async () => {
    await request(app)
      .post('/accounting-categories')
      .set('x-test-user', 'tester')
      .send({})
      .expect(400);
  });

  it('prevents duplicate category names on create', async () => {
    mockFindOneOnce(buildCategoryDoc({ _id: 'existing' }));

    await request(app)
      .post('/accounting-categories')
      .set('x-test-user', 'tester')
      .send({ name: 'General' })
      .expect(409);
  });

  it('creates a new category', async () => {
    mockFindOneOnce(null);
    createMock.mockImplementationOnce(async (data: any) => buildCategoryDoc({ ...data, _id: 'new-cat' }));

    const response = await request(app)
      .post('/accounting-categories')
      .set('x-test-user', 'tester')
      .send({ name: 'Utilities', description: 'Monthly expenses' })
      .expect(200);

    expect(createMock).toHaveBeenCalledWith({
      name: 'Utilities',
      code: undefined,
      type: undefined,
      description: 'Monthly expenses',
      order: 999,
      isActive: true,
    });
    expect(response.body.data._id).toBe('new-cat');
  });

  it('rejects invalid id on update', async () => {
    await request(app)
      .put('/accounting-categories/invalid')
      .set('x-test-user', 'tester')
      .send({ name: 'Updated' })
      .expect(404);
  });

  it('allows empty payload on update and keeps existing values', async () => {
    const category = buildCategoryDoc();
    findByIdMock.mockResolvedValueOnce(category);

    const response = await request(app)
      .put('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({})
      .expect(200);

    expect(response.body.data.name).toBe(category.name);
    expect(category.save).toHaveBeenCalled();
  });

  it('prevents duplicate names on update', async () => {
    const category = buildCategoryDoc({ name: 'OldName' });
    findByIdMock.mockResolvedValueOnce(category);
    mockFindOneOnce(buildCategoryDoc({ _id: 'other-id' }));

    await request(app)
      .put('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({ name: 'General' })
      .expect(409);
  });

  it('returns 404 when updating non-existent category', async () => {
    mockFindOneOnce(null);
    findByIdMock.mockResolvedValueOnce(null);

    await request(app)
      .put('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({ name: 'General' })
      .expect(404);
  });

  it('updates an existing category', async () => {
    const category = buildCategoryDoc();
    findByIdMock.mockResolvedValueOnce(category);
    mockFindOneOnce(null);
    category.save.mockResolvedValue({ ...category, name: 'Updated', description: 'Desc' });

    const response = await request(app)
      .put('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .send({ name: 'Updated', description: 'Desc', isActive: false, order: 5 })
      .expect(200);

    expect(category.save).toHaveBeenCalled();
    expect(response.body.data.name).toBe('Updated');
  });

  it('rejects invalid id on delete', async () => {
    await request(app)
      .delete('/accounting-categories/invalid')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('returns 404 when deleting non-existent category', async () => {
    findByIdMock.mockResolvedValueOnce(null);

    await request(app)
      .delete('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(404);
  });

  it('soft deletes a category', async () => {
    const category = buildCategoryDoc();
    category.save.mockResolvedValue({ ...category, isActive: false });
    findByIdMock.mockResolvedValueOnce(category);

    const response = await request(app)
      .delete('/accounting-categories/507f1f77bcf86cd799439011')
      .set('x-test-user', 'tester')
      .expect(200);

    expect(category.isActive).toBe(false);
    expect(category.save).toHaveBeenCalled();
    expect(response.body.success).toBe(true);
  });
});
