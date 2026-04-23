import type { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service.js';

export async function getMeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.getMe(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.updateProfile(req.user!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function updatePreferencesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await usersService.updatePreferences(req.user!.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
