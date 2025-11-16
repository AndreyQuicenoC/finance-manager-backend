export interface Item {
  id: number;
  name: string;
  createdAt: Date;
}

export class ExampleService {
  private items: Item[] = [];

  /**
   * Get all items
   */
  public findAll(): Item[] {
    return this.items;
  }

  /**
   * Find item by ID
   */
  public findById(id: number): Item | undefined {
    return this.items.find((item) => item.id === id);
  }

  /**
   * Create new item
   */
  public create(name: string): Item {
    const newItem: Item = {
      id: Date.now(),
      name,
      createdAt: new Date(),
    };

    this.items.push(newItem);
    return newItem;
  }

  /**
   * Update item
   */
  public update(id: number, name: string): Item | null {
    const itemIndex = this.items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return null;
    }

    this.items[itemIndex].name = name;
    return this.items[itemIndex];
  }

  /**
   * Delete item
   */
  public delete(id: number): boolean {
    const itemIndex = this.items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return false;
    }

    this.items.splice(itemIndex, 1);
    return true;
  }
}
