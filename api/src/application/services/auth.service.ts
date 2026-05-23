import { injectable, inject } from 'tsyringe'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import jwt, { SignOptions } from 'jsonwebtoken'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IUserRepo } from '../../core/repo-interfaces/IUserRepo'
import { IFileService } from '../../infrastructure/services/file.service'
import { RegisterDTO, LoginDTO, AuthResponseDTO, ReadUserDTO, toReadUserDTO } from '../../core/dtos/auth.dto'
import { ConflictError, UnauthorizedError, NotFoundError, BusinessRuleError } from '../errors'

const AVATAR_MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
}

const BCRYPT_ROUNDS = 12

interface AccessPayload {
  sub: string
  email: string
}

interface RefreshPayload {
  sub: string
}

@injectable()
export class AuthService {
  constructor(
    @inject(TOKENS.IUserRepo) private readonly userRepo: IUserRepo,
    @inject(TOKENS.IFileService) private readonly fileService: IFileService,
  ) {}

  async register(dto: RegisterDTO): Promise<AuthResponseDTO> {
    const existing = await this.userRepo.findByEmail(dto.email)
    if (existing) throw new ConflictError('Email already in use')

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      password: passwordHash,
      fullName: dto.fullName,
    })

    return this.issueTokens(user.id, user.email).then(async (tokens) => ({
      user: toReadUserDTO(await this.persistRefreshToken(user.id, tokens.refreshToken)),
      ...tokens,
    }))
  }

  async login(dto: LoginDTO): Promise<AuthResponseDTO> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase())
    if (!user || !user.password) throw new UnauthorizedError('Invalid email or password')

    const ok = await bcrypt.compare(dto.password, user.password)
    if (!ok) throw new UnauthorizedError('Invalid email or password')

    const tokens = await this.issueTokens(user.id, user.email)
    const updated = await this.persistRefreshToken(user.id, tokens.refreshToken)
    return { user: toReadUserDTO(updated), ...tokens }
  }

  async refresh(refreshToken: string): Promise<AuthResponseDTO> {
    let payload: RefreshPayload
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as RefreshPayload
    } catch {
      throw new UnauthorizedError('Invalid refresh token')
    }
    const user = await this.userRepo.findById(payload.sub)
    if (!user || !user.refreshToken) throw new UnauthorizedError('Invalid refresh token')

    const ok = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!ok) throw new UnauthorizedError('Invalid refresh token')

    const tokens = await this.issueTokens(user.id, user.email)
    const updated = await this.persistRefreshToken(user.id, tokens.refreshToken)
    return { user: toReadUserDTO(updated), ...tokens }
  }

  async logout(userId: string): Promise<void> {
    await this.userRepo.update(userId, { refreshToken: null })
  }

  async me(userId: string): Promise<AuthResponseDTO['user']> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')
    return toReadUserDTO(user)
  }

  async uploadAvatar(userId: string, buffer: Buffer, mimeType: string): Promise<ReadUserDTO> {
    const ext = AVATAR_MIME_EXT[mimeType.toLowerCase()]
    if (!ext) throw new BusinessRuleError('Avatar must be a PNG or JPG image')

    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')

    const key = `avatars/${userId}/${crypto.randomUUID()}.${ext}`
    const url = await this.fileService.upload(buffer, key, mimeType)
    const updated = await this.userRepo.update(userId, { avatarUrl: url })
    return toReadUserDTO(updated)
  }

  async removeAvatar(userId: string): Promise<ReadUserDTO> {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new NotFoundError('User')
    const updated = await this.userRepo.update(userId, { avatarUrl: null })
    return toReadUserDTO(updated)
  }

  /**
   * Looks up or creates a user account for a Google OAuth profile, then issues a fresh token pair.
   * Used by the passport-google-oauth20 callback.
   */
  async loginWithGoogle(profile: { id: string; email: string; fullName: string; avatarUrl?: string }): Promise<AuthResponseDTO> {
    let user = await this.userRepo.findByGoogleId(profile.id)
    if (!user) {
      user = await this.userRepo.findByEmail(profile.email.toLowerCase())
      if (user) {
        user = await this.userRepo.update(user.id, { googleId: profile.id, isEmailVerified: true })
      } else {
        user = await this.userRepo.create({
          email: profile.email.toLowerCase(),
          password: null,
          fullName: profile.fullName,
          googleId: profile.id,
          avatarUrl: profile.avatarUrl ?? null,
          isEmailVerified: true,
        })
      }
    }
    const tokens = await this.issueTokens(user.id, user.email)
    const updated = await this.persistRefreshToken(user.id, tokens.refreshToken)
    return { user: toReadUserDTO(updated), ...tokens }
  }

  private async issueTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload: AccessPayload = { sub: userId, email }
    const refreshPayload: RefreshPayload = { sub: userId }
    const accessOpts: SignOptions = { expiresIn: (process.env.JWT_ACCESS_EXPIRES ?? '15m') as SignOptions['expiresIn'] }
    const refreshOpts: SignOptions = { expiresIn: (process.env.JWT_REFRESH_EXPIRES ?? '7d') as SignOptions['expiresIn'] }
    const accessToken = jwt.sign(accessPayload, process.env.JWT_ACCESS_SECRET as string, accessOpts)
    const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET as string, refreshOpts)
    return { accessToken, refreshToken }
  }

  private async persistRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS)
    return this.userRepo.update(userId, { refreshToken: hash })
  }
}
