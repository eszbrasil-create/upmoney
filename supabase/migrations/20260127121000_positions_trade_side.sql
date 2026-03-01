alter table public.positions
  add column if not exists trade_side text not null default 'buy'
  check (trade_side in ('buy', 'sell'));

update public.positions
set trade_side = 'sell'
where quantity < 0;
