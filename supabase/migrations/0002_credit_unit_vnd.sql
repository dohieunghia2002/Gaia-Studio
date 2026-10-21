-- GAIA Studio: đổi đơn vị credit (21/10/2026).
-- Trước: 1 credit = 100đ (1.000đ = 10 credit). Sau: 1 credit = 1đ (1.000đ = 1.000 credit).
-- Nhân mọi số credit đã lưu lên 100 lần để giá trị bằng tiền không đổi (vd. 278 credit cũ → 27.800 credit).
--
-- Chạy trong Supabase → SQL Editor TRƯỚC khi chạy code mới (VND_PER_CREDIT = 1 trong lib/topup-rules.ts),
-- và lúc không có ai đang dùng GAIA.
-- Chạy lại lần nữa cũng không sao: bảng gaia_migrations ghi lại là đã đổi, lần sau bỏ qua.
-- Project mới thì chạy 0001 rồi 0002 như bình thường (bảng rỗng, không có gì để nhân).

create table if not exists public.gaia_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
-- Bật RLS, không có policy: người dùng không đọc được qua API.
alter table public.gaia_migrations enable row level security;

do $$
begin
  if exists (select 1 from public.gaia_migrations where name = '0002_credit_unit_vnd') then
    raise notice 'Đơn vị credit đã được đổi trước đó, bỏ qua.';
    return;
  end if;

  -- Chặn mọi thay đổi credit trong lúc đổi (các hàm gaia_* phải chờ tới khi xong).
  lock table public.payments, public.generations, public.credit_lots, public.credit_allocations, public.credit_ledger
    in exclusive mode;

  update public.payments set credits = credits * 100, bonus_credits = bonus_credits * 100;
  update public.generations set credits = credits * 100, refunded_credits = refunded_credits * 100
    where credits > 0 or refunded_credits > 0;
  update public.credit_lots set amount = amount * 100, remaining = remaining * 100;
  update public.credit_allocations set amount = amount * 100 where amount > 0;
  update public.credit_ledger set delta = delta * 100, balance_after = balance_after * 100;

  insert into public.gaia_migrations (name) values ('0002_credit_unit_vnd');
end;
$$;
