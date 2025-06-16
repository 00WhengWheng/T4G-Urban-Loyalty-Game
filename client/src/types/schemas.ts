// types/schemas.ts
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password minimo 6 caratteri')
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password deve contenere lettere e numeri'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numero telefono non valido').optional()
});