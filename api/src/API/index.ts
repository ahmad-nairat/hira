import express, { Application, Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import passport from 'passport'
import { LOCAL_UPLOAD_DIR } from '../infrastructure/services/local-file.service'
import {
  BaseRoute,
  AuthRoutes,
  OnboardingRoutes,
  OrgRoutes,
  JobRoutes,
  CandidateRoutes,
  ApplicationRoutes,
  InterviewRoutes,
  OfferRoutes,
  NotificationRoutes,
  PublicRoutes,
} from './routes'
import { errorMiddleware, loggingMiddleware } from './middlewares'

export class AppServer {
  public app: Application
  private readonly apiPrefix = '/api/v1'

  constructor() {
    this.app = express()
    this.setupMiddleware()
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '5mb' }))
    this.app.use(cookieParser())

    const allowedOrigins = [process.env.APP_URL, process.env.PUBLIC_APP_URL]
      .filter((v): v is string => !!v)
      .flatMap((v) => v.split(','))
      .map((v) => v.trim())
      .filter(Boolean)

    this.app.use(
      cors({
        origin: (origin, callback) => {
          // Allow non-browser requests (curl, server-side) and any origin in the allow-list.
          if (!origin) return callback(null, true)
          if (allowedOrigins.length === 0) return callback(null, true)
          if (allowedOrigins.includes(origin)) return callback(null, true)
          callback(new Error(`Origin ${origin} not allowed by CORS`))
        },
        credentials: true,
      }),
    )
    this.app.use(passport.initialize())
    this.app.use(loggingMiddleware)
  }

  private setupRoutes(): void {
    this.app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }))

    if (process.env.FILE_STORAGE !== 'r2') {
      this.app.use('/files', express.static(LOCAL_UPLOAD_DIR))
    }

    const routes: BaseRoute[] = [
      new AuthRoutes(),
      new OnboardingRoutes(),
      new OrgRoutes(),
      new JobRoutes(),
      new CandidateRoutes(),
      new ApplicationRoutes(),
      new InterviewRoutes(),
      new OfferRoutes(),
      new NotificationRoutes(),
      new PublicRoutes(),
    ]

    routes.forEach((route) => this.app.use(`${this.apiPrefix}${route.path}`, route.router))
  }

  public listen(port: number): void {
    this.setupRoutes()
    this.app.use(errorMiddleware)
    this.app.listen(port, () => console.log(`[hira-api] listening on :${port}`))
  }
}
