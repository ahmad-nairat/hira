import { z } from 'zod'
import { User } from '../entities/user.entity'

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  fullName: z.string().min(1).max(255),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type RegisterDTO = z.infer<typeof RegisterSchema>
export type LoginDTO = z.infer<typeof LoginSchema>

export interface ReadUserDTO {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthResponseDTO {
  user: ReadUserDTO
  accessToken: string
  refreshToken: string
}

export function toReadUserDTO(user: User): ReadUserDTO {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
  }
}
