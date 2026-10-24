-- GAIA Studio: phân trang thư viện theo ngày (24/10/2026).
-- Thư viện gom theo ngày (giờ Việt Nam), mỗi ngày 8 mục một trang.
-- • Cột `day`: ngày tạo theo giờ Việt Nam, Postgres tự tính từ created_at nên không bao giờ lệch.
-- • Index (user_id, day, created_at): lấy "trang N của ngày X" và đếm số mục mỗi ngày mà không quét cả thư viện.
-- Không lưu số trang: số trang đổi mỗi khi tạo hoặc xoá một mục, nên được tính lúc đọc.
--
-- Chạy trong Supabase → SQL Editor TRƯỚC khi chạy code mới. Chạy lại lần nữa cũng không sao.

alter table public.generations
  add column if not exists day date generated always as ((created_at at time zone 'Asia/Ho_Chi_Minh')::date) stored;

create index if not exists generations_library_day_idx
  on public.generations (user_id, day desc, created_at desc)
  where root_id is null and deleted_at is null;

-- Các ngày có mục trong thư viện, mới nhất trước, kèm số mục mỗi ngày.
-- p_kind: 'image' | 'video' | null (tất cả). p_before: chỉ lấy các ngày trước ngày này (tải thêm ngày cũ hơn).
create or replace function public.gaia_library_days(p_user uuid, p_kind text, p_before date, p_limit integer)
returns table (day date, total integer)
language sql
stable
set search_path = public
as $$
  select g.day, count(*)::integer
  from generations g
  where g.user_id = p_user
    and g.root_id is null
    and g.deleted_at is null
    and (p_kind is null or g.kind = p_kind)
    and (p_before is null or g.day < p_before)
  group by g.day
  order by g.day desc
  limit p_limit;
$$;

-- Trang đầu (p_per_day mục mới nhất) của p_days ngày gần nhất, cùng điều kiện với gaia_library_days.
-- Trả về dòng generations để server lấy kèm các phiên bản trong cùng một lần gọi.
create or replace function public.gaia_library_first_pages(
  p_user uuid,
  p_kind text,
  p_before date,
  p_days integer,
  p_per_day integer
)
returns setof public.generations
language sql
stable
set search_path = public
as $$
  select g.*
  from (
    select distinct x.day
    from generations x
    where x.user_id = p_user
      and x.root_id is null
      and x.deleted_at is null
      and (p_kind is null or x.kind = p_kind)
      and (p_before is null or x.day < p_before)
    order by x.day desc
    limit p_days
  ) d
  cross join lateral (
    select y.*
    from generations y
    where y.user_id = p_user
      and y.root_id is null
      and y.deleted_at is null
      and y.day = d.day
      and (p_kind is null or y.kind = p_kind)
    order by y.created_at desc
    limit p_per_day
  ) g;
$$;

-- Chỉ server (khoá secret) gọi được, giống các hàm gaia_* khác.
revoke execute on function public.gaia_library_days(uuid, text, date, integer) from public, anon, authenticated;
revoke execute on function public.gaia_library_first_pages(uuid, text, date, integer, integer) from public, anon, authenticated;
grant execute on function public.gaia_library_days(uuid, text, date, integer) to service_role;
grant execute on function public.gaia_library_first_pages(uuid, text, date, integer, integer) to service_role;
