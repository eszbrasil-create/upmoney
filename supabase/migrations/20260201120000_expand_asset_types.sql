alter table public.positions
  drop constraint if exists positions_asset_type_check;

alter table public.positions
  add constraint positions_asset_type_check
  check (
    asset_type in (
      'cash',
      'fixed_income',
      'equity',
      'reits',
      'etf',
      'funds',
      'crypto',
      'international',
      'real_estate',
      'other'
    )
  );

alter table public.market_prices_cache
  drop constraint if exists market_prices_cache_asset_type_check;

alter table public.market_prices_cache
  add constraint market_prices_cache_asset_type_check
  check (
    asset_type in (
      'cash',
      'fixed_income',
      'equity',
      'reits',
      'etf',
      'funds',
      'crypto',
      'international',
      'real_estate',
      'other'
    )
  );
