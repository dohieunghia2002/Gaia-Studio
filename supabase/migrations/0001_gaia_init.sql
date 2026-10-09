-- GAIA Studio: schema khởi tạo.
-- Chạy một lần trong Supabase → SQL Editor (hoặc `supabase db push`).
--
-- Nguyên tắc:
-- • Mọi thay đổi credit đi qua các hàm gaia_* bên dưới, chạy bằng khoá secret (service role)
--   ở server. Người dùng chỉ được ĐỌC dữ liệu của chính mình (RLS), không ghi được gì.
-- • Credit nằm trong các "lô" (credit_lots), mỗi lô hết hạn 90 ngày sau ngày nạp, tiêu lô
--   sắp hết hạn trước (FIFO). Mỗi lần trừ ghi lại đã lấy từ lô nào (credit_allocations)
--   để hoàn đúng chỗ.
-- • Mỗi lần trừ/cộng khoá theo người dùng (advisory lock) nên bấm tạo song song không trừ sai.

create extension if not exists pgcrypto;

-- ───────────────────────── Bảng ─────────────────────────

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_code bigint not null unique,
  amount_vnd integer not null check (amount_vnd >= 20000),
  credits integer not null check (credits > 0),
  bonus_credits integer not null default 0 check (bonus_credits >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'expired')),
  description text,
  payment_link_id text,
  checkout_url text,
  qr_code text,
  bank_bin text,
  account_number text,
  account_name text,
  expires_at timestamptz,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  op text not null default 'create' check (op in ('create', 'edit', 'upscale')),
  -- Phiên bản sửa/upscale của ảnh trỏ về bản gốc (root_id) và bản được sửa (source_id).
  root_id uuid references public.generations (id) on delete cascade,
  source_id uuid references public.generations (id) on delete set null,
  model text not null,
  model_name text not null,
  params jsonb not null default '{}'::jsonb,  -- ratio, resolution, duration, mode
  inputs jsonb not null default '{}'::jsonb,  -- start/end frame, references: { id, url }
  prompt text not null default '',
  prompt_sent text,                           -- prompt thực gửi (bản dịch nếu Gommo trả về)
  translator text,                            -- 'gommo' | 'claude' | null
  gommo_id text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'success', 'error')),
  url text,
  thumb_url text,
  error_message text,
  gommo_cost integer,                         -- credit Gommo thực tính (nếu Gommo báo)
  credits integer not null default 0 check (credits >= 0),
  refunded_credits integer not null default 0 check (refunded_credits >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  deleted_at timestamptz,
  check (refunded_credits <= credits)
);
create index if not exists generations_library_idx
  on public.generations (user_id, created_at desc) where root_id is null and deleted_at is null;
create index if not exists generations_root_idx on public.generations (root_id);
create index if not exists generations_running_idx
  on public.generations (user_id) where status in ('pending', 'processing');

