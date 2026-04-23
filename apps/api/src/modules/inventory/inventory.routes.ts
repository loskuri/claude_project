import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validate.middleware.js';
import {
  addInventoryItemSchema,
  updateInventoryItemSchema,
  expiringQuerySchema,
} from './inventory.schemas.js';
import * as inventoryService from './inventory.service.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const items = await inventoryService.getInventory(req.user!.id);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get('/expiring', validateQuery(expiringQuerySchema), async (req, res, next) => {
  try {
    const days = Number(Array.isArray(req.query.days) ? req.query.days[0] : req.query.days) || 3;
    const items = await inventoryService.getExpiringItems(req.user!.id, days);
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post('/', validateBody(addInventoryItemSchema), async (req, res, next) => {
  try {
    const item = await inventoryService.addItem(req.user!.id, req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', validateBody(updateInventoryItemSchema), async (req, res, next) => {
  try {
    const item = await inventoryService.updateItem(req.user!.id, req.params['id'] as string, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await inventoryService.deleteItem(req.user!.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
