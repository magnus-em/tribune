-- Admin UPDATE policy on case_messages.
--
-- Without this, dispatchLetter()'s update to set dispatch_channel = 'email'
-- was silently denied by RLS — Supabase doesn't error on a no-op update, so
-- the email went out but the staged-letter banner never cleared on the admin
-- case page. SELECT and INSERT policies already exist for admins.
create policy "Admins can update all messages"
  on case_messages for update
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