create table if not exists public.credit_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  source text not null default 'topup' check (source in ('topup', 'refund', 'grant')),
  amount integer not null check (amount > 0),
  remaining integer not null check (remaining >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists credit_lots_user_idx on public.credit_lots (user_id, expires_at);

create table if not exists public.credit_allocations (
  generation_id uuid not null references public.generations (id) on delete cascade,
  lot_id uuid not null references public.credit_lots (id) on delete cascade,
  amount integer not null check (amount >= 0),
  primary key (generation_id, lot_id)
);

create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('topup', 'use', 'refund', 'expire')),
  delta integer not null,
  balance_after integer not null,
  title text not null,
  detail text,
  generation_id uuid references public.generations (id) on delete set null,
  payment_id uuid references public.payments (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists credit_ledger_user_idx on public.credit_ledger (user_id, id desc);

-- ───────────────────────── Hồ sơ người dùng ─────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Hàm credit ─────────────────────────

create or replace function public.gaia_lock_user(p_user uuid)
returns void
language sql
as $$
  select pg_advisory_xact_lock(hashtextextended(p_user::text, 0));
$$;

create or replace function public.gaia_current_balance(p_user uuid)
returns integer
language sql
as $$
  select coalesce(sum(remaining), 0)::integer
  from public.credit_lots
  where user_id = p_user and expires_at > now();
$$;

-- Chuyển lô đã hết hạn về 0 và ghi dòng "Credit hết hạn" vào lịch sử.
create or replace function public.gaia_expire_lots(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in
    select id, remaining, created_at
    from credit_lots
    where user_id = p_user and expires_at <= now() and remaining > 0
    order by expires_at
    for update
  loop
    update credit_lots set remaining = 0 where id = r.id;
    insert into credit_ledger (user_id, kind, delta, balance_after, title, detail)
    values (
      p_user, 'expire', -r.remaining, gaia_current_balance(p_user), 'Credit hết hạn',
      'Lô nạp ' || to_char(r.created_at at time zone 'Asia/Ho_Chi_Minh', 'DD/MM/YYYY')
    );
  end loop;
end;
$$;

create or replace function public.gaia_balance(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  perform gaia_lock_user(p_user);
  perform gaia_expire_lots(p_user);
  return gaia_current_balance(p_user);
end;
$$;

-- Tạo một job và trừ credit trong cùng một giao dịch. Không đủ credit → lỗi INSUFFICIENT_CREDITS.
create or replace function public.gaia_create_generation(
  p_user uuid,
  p_kind text,
  p_op text,
  p_root uuid,
  p_source uuid,
  p_model text,
  p_model_name text,
  p_params jsonb,
  p_inputs jsonb,
  p_prompt text,
  p_credits integer,
  p_title text,
  p_detail text
)
returns public.generations
language plpgsql
security definer
set search_path = public
as $$
declare
  g generations;
  bal integer;
  need integer := p_credits;
  take integer;
  r record;
begin
  if p_credits is null or p_credits < 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  perform gaia_lock_user(p_user);
  perform gaia_expire_lots(p_user);
  bal := gaia_current_balance(p_user);
  if bal < p_credits then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into generations (user_id, kind, op, root_id, source_id, model, model_name, params, inputs, prompt, credits)
  values (p_user, p_kind, p_op, p_root, p_source, p_model, p_model_name,
          coalesce(p_params, '{}'::jsonb), coalesce(p_inputs, '{}'::jsonb), coalesce(p_prompt, ''), p_credits)
  returning * into g;

  for r in
    select id, remaining
    from credit_lots
    where user_id = p_user and expires_at > now() and remaining > 0
    order by expires_at, created_at
    for update
  loop
    exit when need = 0;
    take := least(need, r.remaining);
    update credit_lots set remaining = remaining - take where id = r.id;
    insert into credit_allocations (generation_id, lot_id, amount) values (g.id, r.id, take);
    need := need - take;
  end loop;

  if need > 0 then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  if p_credits > 0 then
    insert into credit_ledger (user_id, kind, delta, balance_after, title, detail, generation_id)
    values (p_user, 'use', -p_credits, bal - p_credits, p_title, p_detail, g.id);
  end if;

  return g;
end;
$$;

-- Hoàn credit cho một job (cả hoặc một phần). Gọi lại nhiều lần không hoàn quá số đã trừ.
-- Credit trả về đúng lô đã lấy; lô đã hết hạn thì tạo lô hoàn mới có hạn 7 ngày.
create or replace function public.gaia_refund(
  p_generation uuid,
  p_amount integer,
  p_title text,
  p_detail text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  g generations;
  amt integer;
  left_amt integer;
  give integer;
  r record;
begin
  select * into g from generations where id = p_generation for update;
  if not found then
    return 0;
  end if;

  perform gaia_lock_user(g.user_id);

  amt := g.credits - g.refunded_credits;
  if p_amount is not null then
    amt := least(amt, p_amount);
  end if;
  if amt <= 0 then
    return 0;
  end if;

  left_amt := amt;
  for r in
    select a.lot_id, a.amount, l.expires_at
    from credit_allocations a
    join credit_lots l on l.id = a.lot_id
    where a.generation_id = g.id and a.amount > 0
    order by l.expires_at desc
    for update of a
  loop
    exit when left_amt = 0;
    give := least(left_amt, r.amount);
    if r.expires_at > now() then
      update credit_lots set remaining = remaining + give where id = r.lot_id;
    else
      insert into credit_lots (user_id, source, amount, remaining, expires_at)
      values (g.user_id, 'refund', give, give, now() + interval '7 days');
    end if;
    update credit_allocations set amount = amount - give where generation_id = g.id and lot_id = r.lot_id;
    left_amt := left_amt - give;
  end loop;

  if left_amt > 0 then
    -- Job không có lô nào (vd credit 0) thì không có gì để hoàn thêm.
    amt := amt - left_amt;
  end if;
  if amt <= 0 then
    return 0;
  end if;

  update generations set refunded_credits = refunded_credits + amt, updated_at = now() where id = g.id;
  perform gaia_expire_lots(g.user_id);
  insert into credit_ledger (user_id, kind, delta, balance_after, title, detail, generation_id)
  values (g.user_id, 'refund', amt, gaia_current_balance(g.user_id), p_title, p_detail, g.id);
  return amt;
end;
$$;

-- Cộng credit khi nhận được tiền. Gọi lại nhiều lần (webhook + kiểm tra thủ công) chỉ cộng một lần.
create or replace function public.gaia_apply_topup(
  p_payment uuid,
  p_raw jsonb,
  p_title text,
  p_detail text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  p payments;
  total integer;
begin
  select * into p from payments where id = p_payment for update;
  if not found or p.status = 'paid' then
    return false;
  end if;

  perform gaia_lock_user(p.user_id);
  total := p.credits + p.bonus_credits;

  update payments set status = 'paid', paid_at = now(), raw = coalesce(p_raw, raw) where id = p.id;
  insert into credit_lots (user_id, payment_id, source, amount, remaining, expires_at)
  values (p.user_id, p.id, 'topup', total, total, now() + interval '90 days');
  perform gaia_expire_lots(p.user_id);
  insert into credit_ledger (user_id, kind, delta, balance_after, title, detail, payment_id)
  values (p.user_id, 'topup', total, gaia_current_balance(p.user_id), p_title, p_detail, p.id);
  return true;
end;
$$;

-- Tặng credit thủ công (chạy trong SQL Editor), vd để tự thử trước khi bật PayOS:
--   select gaia_grant((select id from auth.users where email = 'ban@gmail.com'), 500, 'Credit dùng thử');
create or replace function public.gaia_grant(p_user uuid, p_amount integer, p_detail text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;
  perform gaia_lock_user(p_user);
  insert into credit_lots (user_id, source, amount, remaining, expires_at)
  values (p_user, 'grant', p_amount, p_amount, now() + interval '90 days');
  perform gaia_expire_lots(p_user);
  insert into credit_ledger (user_id, kind, delta, balance_after, title, detail)
  values (p_user, 'topup', p_amount, gaia_current_balance(p_user), 'Tặng credit', p_detail);
  return gaia_current_balance(p_user);
end;
$$;

-- ───────────────────────── Quyền truy cập ─────────────────────────

alter table public.profiles enable row level security;
alter table public.payments enable row level security;
alter table public.generations enable row level security;
alter table public.credit_lots enable row level security;
alter table public.credit_allocations enable row level security;
alter table public.credit_ledger enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can read own payments" on public.payments;
create policy "Users can read own payments" on public.payments for select using (auth.uid() = user_id);

drop policy if exists "Users can read own generations" on public.generations;
create policy "Users can read own generations" on public.generations
  for select using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "Users can read own credit lots" on public.credit_lots;
create policy "Users can read own credit lots" on public.credit_lots for select using (auth.uid() = user_id);

drop policy if exists "Users can read own credit ledger" on public.credit_ledger;
create policy "Users can read own credit ledger" on public.credit_ledger for select using (auth.uid() = user_id);

-- credit_allocations: không có policy → người dùng không đọc được, chỉ server dùng.

-- Hàm credit chỉ server (service role) được gọi. Mặc định Postgres cho PUBLIC quyền EXECUTE,
-- nên phải thu hồi, nếu không người dùng đăng nhập có thể tự gọi gaia_grant qua API.
revoke execute on function public.gaia_lock_user(uuid) from public, anon, authenticated;
revoke execute on function public.gaia_current_balance(uuid) from public, anon, authenticated;
revoke execute on function public.gaia_expire_lots(uuid) from public, anon, authenticated;
revoke execute on function public.gaia_balance(uuid) from public, anon, authenticated;
revoke execute on function public.gaia_create_generation(uuid, text, text, uuid, uuid, text, text, jsonb, jsonb, text, integer, text, text) from public, anon, authenticated;
revoke execute on function public.gaia_refund(uuid, integer, text, text) from public, anon, authenticated;
revoke execute on function public.gaia_apply_topup(uuid, jsonb, text, text) from public, anon, authenticated;
revoke execute on function public.gaia_grant(uuid, integer, text) from public, anon, authenticated;

grant execute on function public.gaia_lock_user(uuid) to service_role;
grant execute on function public.gaia_current_balance(uuid) to service_role;
grant execute on function public.gaia_expire_lots(uuid) to service_role;
grant execute on function public.gaia_balance(uuid) to service_role;
grant execute on function public.gaia_create_generation(uuid, text, text, uuid, uuid, text, text, jsonb, jsonb, text, integer, text, text) to service_role;
grant execute on function public.gaia_refund(uuid, integer, text, text) to service_role;
grant execute on function public.gaia_apply_topup(uuid, jsonb, text, text) to service_role;
grant execute on function public.gaia_grant(uuid, integer, text) to service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
