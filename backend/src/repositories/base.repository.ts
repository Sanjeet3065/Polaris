/**
 * Base Repository Pattern Interface
 * Prepares the architectural foundation for Phase 2 (PostgreSQL + Prisma)
 */
export interface IBaseRepository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  create(item: Partial<T>): Promise<T>;
  update(id: ID, item: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

export abstract class BaseRepository<T, ID = string> implements IBaseRepository<T, ID> {
  abstract findById(id: ID): Promise<T | null>;
  abstract findAll(filter?: Record<string, unknown>): Promise<T[]>;
  abstract create(item: Partial<T>): Promise<T>;
  abstract update(id: ID, item: Partial<T>): Promise<T | null>;
  abstract delete(id: ID): Promise<boolean>;
}
