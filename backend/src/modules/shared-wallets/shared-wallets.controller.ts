import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import type { Response } from 'express';
import { SharedWalletsService } from './shared-wallets.service';
import { CreateSharedWalletDto } from './dto/create-shared-wallet.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateSharedEntryDto } from './dto/create-shared-entry.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { SetMemberWalletNameDto } from './dto/set-member-wallet-name.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Register every `shared-wallets/:walletId/...` route BEFORE `GET :walletId` so Nest matches
 * the correct handler (avoids 404 / wrong handler on some setups).
 */
@Controller('shared-wallets')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class SharedWalletsController {
  constructor(private readonly sharedWalletsService: SharedWalletsService) {}

  @Public()
  @Get('invites/preview')
  previewInvite(@Query('token') token: string) {
    return this.sharedWalletsService.previewInvite(token || '');
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateSharedWalletDto) {
    return this.sharedWalletsService.createWallet(user._id.toString(), dto);
  }

  @Get()
  list(@CurrentUser() user: any) {
    return this.sharedWalletsService.listWalletsForUser(user._id.toString());
  }

  @Post('invites/accept')
  accept(@CurrentUser() user: any, @Body() dto: AcceptInviteDto) {
    return this.sharedWalletsService.acceptInvite(user._id.toString(), user.email, dto.token);
  }

  @Post(':walletId/invite')
  invite(@CurrentUser() user: any, @Param('walletId') walletId: string, @Body() dto: InviteMemberDto) {
    return this.sharedWalletsService.inviteMember(walletId, user._id.toString(), dto);
  }

  /** Display name in this wallet only (owner). Body: { "displayName": "..." } — use "" to reset to FinTrack name. */
  @Patch(':walletId/members/:memberId/name')
  patchMemberDisplayName(
    @CurrentUser() user: any,
    @Param('walletId') walletId: string,
    @Param('memberId') memberId: string,
    @Body() dto: SetMemberWalletNameDto,
  ) {
    return this.sharedWalletsService.updateMemberDisplayName(walletId, user._id.toString(), memberId, {
      displayName: dto.displayName,
    });
  }

  @Patch(':walletId/members/:memberId/role')
  patchMemberRole(
    @CurrentUser() user: any,
    @Param('walletId') walletId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.sharedWalletsService.updateMemberRole(walletId, user._id.toString(), memberId, dto);
  }

  @Delete(':walletId/members/:memberId')
  removeMember(@CurrentUser() user: any, @Param('walletId') walletId: string, @Param('memberId') memberId: string) {
    return this.sharedWalletsService.removeMember(walletId, user._id.toString(), memberId);
  }

  @Get(':walletId/entries')
  entries(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.listEntries(walletId, user._id.toString());
  }

  @Post(':walletId/entries')
  createEntry(@CurrentUser() user: any, @Param('walletId') walletId: string, @Body() dto: CreateSharedEntryDto) {
    return this.sharedWalletsService.createEntry(walletId, user._id.toString(), dto);
  }

  @Get(':walletId/summary')
  summary(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.getSummary(walletId, user._id.toString());
  }

  @Get(':walletId/report')
  report(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.getDetailReport(walletId, user._id.toString());
  }

  @Get(':walletId/report/pdf')
  async reportPdf(@CurrentUser() user: any, @Param('walletId') walletId: string, @Res() res: Response) {
    return this.sendReportPdf(user, walletId, res);
  }

  /** Alias without a second dot segment (some setups only match this pattern). */
  @Get(':walletId/download-report')
  async reportPdfDownload(@CurrentUser() user: any, @Param('walletId') walletId: string, @Res() res: Response) {
    return this.sendReportPdf(user, walletId, res);
  }

  private async sendReportPdf(user: any, walletId: string, res: Response) {
    const buffer = await this.sharedWalletsService.exportReportPdf(walletId, user._id.toString());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="shared-wallet-report.pdf"');
    res.send(buffer);
  }

  @Get(':walletId/balances')
  balances(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.getBalances(walletId, user._id.toString());
  }

  /** Same data as /balances — alternate path if /balances is not routed in your environment. */
  @Get(':walletId/settlement-balances')
  settlementBalances(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.getBalances(walletId, user._id.toString());
  }

  @Get(':walletId/settlement-hints')
  hints(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.getSettlementHints(walletId, user._id.toString());
  }

  @Get(':walletId/settlements')
  settlements(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.listSettlements(walletId, user._id.toString());
  }

  @Post(':walletId/settlements')
  createSettlement(@CurrentUser() user: any, @Param('walletId') walletId: string, @Body() dto: CreateSettlementDto) {
    return this.sharedWalletsService.createSettlement(walletId, user._id.toString(), dto);
  }

  @Get(':walletId')
  detail(@CurrentUser() user: any, @Param('walletId') walletId: string) {
    return this.sharedWalletsService.getWalletDetail(walletId, user._id.toString());
  }
}
