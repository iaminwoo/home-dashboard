alter table public.dashboard_notes
  add column sort_order integer;

with numbered_notes as (
  select id, row_number() over (order by completed asc, created_at desc) - 1 as sort_order
  from public.dashboard_notes
)
update public.dashboard_notes
set sort_order = numbered_notes.sort_order
from numbered_notes
where public.dashboard_notes.id = numbered_notes.id;

alter table public.dashboard_notes
  alter column sort_order set default 0,
  alter column sort_order set not null;

create index dashboard_notes_sort_order_idx on public.dashboard_notes (sort_order, created_at);
