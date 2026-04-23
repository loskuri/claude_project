import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
} from '../../shared/token.service.js';
import { AppError } from '../../middleware/error.middleware.js';

export async function register(email: string, password: string, firstName: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(409, 'El email ya está registrado');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  await prisma.userProfile.create({
    data: {
      userId: user.id,
      firstName,
      birthDate: new Date('1990-01-01'),
      sex: 'MALE',
      heightCm: 170,
      weightKg: 70,
      activityLevel: 'MODERATELY_ACTIVE',
      goal: 'MAINTAIN_WEIGHT',
      onboardingComplete: false,
    },
  });

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  return { user: { id: user.id, email: user.email, firstName }, accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: { select: { firstName: true, onboardingComplete: true } } },
  });

  if (!user) throw new AppError(401, 'Credenciales inválidas');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, 'Credenciales inválidas');

  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.profile?.firstName ?? '',
      onboardingComplete: user.profile?.onboardingComplete ?? false,
    },
    accessToken,
    refreshToken,
  };
}

export async function logout(refreshToken: string) {
  await blacklistToken(refreshToken);
}

export async function refreshTokens(refreshToken: string) {
  if (await isTokenBlacklisted(refreshToken)) {
    throw new AppError(401, 'Token inválido');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(401, 'Token inválido o expirado');
  }

  await blacklistToken(refreshToken);

  const accessToken = signAccessToken({ sub: payload.sub, email: payload.email });
  const newRefreshToken = signRefreshToken({ sub: payload.sub, email: payload.email });

  return { accessToken, refreshToken: newRefreshToken };
}
