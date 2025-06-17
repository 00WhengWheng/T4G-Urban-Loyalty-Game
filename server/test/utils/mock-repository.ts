export class MockRepository<T> {
  private entities: T[] = [];

  async find(): Promise<T[]> {
    return this.entities;
  }

  async findOne(id: string): Promise<T | undefined> {
    return this.entities.find(entity => (entity as any).id === id);
  }

  async save(entity: T): Promise<T> {
    this.entities.push(entity);
    return entity;
  }

  async delete(id: string): Promise<void> {
    this.entities = this.entities.filter(entity => (entity as any).id !== id);
  }
}
