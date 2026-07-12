// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationEngine {
  private readonly logger = new Logger(NotificationEngine.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Internal dispatcher for resolving templates and sending notifications
   */
  async dispatch(templateKey: string, recipientId: string, contextPayload: any) {
    this.logger.log(`Dispatching notification: ${templateKey} to ${recipientId}`);
    
    // 1. Fetch Template
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { templateKey }
    });

    if (!template) {
      this.logger.warn(`Template not found: ${templateKey}. Skipping dispatch.`);
      return;
    }

    // 2. Resolve Template (Mocked Handlebars/Liquid parsing)
    // Example: Replace {{PO_NUMBER}} with contextPayload.poNumber
    let finalBody = template.body;
    for (const [key, value] of Object.entries(contextPayload)) {
      finalBody = finalBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    // 3. Dispatch to Channels (Mocked)
    for (const channel of template.channels) {
      this.logger.log(`[${channel}] Sending to ${recipientId}: \n${finalBody}`);
      
      // 4. Log to DB
      await this.prisma.notificationLog.create({
        data: {
          templateKey,
          recipientId,
          channel,
          status: 'SENT',
        }
      });
    }
  }
}

