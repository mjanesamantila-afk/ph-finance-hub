-- Philippine Personal Finance Hub — database schema
-- Enable RLS on all tables
-- All tables are scoped to auth.uid()

create table holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  type text not null,
  broker text,
  name text not null,
  ticker text,
  shares numeric,
  price_per_share numeric,
  invested numeric,
  current_value numeric,
  last_price numeric,
  last_refreshed timestamptz,
  date_added date,
  stop_loss_pct numeric default 10,
  currency text default 'PHP',
  created_at timestamptz default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date date not null,
  description text,
  category text,
  amount numeric not null,
  direction text not null check (direction in ('in','out')),
  method text,
  created_at timestamptz default now()
);

create table spend_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  budget_amount numeric default 0,
  unique(user_id, category)
);

create table digital_banks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  bank_name text not null,
  balance numeric default 0,
  interest_rate numeric default 0,
  last_updated date,
  unique(user_id, bank_name)
);

create table bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  bank_name text not null,
  direction text not null check (direction in ('in','out')),
  amount numeric not null,
  note text,
  date date not null,
  created_at timestamptz default now()
);

create table interest_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  bank_name text not null,
  month text not null,
  interest numeric not null,
  balance_at_time numeric,
  rate_at_time numeric,
  unique(user_id, bank_name, month)
);

create table user_settings (
  user_id uuid primary key references auth.users on delete cascade not null,
  income numeric default 0,
  money_system jsonb default '{"tithes":10,"invest":20,"savings":20,"spend":50}',
  global_stop_loss numeric default 10,
  custom_categories jsonb default '{"manual":[],"digital":[]}',
  freedom_plan jsonb default '{"currentAge":"","retireAge":"","monthlyGoal":"","expectedReturn":8}'
);

-- Row Level Security
alter table holdings enable row level security;
alter table ledger_entries enable row level security;
alter table spend_budgets enable row level security;
alter table digital_banks enable row level security;
alter table bank_transactions enable row level security;
alter table interest_history enable row level security;
alter table user_settings enable row level security;

-- RLS Policies (users can only see their own data)
create policy "Users own their holdings" on holdings for all using (auth.uid() = user_id);
create policy "Users own their ledger" on ledger_entries for all using (auth.uid() = user_id);
create policy "Users own their budgets" on spend_budgets for all using (auth.uid() = user_id);
create policy "Users own their banks" on digital_banks for all using (auth.uid() = user_id);
create policy "Users own their bank txns" on bank_transactions for all using (auth.uid() = user_id);
create policy "Users own their interest history" on interest_history for all using (auth.uid() = user_id);
create policy "Users own their settings" on user_settings for all using (auth.uid() = user_id);

-- Recurring monthly bills (due on a day each month)
create table bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric default 0,
  due_day int not null,
  category text,
  notes text,
  active boolean default true,
  paid_months text[] default '{}',
  month_amounts jsonb default '{}',
  ended_from text,
  starts_from text,
  payment_method text,
  created_at timestamptz default now()
);

alter table bills enable row level security;
create policy "Users own their bills" on bills for all using (auth.uid() = user_id);

-- Savings goals (e.g. Travel fund, Emergency fund)
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric default 0,
  saved_amount numeric default 0,
  target_date date,
  source text,
  created_at timestamptz default now()
);

alter table savings_goals enable row level security;
create policy "Users own their savings goals" on savings_goals for all using (auth.uid() = user_id);

-- Subscriptions (recurring services: Netflix, Spotify, etc.)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric default 0,
  cycle text default 'monthly',
  payment_method text,
  active boolean default true,
  renewal_date date,
  created_at timestamptz default now()
);

alter table subscriptions enable row level security;
create policy "Users own their subscriptions" on subscriptions for all using (auth.uid() = user_id);
