import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createHash, randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { SharedWallet, SharedWalletDocument } from '../../schemas/shared-wallet.schema';
import { SharedWalletMember, SharedWalletMemberDocument } from '../../schemas/shared-wallet-member.schema';
import { SharedWalletEntry, SharedWalletEntryDocument } from '../../schemas/shared-wallet-entry.schema';
import {
  SharedWalletSettlement,
  SharedWalletSettlementDocument,
} from '../../schemas/shared-wallet-settlement.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSharedWalletDto } from './dto/create-shared-wallet.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateSharedEntryDto } from './dto/create-shared-entry.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateMemberDisplayNameDto } from './dto/update-member-display-name.dto';
import { sanitizeHtml } from '../../common/utils/sanitize';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BAL_EPS = 0.01;

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateInviteToken(): string {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class SharedWalletsService {
  private readonly logger = new Logger(SharedWalletsService.name);

  constructor(
    @InjectModel(SharedWallet.name) private walletModel: Model<SharedWalletDocument>,
    @InjectModel(SharedWalletMember.name) private memberModel: Model<SharedWalletMemberDocument>,
    @InjectModel(SharedWalletEntry.name) private entryModel: Model<SharedWalletEntryDocument>,
    @InjectModel(SharedWalletSettlement.name) private settlementModel: Model<SharedWalletSettlementDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private notificationsService: NotificationsService,
  ) {}

  private inviteBaseUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  }

  private async sendInviteEmail(to: string, walletName: string, inviteUrl: string): Promise<boolean> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(`SMTP not configured; invite link for ${to}: ${inviteUrl}`);
      return false;
    }
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'FinTrack <noreply@fintrack.app>',
        to,
        subject: `You're invited to shared wallet: ${sanitizeHtml(walletName)}`,
        html: `<div style="font-family:system-ui,sans-serif;padding:24px;max-width:560px">
          <h2 style="margin:0 0 12px">Shared wallet invite</h2>
          <p>You've been invited to <strong>${sanitizeHtml(walletName)}</strong> on FinTrack.</p>
          <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">Accept invite</a></p>
          <p style="color:#64748b;font-size:13px">Or copy this link:<br/><span style="word-break:break-all">${inviteUrl}</span></p>
          <p style="color:#64748b;font-size:12px">Sign in with the same Google account as this email. Link expires in 7 days.</p>
        </div>`,
      });
      return true;
    } catch (e) {
      this.logger.error(`Invite email failed: ${e}`);
      return false;
    }
  }

  async createWallet(userId: string, dto: CreateSharedWalletDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const wallet = await this.walletModel.create({
      ownerId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      description: dto.description?.trim(),
      currency: dto.currency || user.currency || 'INR',
    });
    await this.memberModel.create({
      walletId: wallet._id,
      userId: new Types.ObjectId(userId),
      email: user.email.toLowerCase(),
      role: 'owner',
      status: 'active',
    });
    return wallet;
  }

  async listWalletsForUser(userId: string) {
    const uid = new Types.ObjectId(userId);
    const memberships = await this.memberModel
      .find({ userId: uid, status: 'active' })
      .populate('walletId')
      .lean();
    return memberships.map((m: any) => ({
      membershipId: m._id,
      role: m.role,
      wallet: m.walletId,
    }));
  }

  async getWalletOrThrow(walletId: string, userId: string) {
    const wallet = await this.walletModel.findById(walletId);
    if (!wallet || !wallet.isActive) throw new NotFoundException('Wallet not found');
    const member = await this.memberModel.findOne({
      walletId: new Types.ObjectId(walletId),
      userId: new Types.ObjectId(userId),
      status: 'active',
    });
    if (!member) throw new ForbiddenException('No access to this wallet');
    return { wallet, member };
  }

  async getWalletDetail(walletId: string, userId: string) {
    const { wallet, member } = await this.getWalletOrThrow(walletId, userId);
    const members = await this.memberModel
      .find({ walletId: wallet._id, status: { $in: ['active', 'pending'] } })
      .populate('userId', 'name email avatar')
      .lean();
    return { wallet, myRole: member.role, members };
  }

  async inviteMember(walletId: string, actorUserId: string, dto: InviteMemberDto) {
    const { wallet, member } = await this.getWalletOrThrow(walletId, actorUserId);
    if (member.role !== 'owner') throw new ForbiddenException('Only the owner can invite');
    const email = dto.email.toLowerCase().trim();
    const ownerUser = await this.userModel.findById(wallet.ownerId);
    if (!ownerUser) throw new NotFoundException('Owner missing');
    if (email === ownerUser.email.toLowerCase()) {
      throw new BadRequestException('Cannot invite yourself');
    }
    const existing = await this.memberModel.findOne({
      walletId: wallet._id,
      email,
      status: { $in: ['active', 'pending'] },
    });
    if (existing?.status === 'active') throw new BadRequestException('User is already a member');
    const token = generateInviteToken();
    const tokenHash = hashInviteToken(token);
    const expires = new Date(Date.now() + INVITE_TTL_MS);
    let doc: SharedWalletMemberDocument;
    if (existing && existing.status === 'pending') {
      existing.inviteTokenHash = tokenHash;
      existing.inviteExpiresAt = expires;
      existing.role = dto.role;
      existing.invitedBy = new Types.ObjectId(actorUserId);
      await existing.save();
      doc = existing;
    } else {
      doc = await this.memberModel.create({
        walletId: wallet._id,
        email,
        role: dto.role,
        status: 'pending',
        inviteTokenHash: tokenHash,
        inviteExpiresAt: expires,
        invitedBy: new Types.ObjectId(actorUserId),
      });
    }
    const inviteUrl = `${this.inviteBaseUrl()}/shared-wallets/join?token=${encodeURIComponent(token)}`;
    const emailed = await this.sendInviteEmail(email, wallet.name, inviteUrl);
    return {
      memberId: doc._id,
      inviteUrl,
      emailSent: emailed,
      expiresAt: expires,
    };
  }

  async previewInvite(token: string) {
    if (!token || token.length < 20) return { valid: false };
    const hash = hashInviteToken(token);
    const m = await this.memberModel.findOne({ inviteTokenHash: hash, status: 'pending' }).populate('walletId');
    if (!m || !m.inviteExpiresAt || m.inviteExpiresAt < new Date()) {
      return { valid: false };
    }
    const w = m.walletId as any;
    const inviter = m.invitedBy ? await this.userModel.findById(m.invitedBy).select('name') : null;
    return {
      valid: true,
      walletName: w?.name,
      email: m.email,
      role: m.role,
      inviterName: inviter?.name || 'A FinTrack user',
    };
  }

  async acceptInvite(userId: string, userEmail: string, token: string) {
    const hash = hashInviteToken(token);
    const m = await this.memberModel.findOne({ inviteTokenHash: hash, status: 'pending' });
    if (!m || !m.inviteExpiresAt || m.inviteExpiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired invite');
    }
    if (m.email.toLowerCase() !== userEmail.toLowerCase()) {
      throw new ForbiddenException('Sign in with the invited email address (Google account)');
    }
    await this.memberModel.updateOne(
      { _id: m._id },
      {
        $set: { userId: new Types.ObjectId(userId), status: 'active' },
        $unset: { inviteTokenHash: '', inviteExpiresAt: '' },
      },
    );
    const wallet = await this.walletModel.findById(m.walletId);
    return { walletId: m.walletId, walletName: wallet?.name };
  }

  async updateMemberRole(walletId: string, actorUserId: string, memberId: string, dto: UpdateMemberRoleDto) {
    const { member: actor } = await this.getWalletOrThrow(walletId, actorUserId);
    if (actor.role !== 'owner') throw new ForbiddenException('Only owner can change roles');
    const target = await this.memberModel.findOne({
      _id: memberId,
      walletId: new Types.ObjectId(walletId),
      status: 'active',
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') throw new BadRequestException('Cannot change owner role');
    target.role = dto.role;
    await target.save();
    return target;
  }

  async removeMember(walletId: string, actorUserId: string, memberId: string) {
    const { member: actor } = await this.getWalletOrThrow(walletId, actorUserId);
    if (actor.role !== 'owner') throw new ForbiddenException('Only owner can remove members');
    const target = await this.memberModel.findOne({
      _id: memberId,
      walletId: new Types.ObjectId(walletId),
      status: 'active',
    });
    if (!target) throw new NotFoundException('Member not found');
    if (target.role === 'owner') throw new BadRequestException('Cannot remove owner');
    await this.memberModel.updateOne(
      { _id: target._id },
      { $set: { status: 'removed' }, $unset: { userId: '' } },
    );
    return { ok: true };
  }

  async updateMemberDisplayName(
    walletId: string,
    actorUserId: string,
    memberId: string,
    dto: UpdateMemberDisplayNameDto,
  ) {
    const { member: actor } = await this.getWalletOrThrow(walletId, actorUserId);
    if (actor.role !== 'owner') throw new ForbiddenException('Only the owner can set display names');
    const target = await this.memberModel.findOne({
      _id: memberId,
      walletId: new Types.ObjectId(walletId),
      status: { $in: ['active', 'pending'] },
    });
    if (!target) throw new NotFoundException('Member not found');
    if (dto.displayName === undefined) {
      return this.memberModel.findById(target._id).populate('userId', 'name email avatar').lean();
    }
    const raw = dto.displayName.trim();
    if (!raw) {
      await this.memberModel.updateOne({ _id: target._id }, { $unset: { displayName: '' } });
    } else {
      target.displayName = raw.slice(0, 80);
      await target.save();
    }
    return this.memberModel.findById(target._id).populate('userId', 'name email avatar').lean();
  }

  private canWrite(role: string) {
    return role === 'owner' || role === 'editor';
  }

  private async memberNameByUserId(walletId: Types.ObjectId): Promise<Map<string, string>> {
    const members = await this.memberModel
      .find({ walletId, status: 'active', userId: { $exists: true } })
      .populate('userId', 'name')
      .lean();
    const map = new Map<string, string>();
    for (const m of members as any[]) {
      if (m.userId?._id) {
        const uid = String(m.userId._id);
        const nm =
          typeof m.displayName === 'string' && m.displayName.trim()
            ? m.displayName.trim()
            : m.userId.name || m.email || 'Member';
        map.set(uid, nm);
      }
    }
    return map;
  }

  private applyEntryDisplayNames(e: any, nameMap: Map<string, string>) {
    const ec = e.createdByUserId;
    const ob = e.onBehalfOfUserId;
    const cId = ec?._id ? String(ec._id) : '';
    const oId = ob?._id ? String(ob._id) : '';
    return {
      ...e,
      createdByUserId: ec ? { ...ec, name: (cId && nameMap.get(cId)) || ec.name } : ec,
      onBehalfOfUserId: ob ? { ...ob, name: (oId && nameMap.get(oId)) || ob.name } : ob,
    };
  }

  private simplifyBalances(
    balance: Map<string, number>,
    names: Map<string, string>,
  ): { fromUserId: string; fromName: string; toUserId: string; toName: string; amount: number }[] {
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];
    for (const [id, v] of balance) {
      if (v < -BAL_EPS) debtors.push({ id, amount: -v });
      else if (v > BAL_EPS) creditors.push({ id, amount: v });
    }
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    let i = 0;
    let j = 0;
    const out: { fromUserId: string; fromName: string; toUserId: string; toName: string; amount: number }[] = [];
    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amount, creditors[j].amount);
      const rounded = Math.round(pay * 100) / 100;
      if (rounded >= BAL_EPS) {
        out.push({
          fromUserId: debtors[i].id,
          fromName: names.get(debtors[i].id) || 'Member',
          toUserId: creditors[j].id,
          toName: names.get(creditors[j].id) || 'Member',
          amount: rounded,
        });
      }
      debtors[i].amount -= pay;
      creditors[j].amount -= pay;
      if (debtors[i].amount < BAL_EPS) i++;
      if (creditors[j].amount < BAL_EPS) j++;
    }
    return out;
  }

  private formatPdfMoney(amount: number): string {
    const abs = Math.abs(amount);
    const formatted =
      abs >= 100000
        ? `${Math.floor(abs / 100000)},${String(Math.floor((abs % 100000) / 1000)).padStart(2, '0')},${String(Math.floor(abs % 1000)).padStart(3, '0')}`
        : abs >= 1000
          ? `${Math.floor(abs / 1000)},${String(Math.floor(abs % 1000)).padStart(3, '0')}`
          : String(Math.floor(abs));
    return `Rs. ${amount < 0 ? '-' : ''}${formatted}`;
  }

  async listEntries(walletId: string, userId: string) {
    const { wallet } = await this.getWalletOrThrow(walletId, userId);
    const nameMap = await this.memberNameByUserId(wallet._id);
    const rows = await this.entryModel
      .find({ walletId: wallet._id })
      .sort({ spentAt: -1 })
      .limit(500)
      .populate('createdByUserId', 'name email avatar')
      .populate('onBehalfOfUserId', 'name email avatar')
      .lean();
    return rows.map((e: any) => this.applyEntryDisplayNames(e, nameMap));
  }

  async createEntry(walletId: string, userId: string, dto: CreateSharedEntryDto) {
    const { member } = await this.getWalletOrThrow(walletId, userId);
    if (!this.canWrite(member.role)) throw new ForbiddenException('Read-only members cannot add entries');
    let onBehalf: Types.ObjectId | undefined;
    if (dto.onBehalfOfUserId) {
      if (member.role !== 'owner') {
        throw new ForbiddenException('Only the wallet owner can add entries on behalf of others');
      }
      const other = await this.memberModel.findOne({
        walletId: new Types.ObjectId(walletId),
        userId: new Types.ObjectId(dto.onBehalfOfUserId),
        status: 'active',
      });
      if (!other) throw new BadRequestException('onBehalfOfUserId must be an active member');
      onBehalf = new Types.ObjectId(dto.onBehalfOfUserId);
    }
    const entry = await this.entryModel.create({
      walletId: new Types.ObjectId(walletId),
      createdByUserId: new Types.ObjectId(userId),
      onBehalfOfUserId: onBehalf,
      amount: dto.amount,
      category: dto.category?.trim(),
      description: dto.description?.trim(),
      spentAt: new Date(dto.spentAt),
      type: dto.type || 'expense',
    });
    const wallet = await this.walletModel.findById(walletId);
    const creator = await this.userModel.findById(userId).select('name');
    const others = await this.memberModel.find({
      walletId: new Types.ObjectId(walletId),
      status: 'active',
      userId: { $exists: true, $ne: new Types.ObjectId(userId) },
    });
    const msg = `${creator?.name || 'Someone'} added ${wallet?.currency || '₹'}${dto.amount} in ${wallet?.name}`;
    for (const om of others) {
      if (om.userId) {
        await this.notificationsService.create(om.userId.toString(), {
          title: 'Shared wallet',
          message: msg,
          type: 'shared_wallet',
          metadata: { walletId, entryId: entry._id.toString() },
        });
      }
    }
    return this.entryModel
      .findById(entry._id)
      .populate('createdByUserId', 'name email avatar')
      .populate('onBehalfOfUserId', 'name email avatar');
  }

  async getSummary(walletId: string, userId: string) {
    await this.getWalletOrThrow(walletId, userId);
    const wallet = await this.walletModel.findById(walletId);
    const entries = await this.entryModel.find({ walletId: new Types.ObjectId(walletId) }).lean();
    const byUser = new Map<string, { total: number; count: number; name: string }>();
    const members = await this.memberModel
      .find({ walletId: new Types.ObjectId(walletId), status: 'active', userId: { $exists: true } })
      .populate('userId', 'name')
      .lean();
    const uidToName = new Map<string, string>();
    for (const m of members as any[]) {
      if (m.userId?._id) {
        const nm =
          typeof m.displayName === 'string' && m.displayName.trim()
            ? m.displayName.trim()
            : m.userId.name || m.email || 'Member';
        uidToName.set(String(m.userId._id), nm);
      }
    }
    let expenseTotal = 0;
    for (const e of entries) {
      if (e.type !== 'expense') continue;
      expenseTotal += e.amount;
      const aid = String(e.onBehalfOfUserId || e.createdByUserId);
      const name = uidToName.get(aid) || 'Member';
      const cur = byUser.get(aid) || { total: 0, count: 0, name };
      cur.total += e.amount;
      cur.count += 1;
      cur.name = name;
      byUser.set(aid, cur);
    }
    const pie = [...byUser.entries()].map(([userIdKey, v]) => ({
      userId: userIdKey,
      name: v.name,
      total: v.total,
      count: v.count,
    }));
    pie.sort((a, b) => b.total - a.total);
    const min = pie.length ? pie[pie.length - 1] : null;
    const max = pie.length ? pie[0] : null;
    return {
      currency: wallet?.currency || 'INR',
      expenseTotal,
      entryCount: entries.filter((e) => e.type === 'expense').length,
      byUser: pie,
      highestSpender: max,
      lowestSpender: min && pie.length > 1 ? min : max,
    };
  }

  async getDetailReport(walletId: string, userId: string) {
    await this.getWalletOrThrow(walletId, userId);
    const wOid = new Types.ObjectId(walletId);
    const nameMap = await this.memberNameByUserId(wOid);
    const entries = await this.entryModel
      .find({ walletId: wOid, type: 'expense' })
      .sort({ spentAt: -1 })
      .populate('createdByUserId', 'name email')
      .populate('onBehalfOfUserId', 'name email')
      .lean();
    return entries.map((e: any) => {
      const createdId = e.createdByUserId?._id ? String(e.createdByUserId._id) : '';
      const attrId = e.onBehalfOfUserId?._id
        ? String(e.onBehalfOfUserId._id)
        : createdId;
      const paidByName = (createdId && nameMap.get(createdId)) || e.createdByUserId?.name || '—';
      const attributedName =
        (attrId && nameMap.get(attrId)) ||
        e.onBehalfOfUserId?.name ||
        e.createdByUserId?.name ||
        '—';
      return {
        _id: e._id,
        amount: e.amount,
        category: e.category,
        description: e.description,
        spentAt: e.spentAt,
        createdBy: e.createdByUserId ? { ...e.createdByUserId, name: paidByName } : null,
        onBehalfOf: e.onBehalfOfUserId
          ? {
              ...e.onBehalfOfUserId,
              name: nameMap.get(String(e.onBehalfOfUserId._id)) || e.onBehalfOfUserId.name,
            }
          : null,
        attributedTo: {
          _id: e.onBehalfOfUserId?._id || e.createdByUserId?._id,
          name: attributedName,
        },
      };
    });
  }

  async listSettlements(walletId: string, userId: string) {
    await this.getWalletOrThrow(walletId, userId);
    return this.settlementModel
      .find({ walletId: new Types.ObjectId(walletId) })
      .sort({ createdAt: -1 })
      .populate('fromUserId', 'name email avatar')
      .populate('toUserId', 'name email avatar')
      .populate('recordedByUserId', 'name')
      .lean();
  }

  async createSettlement(walletId: string, userId: string, dto: CreateSettlementDto) {
    const { member } = await this.getWalletOrThrow(walletId, userId);
    if (!this.canWrite(member.role)) throw new ForbiddenException('Read-only members cannot record settlements');
    if (dto.fromUserId === dto.toUserId) throw new BadRequestException('From and to must differ');
    for (const uid of [dto.fromUserId, dto.toUserId]) {
      const m = await this.memberModel.findOne({
        walletId: new Types.ObjectId(walletId),
        userId: new Types.ObjectId(uid),
        status: 'active',
      });
      if (!m) throw new BadRequestException('Both users must be active members');
    }
    return this.settlementModel.create({
      walletId: new Types.ObjectId(walletId),
      fromUserId: new Types.ObjectId(dto.fromUserId),
      toUserId: new Types.ObjectId(dto.toUserId),
      amount: dto.amount,
      note: dto.note?.trim(),
      recordedByUserId: new Types.ObjectId(userId),
    });
  }

  /** Simple suggested balances: net spend share (equal split of total) vs attributed — lightweight */
  async getSettlementHints(walletId: string, userId: string) {
    const { wallet } = await this.getWalletOrThrow(walletId, userId);
    const summary = await this.getSummary(walletId, userId);
    const activeMembers = await this.memberModel.countDocuments({
      walletId: new Types.ObjectId(walletId),
      status: 'active',
      userId: { $exists: true },
    });
    const n = Math.max(activeMembers, 1);
    const fairShare = summary.expenseTotal / n;
    const hints = summary.byUser.map((row) => ({
      userId: row.userId,
      name: row.name,
      spent: row.total,
      fairShare,
      vsFairShare: row.total - fairShare,
    }));
    return { currency: wallet.currency, fairSharePerMember: fairShare, hints };
  }

  /**
   * Equal-split balances: attributed spend vs fair share, adjusted by recorded settlements.
   * suggestedTransfers: minimal set of "from pays to" to settle remaining balances.
   */
  async getBalances(walletId: string, userId: string) {
    await this.getWalletOrThrow(walletId, userId);
    const wOid = new Types.ObjectId(walletId);
    const wallet = await this.walletModel.findById(walletId);
    const nameMap = await this.memberNameByUserId(wOid);
    const activeMembers = await this.memberModel
      .find({ walletId: wOid, status: 'active', userId: { $exists: true } })
      .lean();
    const memberIds = activeMembers.map((m) => String(m.userId));
    const n = Math.max(memberIds.length, 1);
    const entries = await this.entryModel.find({ walletId: wOid, type: 'expense' }).lean();
    let total = 0;
    for (const e of entries) total += e.amount;
    const fairShare = total / n;
    const attributed = new Map<string, number>();
    for (const id of memberIds) attributed.set(id, 0);
    for (const e of entries) {
      const aid = String(e.onBehalfOfUserId || e.createdByUserId);
      if (attributed.has(aid)) attributed.set(aid, (attributed.get(aid) || 0) + e.amount);
    }
    const balance = new Map<string, number>();
    for (const id of memberIds) {
      balance.set(id, (attributed.get(id) || 0) - fairShare);
    }
    const settlements = await this.settlementModel.find({ walletId: wOid }).lean();
    for (const s of settlements) {
      const from = String(s.fromUserId);
      const to = String(s.toUserId);
      balance.set(from, (balance.get(from) || 0) + s.amount);
      balance.set(to, (balance.get(to) || 0) - s.amount);
    }
    const suggestedTransfers = this.simplifyBalances(balance, nameMap);
    const members = memberIds.map((uid) => ({
      userId: uid,
      name: nameMap.get(uid) || 'Member',
      attributedSpend: attributed.get(uid) || 0,
      fairShare,
      netBeforeSettlements: (attributed.get(uid) || 0) - fairShare,
      netAfterSettlements: Math.round((balance.get(uid) || 0) * 100) / 100,
    }));
    return {
      currency: wallet?.currency || 'INR',
      fairSharePerMember: Math.round(fairShare * 100) / 100,
      members,
      suggestedTransfers,
    };
  }

  async exportReportPdf(walletId: string, userId: string): Promise<Buffer> {
    await this.getWalletOrThrow(walletId, userId);
    const wallet = await this.walletModel.findById(walletId);
    if (!wallet) throw new NotFoundException('Wallet not found');
    const summary = await this.getSummary(walletId, userId);
    const balances = await this.getBalances(walletId, userId);
    const report = await this.getDetailReport(walletId, userId);
    const pageW = 595.28;
    const margin = 40;
    const contentW = pageW - margin * 2;
    const walletTitle = String(wallet.name || 'Wallet').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').slice(0, 80);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin, size: 'A4' });
        const buffers: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        doc.rect(0, 0, pageW, 90).fill('#4f46e5');
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#ffffff').text('FinTrack', margin, 25);
        doc.font('Helvetica').fontSize(10).fillColor('#c7d2fe').text('Shared wallet — detail report', margin, 52);
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#c7d2fe')
          .text(walletTitle, margin, 66, { width: contentW - 170 });
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#c7d2fe')
          .text(
            `Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            pageW - margin - 160,
            66,
            { width: 160, align: 'right' },
          );

        let y = 110;
        const cardW = (contentW - 20) / 3;
        const drawCard = (x: number, label: string, value: string, color: string) => {
          doc.rect(x, y, cardW, 50).lineWidth(0.5).fillAndStroke('#f9fafb', '#e5e7eb');
          doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(label, x + 10, y + 10, { width: cardW - 20 });
          doc.font('Helvetica-Bold').fontSize(12).fillColor(color).text(value, x + 10, y + 26, { width: cardW - 20 });
        };
        drawCard(margin, 'Group expenses', this.formatPdfMoney(summary.expenseTotal), '#dc2626');
        drawCard(margin + cardW + 10, 'Expense entries', String(summary.entryCount), '#374151');
        drawCard(
          margin + (cardW + 10) * 2,
          'Fair share / person',
          this.formatPdfMoney(balances.fairSharePerMember),
          '#4f46e5',
        );
        y += 65;

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Who should pay whom (after settlements)', margin, y);
        y += 16;
        if (balances.suggestedTransfers.length === 0) {
          doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text('All settled — no remaining transfers.', margin, y);
          y += 20;
        } else {
          const tCols = [
            { header: 'Pays', width: contentW * 0.38 },
            { header: 'Receives', width: contentW * 0.38 },
            { header: 'Amount', width: contentW * 0.24 },
          ];
          const rowH = 18;
          doc.rect(margin, y, contentW, rowH + 2).fill('#f3f4f6');
          let x = margin;
          for (const col of tCols) {
            doc
              .font('Helvetica-Bold')
              .fontSize(7.5)
              .fillColor('#374151')
              .text(col.header.toUpperCase(), x + 5, y + 5, { width: col.width - 10 });
            x += col.width;
          }
          y += rowH + 2;
          let ti = 0;
          for (const t of balances.suggestedTransfers) {
            if (y > 740) {
              doc.addPage();
              y = 40;
            }
            if (ti % 2 === 1) doc.rect(margin, y, contentW, rowH).fill('#fafafa');
            doc.rect(margin, y, contentW, rowH).lineWidth(0.3).stroke('#e5e7eb');
            doc.font('Helvetica').fontSize(8).fillColor('#1f2937').text(t.fromName, margin + 5, y + 5, { width: tCols[0].width - 10 });
            doc
              .font('Helvetica')
              .fontSize(8)
              .fillColor('#1f2937')
              .text(t.toName, margin + tCols[0].width + 5, y + 5, { width: tCols[1].width - 10 });
            doc
              .font('Helvetica-Bold')
              .fontSize(8)
              .fillColor('#059669')
              .text(this.formatPdfMoney(t.amount), margin + tCols[0].width + tCols[1].width + 5, y + 5, {
                width: tCols[2].width - 10,
              });
            y += rowH;
            ti++;
          }
        }

        y += 14;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('Member totals (attributed expenses)', margin, y);
        y += 14;
        const mCols = [
          { header: 'Member', width: contentW * 0.45 },
          { header: 'Attributed', width: contentW * 0.27 },
          { header: 'Net balance', width: contentW * 0.28 },
        ];
        const mh = 16;
        doc.rect(margin, y, contentW, mh + 2).fill('#f3f4f6');
        let mx = margin;
        for (const col of mCols) {
          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#374151')
            .text(col.header.toUpperCase(), mx + 5, y + 4, { width: col.width - 10 });
          mx += col.width;
        }
        y += mh + 2;
        let mi = 0;
        for (const m of balances.members) {
          if (y > 740) {
            doc.addPage();
            y = 40;
          }
          if (mi % 2 === 1) doc.rect(margin, y, contentW, mh).fill('#fafafa');
          doc.rect(margin, y, contentW, mh).lineWidth(0.3).stroke('#e5e7eb');
          doc.font('Helvetica').fontSize(8).fillColor('#1f2937').text(m.name, margin + 5, y + 4, { width: mCols[0].width - 10 });
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor('#dc2626')
            .text(this.formatPdfMoney(m.attributedSpend), margin + mCols[0].width + 5, y + 4, { width: mCols[1].width - 10 });
          const net = m.netAfterSettlements;
          const netColor = net > BAL_EPS ? '#059669' : net < -BAL_EPS ? '#dc2626' : '#6b7280';
          doc
            .font('Helvetica-Bold')
            .fontSize(8)
            .fillColor(netColor)
            .text(this.formatPdfMoney(net), margin + mCols[0].width + mCols[1].width + 5, y + 4, { width: mCols[2].width - 10 });
          y += mh;
          mi++;
        }

        y += 18;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text('All expense lines', margin, y);
        y += 14;
        const cols = [
          { header: 'Date', width: 62 },
          { header: 'Amount', width: 62 },
          { header: 'Paid by', width: 78 },
          { header: 'Attributed', width: 78 },
          { header: 'Category / note', width: contentW - 62 * 2 - 78 * 2 },
        ];
        const rowH = 18;
        const drawTableHeader = (atY: number) => {
          doc.rect(margin, atY, contentW, rowH + 2).fill('#f3f4f6');
          let cx = margin;
          for (const col of cols) {
            doc
              .font('Helvetica-Bold')
              .fontSize(7)
              .fillColor('#374151')
              .text(col.header.toUpperCase(), cx + 4, atY + 5, { width: col.width - 8 });
            cx += col.width;
          }
          return atY + rowH + 2;
        };
        y = drawTableHeader(y);
        let ri = 0;
        for (const r of report as any[]) {
          if (y > 760) {
            doc.addPage();
            y = 40;
            y = drawTableHeader(y);
          }
          if (ri % 2 === 1) doc.rect(margin, y, contentW, rowH).fill('#fafafa');
          doc.rect(margin, y, contentW, rowH).lineWidth(0.3).stroke('#e5e7eb');
          const d = new Date(r.spentAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          const desc = [r.category, r.description].filter(Boolean).join(' — ') || '—';
          const shortDesc = desc.length > 42 ? desc.slice(0, 39) + '…' : desc;
          const row = [
            d,
            this.formatPdfMoney(r.amount).replace('Rs. ', ''),
            r.createdBy?.name || '—',
            r.attributedTo?.name || '—',
            shortDesc,
          ];
          let cx = margin;
          for (let i = 0; i < cols.length; i++) {
            const color = i === 1 ? '#dc2626' : '#1f2937';
            const font = i === 1 ? 'Helvetica-Bold' : 'Helvetica';
            doc.font(font).fontSize(7).fillColor(color).text(row[i], cx + 4, y + 5, { width: cols[i].width - 8 });
            cx += cols[i].width;
          }
          y += rowH;
          ri++;
        }

        y += 16;
        if (y > 750) {
          doc.addPage();
          y = 40;
        }
        doc.moveTo(margin, y).lineTo(margin + contentW, y).lineWidth(0.3).stroke('#e5e7eb');
        y += 8;
        doc
          .font('Helvetica')
          .fontSize(7)
          .fillColor('#9ca3af')
          .text(
            'FinTrack — Shared wallet report | Equal split model. Net balance: positive = owed back; negative = owes others.',
            margin,
            y,
            { width: contentW, align: 'center' },
          );

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
