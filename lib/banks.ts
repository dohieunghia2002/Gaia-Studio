// Mã BIN (NAPAS) → tên ngân hàng để hiện ở bước chuyển khoản. Thiếu thì hiện mã BIN.
const BANKS: Record<string, string> = {
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970422': 'MB Bank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970432': 'VPBank',
  '970423': 'TPBank',
  '970403': 'Sacombank',
  '970437': 'HDBank',
  '970441': 'VIB',
  '970443': 'SHB',
  '970431': 'Eximbank',
  '970426': 'MSB',
  '970448': 'OCB',
  '970454': 'Viet Capital Bank',
  '970429': 'SCB',
  '970440': 'SeABank',
  '970449': 'LPBank',
  '970425': 'ABBANK',
  '970427': 'VietABank',
  '970428': 'Nam A Bank',
  '970400': 'Saigonbank',
  '970409': 'Bac A Bank',
  '970412': 'PVcomBank',
  '970419': 'NCB',
  '970433': 'Vietbank',
  '970438': 'BaoViet Bank',
  '970452': 'KienlongBank',
};

export function bankName(bin: string | null | undefined): string | null {
  if (!bin) return null;
  return BANKS[bin] ?? `Ngân hàng (BIN ${bin})`;
}
