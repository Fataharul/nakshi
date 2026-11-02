import { describe, it, expect } from 'vitest';
import {
  evaluateExhibitionAccess,
  generateTicketToken,
} from '../../src/utils/exhibition.validation';

describe('Exhibition Access & VIP Timestamp Restriction Unit Tests', () => {
  const baseExhibition = {
    organizerId: 'organizer-123',
    startTime: '2026-12-05T10:00:00.000Z',
    endTime: '2026-12-20T18:00:00.000Z',
    vipStartTime: '2026-12-03T10:00:00.000Z',
    vipEndTime: '2026-12-05T09:59:59.000Z',
  };

  const buyerUser = { id: 'buyer-456', role: 'BUYER' };
  const organizerUser = { id: 'organizer-123', role: 'ORGANIZER' };
  const otherOrganizerUser = { id: 'organizer-999', role: 'ORGANIZER' };
  const adminUser = { id: 'admin-001', role: 'ADMIN' };

  const vipTicket = { id: 'ticket-vip-1', isVip: true, ticketToken: 'NK-EXH-2026-V1P1' };
  const standardTicket = { id: 'ticket-std-1', isVip: false, ticketToken: 'NK-EXH-2026-STD1' };

  describe('generateTicketToken', () => {
    it('generates ticket token in NK-EXH-YYYY-XXXX format', () => {
      const token = generateTicketToken();
      expect(token).toMatch(/^NK-EXH-\d{4}-[A-Z0-9]{4}$/);
    });

    it('generates distinct tokens on subsequent calls', () => {
      const tokenA = generateTicketToken();
      const tokenB = generateTicketToken();
      expect(tokenA).not.toBe(tokenB);
    });
  });

  describe('Curator and Admin Access Override', () => {
    it('always grants access to the exhibition creator organizer at any timestamp', () => {
      const wayBefore = new Date('2026-11-01T00:00:00.000Z');
      const res = evaluateExhibitionAccess(wayBefore, baseExhibition, organizerUser, null);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('ORGANIZER');
    });

    it('always grants access to an ADMIN at any timestamp without ticket', () => {
      const afterClosing = new Date('2027-01-01T00:00:00.000Z');
      const res = evaluateExhibitionAccess(afterClosing, baseExhibition, adminUser, null);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('ORGANIZER');
    });

    it('does not grant curator bypass to a non-owner organizer', () => {
      const duringVip = new Date('2026-12-04T12:00:00.000Z');
      const res = evaluateExhibitionAccess(duringVip, baseExhibition, otherOrganizerUser, null);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('NO_TICKET');
    });
  });

  describe('Ticket Requirement', () => {
    it('rejects visitor with no ticket', () => {
      const duringPublic = new Date('2026-12-10T12:00:00.000Z');
      const res = evaluateExhibitionAccess(duringPublic, baseExhibition, buyerUser, null);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('NO_TICKET');
    });
  });

  describe('VIP Ticket Access Window Gating', () => {
    it('rejects VIP ticket holder when current time is before vipStartTime (VIP_NOT_STARTED)', () => {
      const beforeVip = new Date('2026-12-02T12:00:00.000Z');
      const res = evaluateExhibitionAccess(beforeVip, baseExhibition, buyerUser, vipTicket);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('VIP_NOT_STARTED');
      expect(res.message).toContain('VIP viewing window has not commenced yet');
    });

    it('grants VIP access when current time is within [vipStartTime, vipEndTime]', () => {
      const duringVip = new Date('2026-12-04T12:00:00.000Z');
      const res = evaluateExhibitionAccess(duringVip, baseExhibition, buyerUser, vipTicket);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('VIP');
    });

    it('grants VIP access at exact vipStartTime boundary', () => {
      const exactStart = new Date(baseExhibition.vipStartTime);
      const res = evaluateExhibitionAccess(exactStart, baseExhibition, buyerUser, vipTicket);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('VIP');
    });

    it('grants VIP access at exact vipEndTime boundary', () => {
      const exactEnd = new Date(baseExhibition.vipEndTime);
      const res = evaluateExhibitionAccess(exactEnd, baseExhibition, buyerUser, vipTicket);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('VIP');
    });

    it('grants VIP ticket holder general access during public exhibition hours', () => {
      const duringPublic = new Date('2026-12-10T12:00:00.000Z');
      const res = evaluateExhibitionAccess(duringPublic, baseExhibition, buyerUser, vipTicket);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('GENERAL');
    });

    it('rejects VIP ticket holder when overall exhibition has concluded (EXHIBITION_ENDED)', () => {
      const afterEnd = new Date('2026-12-21T12:00:00.000Z');
      const res = evaluateExhibitionAccess(afterEnd, baseExhibition, buyerUser, vipTicket);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('EXHIBITION_ENDED');
    });
  });

  describe('Standard Ticket Access Restriction during VIP Hours', () => {
    it('rejects standard ticket holder during VIP preview before public opening (VIP_PREVIEW_ONLY)', () => {
      const duringVip = new Date('2026-12-04T12:00:00.000Z');
      const res = evaluateExhibitionAccess(duringVip, baseExhibition, buyerUser, standardTicket);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('VIP_PREVIEW_ONLY');
      expect(res.message).toContain('exclusive VIP preview');
    });

    it('rejects standard ticket holder before both VIP and public opening (EXHIBITION_NOT_STARTED)', () => {
      const wayBefore = new Date('2026-11-20T12:00:00.000Z');
      const res = evaluateExhibitionAccess(wayBefore, baseExhibition, buyerUser, standardTicket);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('EXHIBITION_NOT_STARTED');
    });

    it('grants access to standard ticket holder during public opening hours', () => {
      const duringPublic = new Date('2026-12-10T12:00:00.000Z');
      const res = evaluateExhibitionAccess(duringPublic, baseExhibition, buyerUser, standardTicket);
      expect(res.allowed).toBe(true);
      expect(res.accessType).toBe('GENERAL');
    });

    it('rejects standard ticket holder after exhibition has closed (EXHIBITION_ENDED)', () => {
      const afterEnd = new Date('2026-12-21T12:00:00.000Z');
      const res = evaluateExhibitionAccess(afterEnd, baseExhibition, buyerUser, standardTicket);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('EXHIBITION_ENDED');
    });
  });
});
