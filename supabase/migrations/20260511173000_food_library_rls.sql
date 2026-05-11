alter table public.food_library enable row level security;

drop policy if exists "Users can read own food library" on public.food_library;
drop policy if exists "Users can insert own food library" on public.food_library;
drop policy if exists "Users can update own food library" on public.food_library;
drop policy if exists "Users can delete own food library" on public.food_library;

create policy "Users can read own food library"
on public.food_library
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own food library"
on public.food_library
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own food library"
on public.food_library
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own food library"
on public.food_library
for delete
to authenticated
using (auth.uid() = user_id);
