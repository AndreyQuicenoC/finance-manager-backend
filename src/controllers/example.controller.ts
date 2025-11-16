import { Request, Response } from 'express';

export class ExampleController {
  /**
   * Get all items
   */
  public getAll(_req: Request, res: Response): Response {
    try {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get item by ID
   */
  public getById(req: Request, res: Response): Response {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: 'ID is required' });
      }

      const item = { id: parseInt(id), name: `Item ${id}` };
      return res.status(200).json(item);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create new item
   */
  public create(req: Request, res: Response): Response {
    try {
      const { name } = req.body as { name?: string };

      if (!name) {
        return res.status(400).json({ message: 'Name is required' });
      }

      const newItem = { id: Date.now(), name };
      return res.status(201).json(newItem);
    } catch (error) {
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
