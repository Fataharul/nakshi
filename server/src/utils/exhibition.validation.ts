import { z } from 'zod';

export type VipScheduleStatus = 'NOT_CONFIGURED' | 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED';

/**
 * Computes real-time VIP viewing window status based on server timestamp.
 */
export function computeVipStatus(
  now: Date,
  vipStartTime: Date | string | null | undefined,
  vipEndTime: Date | string | null | undefined
): VipScheduleStatus {
  if (!vipStartTime || !vipEndTime) {
    return 'NOT_CONFIGURED';
  }

  const start = new Date(vipStartTime);
  const end = new Date(vipEndTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'NOT_CONFIGURED';
  }

  const currentTime = now.getTime();
  if (currentTime < start.getTime()) {
    return 'SCHEDULED';
  } else if (currentTime >= start.getTime() && currentTime <= end.getTime()) {
    return 'ACTIVE';
  } else {
    return 'CONCLUDED';
  }
}

/**
 * Formats a human-readable duration summary for the VIP viewing window.
 */
export function formatVipDuration(
  vipStartTime: Date | string | null | undefined,
  vipEndTime: Date | string | null | undefined
): string | null {
  if (!vipStartTime || !vipEndTime) return null;

  const start = new Date(vipStartTime);
  const end = new Date(vipEndTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;

  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} preview`;
  }

  const days = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (remainingHours === 0) {
    return `${days} day${days === 1 ? '' : 's'} preview (${diffHours}h)`;
  }

  return `${days}d ${remainingHours}h preview (${diffHours}h)`;
}

/**
 * Schema for configuring / updating VIP viewing schedule.
 */
export const configureVipScheduleSchema = z
  .object({
    isVipEnabled: z.boolean(),
    vipStartTime: z.string().nullable().optional(),
    vipEndTime: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isVipEnabled) {
      if (!data.vipStartTime || data.vipStartTime.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VIP preview start time is required when VIP access is enabled',
          path: ['vipStartTime'],
        });
      } else {
        const start = new Date(data.vipStartTime);
        if (isNaN(start.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid VIP start time format',
            path: ['vipStartTime'],
          });
        }
      }

      if (!data.vipEndTime || data.vipEndTime.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VIP preview end time is required when VIP access is enabled',
          path: ['vipEndTime'],
        });
      } else {
        const end = new Date(data.vipEndTime);
        if (isNaN(end.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid VIP end time format',
            path: ['vipEndTime'],
          });
        }
      }

      if (
        data.vipStartTime &&
        data.vipEndTime &&
        !isNaN(new Date(data.vipStartTime).getTime()) &&
        !isNaN(new Date(data.vipEndTime).getTime())
      ) {
        const start = new Date(data.vipStartTime);
        const end = new Date(data.vipEndTime);
        if (end <= start) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'VIP viewing end time must be after VIP start time',
            path: ['vipEndTime'],
          });
        }
      }
    }
  });

export type ConfigureVipScheduleInput = z.infer<typeof configureVipScheduleSchema>;

/**
 * Schema for creating a virtual exhibition with optional VIP viewing schedule.
 */
export const createExhibitionSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title cannot exceed 120 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters').max(3000, 'Description cannot exceed 3000 characters'),
    bannerUrl: z.string().url('Invalid banner URL format').optional().or(z.literal('')),
    ticketPrice: z
      .coerce
      .number()
      .min(0, 'Ticket price cannot be negative')
      .max(1000000, 'Ticket price cannot exceed 1,000,000 credits')
      .default(0.0),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid exhibition start time format',
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid exhibition end time format',
    }),
    isVipEnabled: z.boolean().optional().default(false),
    vipStartTime: z.string().nullable().optional(),
    vipEndTime: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Exhibition end time must be after start time',
        path: ['endTime'],
      });
    }

    if (data.isVipEnabled) {
      if (!data.vipStartTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VIP start time is required when VIP viewing is enabled',
          path: ['vipStartTime'],
        });
      }
      if (!data.vipEndTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'VIP end time is required when VIP viewing is enabled',
          path: ['vipEndTime'],
        });
      }
      if (data.vipStartTime && data.vipEndTime) {
        const vipStart = new Date(data.vipStartTime);
        const vipEnd = new Date(data.vipEndTime);
        if (vipEnd <= vipStart) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'VIP viewing end time must be after VIP start time',
            path: ['vipEndTime'],
          });
        }
      }
    }
  });

export type CreateExhibitionInput = z.infer<typeof createExhibitionSchema>;

export type AccessRestrictionReason =
  | 'NO_TICKET'
  | 'VIP_NOT_CONFIGURED'
  | 'VIP_NOT_STARTED'
  | 'VIP_PREVIEW_ONLY'
  | 'VIP_CONCLUDED'
  | 'EXHIBITION_NOT_STARTED'
  | 'EXHIBITION_ENDED';

export interface AccessEvaluationResult {
  allowed: boolean;
  accessType?: 'ORGANIZER' | 'VIP' | 'GENERAL';
  reason?: AccessRestrictionReason;
  message?: string;
}

/**
 * Generates an exhibition ticket token conforming to the format NK-EXH-YYYY-XXXX.
 */
export function generateTicketToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `NK-EXH-${year}-${randomPart}`;
}

/**
 * Evaluates whether a user can enter an exhibition at the given timestamp.
 * Enforces strict VIP window bounds and ticket privileges.
 */
export function evaluateExhibitionAccess(
  now: Date,
  exhibition: {
    startTime: Date | string;
    endTime: Date | string;
    vipStartTime?: Date | string | null;
    vipEndTime?: Date | string | null;
    organizerId: string;
  },
  user: { id: string; role: string },
  ticket?: { id: string; isVip: boolean; ticketToken: string } | null
): AccessEvaluationResult {
  // 1. Organizer or Admin bypass: always granted curatorial access
  if (user.role === 'ADMIN' || user.id === exhibition.organizerId) {
    return {
      allowed: true,
      accessType: 'ORGANIZER',
    };
  }

  // 2. Buyer/Visitor ticket check
  if (!ticket) {
    return {
      allowed: false,
      reason: 'NO_TICKET',
      message: 'Admission ticket required to enter this virtual exhibition.',
    };
  }

  const currentTime = now.getTime();
  const startTime = new Date(exhibition.startTime).getTime();
  const endTime = new Date(exhibition.endTime).getTime();
  const vipStartTime = exhibition.vipStartTime ? new Date(exhibition.vipStartTime).getTime() : null;
  const vipEndTime = exhibition.vipEndTime ? new Date(exhibition.vipEndTime).getTime() : null;

  // 3. If exhibition has concluded overall
  if (currentTime > endTime) {
    return {
      allowed: false,
      reason: 'EXHIBITION_ENDED',
      message: 'This virtual exhibition has concluded.',
    };
  }

  // 4. Ticket is VIP
  if (ticket.isVip) {
    if (!vipStartTime || !vipEndTime) {
      // Exhibition does not have a VIP window configured; falls back to standard exhibition hours
      if (currentTime < startTime) {
        return {
          allowed: false,
          reason: 'EXHIBITION_NOT_STARTED',
          message: 'Virtual exhibition has not opened yet.',
        };
      }
      return { allowed: true, accessType: 'GENERAL' };
    }

    if (currentTime < vipStartTime) {
      return {
        allowed: false,
        reason: 'VIP_NOT_STARTED',
        message: 'VIP viewing window has not commenced yet.',
      };
    }

    if (currentTime >= vipStartTime && currentTime <= vipEndTime) {
      return {
        allowed: true,
        accessType: 'VIP',
      };
    }

    // After VIP end: if general public is open, VIP pass allows entry as well
    if (currentTime >= startTime && currentTime <= endTime) {
      return {
        allowed: true,
        accessType: 'GENERAL',
      };
    }

    // If currentTime is between vipEndTime and startTime
    return {
      allowed: false,
      reason: 'VIP_CONCLUDED',
      message: 'VIP viewing window has concluded. General admission opens soon.',
    };
  }

  // 5. Standard Ticket
  if (currentTime < startTime) {
    // If currently inside an active VIP preview window
    if (vipStartTime && vipEndTime && currentTime >= vipStartTime && currentTime <= vipEndTime) {
      return {
        allowed: false,
        reason: 'VIP_PREVIEW_ONLY',
        message: 'General admission is not open yet. Exhibition is currently in exclusive VIP preview.',
      };
    }

    return {
      allowed: false,
      reason: 'EXHIBITION_NOT_STARTED',
      message: 'General admission has not opened yet.',
    };
  }

  return {
    allowed: true,
    accessType: 'GENERAL',
  };
}

export const purchaseTicketSchema = z.object({
  isVip: z.boolean().default(false),
});

export type PurchaseTicketInput = z.infer<typeof purchaseTicketSchema>;

export const enterExhibitionSchema = z.object({
  ticketToken: z.string().optional(),
  simulatedTime: z.string().optional(),
});

export type EnterExhibitionInput = z.infer<typeof enterExhibitionSchema>;

