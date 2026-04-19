import express, { Request, Response } from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BackendService,
  CheckpointPayload,
  DiagnosticPayload,
  GrammarProgressPayload,
  isHttpError,
  LoginPayload,
  ModuleTestPayload,
  RegisterPayload,
  RequestMeta,
  ShadowingProgressPayload,
  VideoProgressPayload,
} from './backend-service';
import { TelegramNotifier } from './telegram-notifier';
import {
  FeedbackPayload,
  MiniGameProgressPayload,
  SkillProgressPayload,
  StudentTaskCompletionPayload,
  TeacherChangeRequestPayload,
  TeacherSelectionPayload,
  TeacherTaskPayload,
} from '../app/shared/models/profile';

const sessionCookieName = 'qazaq_session';
const sessionTtlMs = 1000 * 60 * 60 * 24 * 30;

export function createApiApp(): express.Express {
  loadEnvFile();

  const app = express();
  const backend = new BackendService();
  const telegramNotifier = new TelegramNotifier();

  app.use(express.json({ limit: '256kb' }));

  app.get('/api/catalog', (_req, res) => {
    res.json(backend.getCatalog());
  });

  app.get('/api/leaderboard', async (req, res) => {
    await handleApiAsync(res, async () => {
      const rawLimit = Number.parseInt(String(req.query['limit'] ?? '20'), 10);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
      res.json({ entries: await backend.getLeaderboard(limit) });
    });
  });

  app.post('/api/auth/register', async (req, res) => {
    await handleApiAsync(res, async () => {
      const result = await backend.register(req.body as RegisterPayload, getRequestMeta(req));
      setSessionCookie(res, result.token);
      res.status(201).json({ user: result.user });
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    await handleApiAsync(res, async () => {
      const result = await backend.login(req.body as LoginPayload, getRequestMeta(req));
      setSessionCookie(res, result.token);
      res.json({ user: result.user });
    });
  });

  app.post('/api/auth/logout', async (req, res) => {
    await handleApiAsync(res, async () => {
      await backend.logout(readSessionToken(req));
      clearSessionCookie(res);
      res.status(204).send();
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    await handleApiAsync(res, async () => {
      const user = await backend.getSessionUser(readSessionToken(req));
      if (!user) {
        res.status(401).json({ error: 'Сессия не найдена.' });
        return;
      }
      res.json({ user });
    });
  });

  app.get('/api/profile', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.getProfile(userId));
    });
  });

  app.post('/api/teacher/select', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.selectTeacher(userId, req.body as TeacherSelectionPayload));
    });
  });

  app.post('/api/teacher/change-request', async (req, res) => {
    await withAuthAsync(req, res, backend, async (userId) => {
      const payload = req.body as TeacherChangeRequestPayload;
      const profile = await backend.requestTeacherChange(userId, payload);
      const session = await backend.getSessionUser(readSessionToken(req));
      if (session) {
        await telegramNotifier.sendTeacherChangeRequest(session, payload.teacherId, payload.message);
      }
      res.json(profile);
    });
  });

  app.post('/api/feedback', async (req, res) => {
    await handleApiAsync(res, async () => {
      const session = await backend.getSessionUser(readSessionToken(req));
      const payload = req.body as FeedbackPayload;
      const result = await backend.submitFeedback(session?.id ?? null, payload);
      await telegramNotifier.sendFeedback(session, payload.message);
      res.json(result);
    });
  });

  app.post('/api/teacher/tasks', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.createTeacherTask(userId, req.body as TeacherTaskPayload));
    });
  });

  app.post('/api/teacher/tasks/complete', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.completeStudentTask(userId, req.body as StudentTaskCompletionPayload));
    });
  });

  app.post('/api/progress/checkpoint', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveCheckpoint(userId, req.body as CheckpointPayload));
    });
  });

  app.post('/api/progress/diagnostic', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveDiagnostic(userId, req.body as DiagnosticPayload));
    });
  });

  app.post('/api/progress/video', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveVideoProgress(userId, req.body as VideoProgressPayload));
    });
  });

  app.post('/api/progress/grammar', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveGrammarProgress(userId, req.body as GrammarProgressPayload));
    });
  });

  app.post('/api/progress/shadowing', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveShadowingProgress(userId, req.body as ShadowingProgressPayload));
    });
  });

  app.post('/api/progress/skills', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveSkillProgress(userId, req.body as SkillProgressPayload));
    });
  });

  app.post('/api/progress/mini-game', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveMiniGameProgress(userId, req.body as MiniGameProgressPayload));
    });
  });

  app.post('/api/progress/module-test', async (req, res) => {
    await withAuth(req, res, backend, async (userId) => {
      res.json(await backend.saveModuleTest(userId, req.body as ModuleTestPayload));
    });
  });

  return app;
}

async function withAuth(
  req: Request,
  res: Response,
  backend: BackendService,
  handler: (userId: string) => Promise<void>,
): Promise<void> {
  await handleApiAsync(res, async () => {
    const session = await backend.getSessionUser(readSessionToken(req));
    if (!session) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }
    await handler(session.id);
  });
}

async function withAuthAsync(
  req: Request,
  res: Response,
  backend: BackendService,
  handler: (userId: string) => Promise<void>,
): Promise<void> {
  await handleApiAsync(res, async () => {
    const session = await backend.getSessionUser(readSessionToken(req));
    if (!session) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }
    await handler(session.id);
  });
}

async function handleApiAsync(res: Response, handler: () => Promise<void>): Promise<void> {
  try {
    await handler();
  } catch (error) {
    if (isHttpError(error)) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
}

function getRequestMeta(req: Request): RequestMeta {
  return {
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  };
}

function readSessionToken(req: Request): string | null {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) {
    return null;
  }

  const pairs = rawCookie.split(';');
  for (const entry of pairs) {
    const [name, ...valueParts] = entry.trim().split('=');
    if (name === sessionCookieName) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

function setSessionCookie(res: Response, token: string): void {
  res.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: sessionTtlMs,
    path: '/',
  });
}

function clearSessionCookie(res: Response): void {
  res.clearCookie(sessionCookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
  });
}

function loadEnvFile(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}
