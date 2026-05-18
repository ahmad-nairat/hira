import passport from 'passport'
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20'
import { container } from '../../infrastructure/di/container'
import { BaseRoute } from './base.route'
import { AuthController } from '../controllers/auth.controller'
import { authenticate, validate, asyncHandler } from '../middlewares'
import { RegisterSchema, LoginSchema } from '../../core/dtos/auth.dto'
import { Request, Response, NextFunction } from 'express'

let googleConfigured = false
function configureGoogle(): void {
  if (googleConfigured) return
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '/api/v1/auth/google/callback',
      },
      (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
        done(null, {
          id: profile.id,
          email: profile.emails?.[0]?.value ?? '',
          fullName: profile.displayName ?? profile.username ?? '',
          avatarUrl: profile.photos?.[0]?.value,
        })
      },
    ),
  )
  googleConfigured = true
}

export class AuthRoutes extends BaseRoute {
  public path = '/auth'

  protected initRoutes(): void {
    const c = container.resolve(AuthController)
    configureGoogle()

    this.router.post('/register', validate(RegisterSchema), asyncHandler(c.register))
    this.router.post('/login', validate(LoginSchema), asyncHandler(c.login))
    this.router.post('/refresh', asyncHandler(c.refresh))
    this.router.post('/logout', authenticate, asyncHandler(c.logout))
    this.router.get('/me', authenticate, asyncHandler(c.me))

    if (process.env.GOOGLE_CLIENT_ID) {
      this.router.get(
        '/google',
        passport.authenticate('google', { session: false, scope: ['profile', 'email'] }),
      )
      this.router.get(
        '/google/callback',
        (req: Request, res: Response, next: NextFunction) => {
          passport.authenticate('google', { session: false }, (err: Error | null, profile?: { id: string; email: string; fullName: string; avatarUrl?: string }) => {
            if (err || !profile) return next(err ?? new Error('Google auth failed'))
            ;(req as Request & { authProfile?: typeof profile }).authProfile = profile
            next()
          })(req, res, next)
        },
        asyncHandler(c.googleCallback),
      )
    }
  }
}
