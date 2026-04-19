import { SessionUser } from '../app/shared/models/profile';

interface TelegramSendMessagePayload {
  chat_id: string;
  text: string;
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
}

export class TelegramNotifier {
  private readonly token = process.env['TELEGRAM_BOT_TOKEN']?.trim() ?? '';
  private readonly defaultChatId = process.env['TELEGRAM_CHAT_ID']?.trim() ?? '';
  private readonly feedbackChatId = process.env['TELEGRAM_FEEDBACK_CHAT_ID']?.trim() ?? '';

  isConfigured(): boolean {
    return Boolean(this.token && this.defaultChatId);
  }

  async sendTeacherChangeRequest(user: SessionUser, teacherId: string, message: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const lines = [
      'Teacher change request',
      `Student: ${user.name} (${user.email})`,
      `Student ID: ${user.id}`,
      `Current teacher ID: ${user.teacherId ?? 'not-selected'}`,
      `Requested teacher ID: ${teacherId}`,
      `Role: ${user.role}`,
      `Message: ${message || 'No comment provided.'}`,
    ];

    await this.sendMessage(this.defaultChatId, lines.join('\n'));
  }

  async sendFeedback(user: SessionUser | null, message: string): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }

    const lines = [
      'Project feedback',
      user ? `From: ${user.name} (${user.email})` : 'From: guest',
      user ? `User ID: ${user.id}` : 'User ID: anonymous',
      `Message: ${message}`,
    ];

    await this.sendMessage(this.feedbackChatId || this.defaultChatId, lines.join('\n'));
  }

  private async sendMessage(chatId: string, text: string): Promise<void> {
    if (!chatId) {
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      } satisfies TelegramSendMessagePayload),
    });

    const body = (await response.json().catch(() => null)) as TelegramApiResponse | null;

    if (!response.ok || !body?.ok) {
      throw new Error(body?.description || `Telegram notification failed with status ${response.status}.`);
    }
  }
}
