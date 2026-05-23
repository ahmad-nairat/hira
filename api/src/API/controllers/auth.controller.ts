import { injectable, inject } from 'tsyringe'
import { Request, Response } from 'express'
import { AuthService } from '../../application/services/auth.service'
import { UnauthorizedError, BadRequestError } from '../../application/errors'

const REFRESH_COOKIE = 'refresh_token'
const REFRESH_COOKIE_PATH = '/api/v1/auth/refresh'

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

@injectable()
export class AuthController {
  constructor(@inject(AuthService) private readonly service: AuthService) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.register(req.body)
    setRefreshCookie(res, result.refreshToken)
    res.status(201).json({ data: { user: result.user, accessToken: result.accessToken } })
  }

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.login(req.body)
    setRefreshCookie(res, result.refreshToken)
    res.json({ data: { user: result.user, accessToken: result.accessToken } })
  }

  refresh = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) throw new UnauthorizedError('Missing refresh token')
    const result = await this.service.refresh(token)
    setRefreshCookie(res, result.refreshToken)
    res.json({ data: { user: result.user, accessToken: result.accessToken } })
  }

  logout = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    await this.service.logout(req.user.id)
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH })
    res.status(204).send()
  }

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const user = await this.service.me(req.user.id)
    res.json({ data: user })
  }

  uploadAvatar = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) throw new BadRequestError('Avatar file is required')
    const user = await this.service.uploadAvatar(req.user.id, file.buffer, file.mimetype)
    res.json({ data: user })
  }

  removeAvatar = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedError()
    const user = await this.service.removeAvatar(req.user.id)
    res.json({ data: user })
  }

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    const profile = (req as Request & { authProfile?: { id: string; email: string; fullName: string; avatarUrl?: string } }).authProfile
    if (!profile) throw new UnauthorizedError('Google authentication failed')
    const result = await this.service.loginWithGoogle(profile)
    setRefreshCookie(res, result.refreshToken)
    const appUrl = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
    res.redirect(`${appUrl}/auth/callback?accessToken=${encodeURIComponent(result.accessToken)}`)
  }
}
