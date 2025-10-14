import type { SupplierQueryInput } from '../../suppliers.types';
import { buildSupplierListQuery } from '../query.service';

describe('query.service - buildSupplierListQuery', () => {
  it('builds regex criteria for search across key fields', () => {
    const query: SupplierQueryInput = { search: 'Acme' } as SupplierQueryInput;
    const result = buildSupplierListQuery(query);

    expect(result.criteria).toHaveProperty('$or');
    const orConditions = (result.criteria as any).$or;
    expect(Array.isArray(orConditions)).toBe(true);
    expect(orConditions).toHaveLength(4);
    expect(orConditions[0].name).toEqual(new RegExp('Acme', 'i'));
  });

  it('defaults to sorting by name ascending when sortBy is invalid', () => {
    const query: SupplierQueryInput = {
      sortBy: 'invalid-field',
      sortOrder: 'desc',
    } as SupplierQueryInput;
    const result = buildSupplierListQuery(query);

    expect(result.sort).toEqual({ name: 1 });
  });

  it('applies provided sort direction for known fields', () => {
    const query: SupplierQueryInput = {
      sortBy: 'code',
      sortOrder: 'desc',
    } as SupplierQueryInput;
    const result = buildSupplierListQuery(query);

    expect(result.sort).toEqual({ code: -1 });
  });

  it('clamps pagination values and calculates skip', () => {
    const query: SupplierQueryInput = {
      limit: 500,
      page: 3,
    } as SupplierQueryInput;
    const result = buildSupplierListQuery(query);

    expect(result.limit).toBe(100);
    expect(result.skip).toBe(200);
  });

  it('includes active flag when provided', () => {
    const query: SupplierQueryInput = { active: false } as SupplierQueryInput;
    const result = buildSupplierListQuery(query);

    expect(result.criteria).toHaveProperty('isActive', false);
  });
});
