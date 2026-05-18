import { injectable } from 'tsyringe'
import { Response } from 'express'

export interface ISseService {
  register(userId: string, res: Response): void
  push(userId: string, data: unknown): void
  remove(userId: string, res: Response): void
}

@injectable()
export class SseService implements ISseService {
  private readonly connections = new Map<string, Set<Response>>()

  register(userId: string, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    res.write(`event: ping\ndata: ${Date.now()}\n\n`)

    let set = this.connections.get(userId)
    if (!set) {
      set = new Set()
      this.connections.set(userId, set)
    }
    set.add(res)
  }

  push(userId: string, data: unknown): void {
    const set = this.connections.get(userId)
    if (!set) return
    const payload = `data: ${JSON.stringify(data)}\n\n`
    for (const res of set) {
      try {
        res.write(payload)
      } catch {
        set.delete(res)
      }
    }
  }

  remove(userId: string, res: Response): void {
    const set = this.connections.get(userId)
    if (!set) return
    set.delete(res)
    if (set.size === 0) this.connections.delete(userId)
  }
}
