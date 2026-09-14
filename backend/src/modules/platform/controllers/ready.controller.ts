import type { Request, Response } from 'express';
import { GetService } from '../services/ready/ready_get.service.js';

export class ReadyController {
  constructor(private readonly getReady = new GetService()) {}

  get = async (_req: Request, res: Response): Promise<void> => {
    const result = await this.getReady.execute();
    const ready = result.db && result.redis && result.storage;
    res.status(ready ? 200 : 503).json({ data: result });
  };
}
