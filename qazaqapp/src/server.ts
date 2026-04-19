import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
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
} from './backend/backend-service';
import { TelegramNotifier } from './backend/telegram-notifier';
import {
  FeedbackPayload,
  MiniGameProgressPayload,
  SkillProgressPayload,
  StudentTaskCompletionPayload,
  TeacherChangeRequestPayload,
  TeacherSelectionPayload,
  TeacherTaskPayload,
} from './app/shared/models/profile';

const browserDistFolder = join(import.meta.dirname, '../browser');
const sessionCookieName = 'qazaq_session';
const sessionTtlMs = 1000 * 60 * 60 * 24 * 30;

loadEnvFile();

const app = express();
const angularApp = new AngularNodeAppEngine();
const backend = new BackendService();
const telegramNotifier = new TelegramNotifier();

app.use(express.json({ limit: '256kb' }));

app.get('/api/catalog', (_req, res) => {
  res.json(backend.getCatalog());
});

app.get('/api/leaderboard', (req, res) => {
  handleApi(res, () => {
    const rawLimit = Number.parseInt(String(req.query['limit'] ?? '20'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;
    res.json({ entries: backend.getLeaderboard(limit) });
  });
});

app.post('/api/auth/register', (req, res) => {
  handleApi(res, () => {
    const result = backend.register(req.body as RegisterPayload, getRequestMeta(req));
    setSessionCookie(res, result.token);
    res.status(201).json({ user: result.user });
  });
});

app.post('/api/auth/login', (req, res) => {
  handleApi(res, () => {
    const result = backend.login(req.body as LoginPayload, getRequestMeta(req));
    setSessionCookie(res, result.token);
    res.json({ user: result.user });
  });
});

app.post('/api/auth/logout', (req, res) => {
  handleApi(res, () => {
    backend.logout(readSessionToken(req));
    clearSessionCookie(res);
    res.status(204).send();
  });
});

app.get('/api/auth/me', (req, res) => {
  handleApi(res, () => {
    const user = backend.getSessionUser(readSessionToken(req));
    if (!user) {
      res.status(401).json({ error: 'Сессия не найдена.' });
      return;
    }
    res.json({ user });
  });
});

app.get('/api/profile', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.getProfile(userId));
  });
});

app.post('/api/teacher/select', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.selectTeacher(userId, req.body as TeacherSelectionPayload));
  });
});

app.post('/api/teacher/change-request', async (req, res) => {
  await withAuthAsync(req, res, async (userId) => {
    const payload = req.body as TeacherChangeRequestPayload;
    const profile = backend.requestTeacherChange(userId, payload);
    const session = backend.getSessionUser(readSessionToken(req));
    if (session) {
      await telegramNotifier.sendTeacherChangeRequest(session, payload.teacherId, payload.message);
    }
    res.json(profile);
  });
});

app.post('/api/feedback', async (req, res) => {
  await handleApiAsync(res, async () => {
    const session = backend.getSessionUser(readSessionToken(req));
    const payload = req.body as FeedbackPayload;
    const result = backend.submitFeedback(session?.id ?? null, payload);
    await telegramNotifier.sendFeedback(session, payload.message);
    res.json(result);
  });
});

app.post('/api/teacher/tasks', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.createTeacherTask(userId, req.body as TeacherTaskPayload));
  });
});

app.post('/api/teacher/tasks/complete', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.completeStudentTask(userId, req.body as StudentTaskCompletionPayload));
  });
});

app.post('/api/progress/checkpoint', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveCheckpoint(userId, req.body as CheckpointPayload));
  });
});

app.post('/api/progress/diagnostic', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveDiagnostic(userId, req.body as DiagnosticPayload));
  });
});

app.post('/api/progress/video', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveVideoProgress(userId, req.body as VideoProgressPayload));
  });
});

app.post('/api/progress/grammar', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveGrammarProgress(userId, req.body as GrammarProgressPayload));
  });
});

app.post('/api/progress/shadowing', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveShadowingProgress(userId, req.body as ShadowingProgressPayload));
  });
});

app.post('/api/progress/skills', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveSkillProgress(userId, req.body as SkillProgressPayload));
  });
});

app.post('/api/progress/mini-game', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveMiniGameProgress(userId, req.body as MiniGameProgressPayload));
  });
});

app.post('/api/progress/module-test', (req, res) => {
  withAuth(req, res, (userId) => {
    res.json(backend.saveModuleTest(userId, req.body as ModuleTestPayload));
  });
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);

function withAuth(req: Request, res: Response, handler: (userId: string) => void): void {
  handleApi(res, () => {
    const session = backend.getSessionUser(readSessionToken(req));
    if (!session) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }
    handler(session.id);
  });
}

async function withAuthAsync(req: Request, res: Response, handler: (userId: string) => Promise<void>): Promise<void> {
  await handleApiAsync(res, async () => {
    const session = backend.getSessionUser(readSessionToken(req));
    if (!session) {
      res.status(401).json({ error: 'Требуется авторизация.' });
      return;
    }
    await handler(session.id);
  });
}

function handleApi(res: Response, handler: () => void): void {
  try {
    handler();
  } catch (error) {
    if (isHttpError(error)) {
      res.status(error.status).json({ error: error.message });
      return;
    }

    console.error(error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
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
