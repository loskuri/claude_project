export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: { id: string; email: string; firstName: string };
  accessToken: string;
  refreshToken: string;
}
