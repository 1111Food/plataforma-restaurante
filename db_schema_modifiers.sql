-- 1. Groups of Modifiers (e.g., "Sides", "Drink Size")
create table if not exists modifier_groups (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references restaurants(id) on delete cascade,
  name text not null,
  min_selection int default 0, -- 0 = Optional, 1+ = Mandatory
  max_selection int default 1, -- 1 = Radio (Single), >1 = Checkbox (Multi)
  created_at timestamptz default now()
);

-- 2. The Options within a Group (e.g., "Fries", "Coke")
create table if not exists modifier_options (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references modifier_groups(id) on delete cascade,
  name text not null,
  price_extra decimal(10,2) default 0.00,
  is_available boolean default true,
  created_at timestamptz default now()
);

-- 3. Linking Groups to Menu Items (Many-to-Many)
create table if not exists item_modifiers (
  item_id uuid references menu_items(id) on delete cascade,
  group_id uuid references modifier_groups(id) on delete cascade,
  display_order int default 0,
  primary key (item_id, group_id)
);

-- 4. Enable RLS (Optional but recommended, though we assume existing policies apply or public access for now)
alter table modifier_groups enable row level security;
alter table modifier_options enable row level security;
alter table item_modifiers enable row level security;

-- Policies (Simplistic for now: Allow all read, allow authenticated write)
create policy "Public Read Groups" on modifier_groups for select using (true);
create policy "Public Read Options" on modifier_options for select using (true);
create policy "Public Read ItemModifiers" on item_modifiers for select using (true);

create policy "Auth Write Groups" on modifier_groups for all using (auth.role() = 'authenticated');
create policy "Auth Write Options" on modifier_options for all using (auth.role() = 'authenticated');
create policy "Auth Write ItemModifiers" on item_modifiers for all using (auth.role() = 'authenticated');
