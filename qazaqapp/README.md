# Qazaqapp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Backend features

The project now includes a built-in backend inside `src/server.ts` with persistent file storage in `data/qazaq-db.json`.

Implemented:

- registration, login, logout and cookie-based sessions
- protected profile API
- persistence of current level and current lesson/topic/activity
- saving of diagnostic test results
- saving of video, grammar, shadowing, reading/listening and module test progress
- automatic profile aggregation, streak, points and achievements

Main API routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/profile`
- `POST /api/progress/checkpoint`
- `POST /api/progress/diagnostic`
- `POST /api/progress/video`
- `POST /api/progress/grammar`
- `POST /api/progress/shadowing`
- `POST /api/progress/skills`
- `POST /api/progress/module-test`

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

For the SSR build with the integrated backend:

```bash
npm run build
node dist/qazaqapp/server/server.mjs
```

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
