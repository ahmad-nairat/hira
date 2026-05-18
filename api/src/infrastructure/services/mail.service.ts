import { injectable } from 'tsyringe'
import nodemailer, { Transporter } from 'nodemailer'

export interface IMailService {
  sendInviteEmail(to: string, token: string, orgName: string): Promise<void>
  sendOfferEmail(to: string, token: string, jobTitle: string, orgName: string): Promise<void>
  sendSuggestEmail(to: string, jobTitle: string, applyUrl: string, orgName: string): Promise<void>
  sendOfferResendEmail(to: string, token: string): Promise<void>
  sendAccessRequestNotification(adminEmail: string, applicantName: string, orgName: string): Promise<void>
}

@injectable()
export class NodemailerMailService implements IMailService {
  private readonly transporter: Transporter
  private readonly from: string
  private readonly appUrl: string

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    })
    this.from = process.env.SMTP_FROM ?? 'noreply@hira.com'
    this.appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  }

  async sendInviteEmail(to: string, token: string, orgName: string): Promise<void> {
    const link = `${this.appUrl}/invites/${token}`
    await this.send(to, `You're invited to join ${orgName} on Hira`,
      `<p>You've been invited to join <b>${orgName}</b>.</p>` +
      `<p><a href="${link}">Accept invitation</a></p>`)
  }

  async sendOfferEmail(to: string, token: string, jobTitle: string, orgName: string): Promise<void> {
    const link = `${this.appUrl}/offer/${token}`
    await this.send(to, `Your offer from ${orgName}`,
      `<p>You received an offer for <b>${jobTitle}</b> at <b>${orgName}</b>.</p>` +
      `<p><a href="${link}">View offer</a> (link expires in 24 hours)</p>`)
  }

  async sendSuggestEmail(to: string, jobTitle: string, applyUrl: string, orgName: string): Promise<void> {
    await this.send(to, `${orgName} suggests you apply for ${jobTitle}`,
      `<p>You've been suggested for the role <b>${jobTitle}</b>.</p>` +
      `<p><a href="${applyUrl}">Apply now</a></p>`)
  }

  async sendOfferResendEmail(to: string, token: string): Promise<void> {
    const link = `${this.appUrl}/offer/${token}`
    await this.send(to, 'Your offer link',
      `<p>Here's a fresh link to your offer.</p>` +
      `<p><a href="${link}">View offer</a> (link expires in 24 hours)</p>`)
  }

  async sendAccessRequestNotification(adminEmail: string, applicantName: string, orgName: string): Promise<void> {
    await this.send(adminEmail, `New access request for ${orgName}`,
      `<p><b>${applicantName}</b> has requested to join <b>${orgName}</b>.</p>` +
      `<p>Review pending requests in your admin settings.</p>`)
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html })
    } catch (err) {
      console.error('[mail] failed to send', { to, subject, err })
    }
  }
}
