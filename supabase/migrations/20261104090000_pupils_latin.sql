-- eMaktab's lists mix Cyrillic and Latin (owner's report): names are kept in Latin only. The import converts new files
-- (`toLatin`/`latinName` in src/lib/pupil-import.ts); this converts the list already stored, with the same rules:
-- Uzbek Cyrillic → Latin ("е" is "ye" at a word's start and after a vowel), each word in title case with o‘/g‘, and
-- the short name "Familiya I." (Sh/Ch/O‘/G‘ initials whole).

create function private.uz_latin(value text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text := lower(value);
  out text := '';
  c text;
  p text;
begin
  for i in 1 .. coalesce(char_length(s), 0) loop
    c := substr(s, i, 1);
    if c = 'е' then
      p := case when i > 1 then substr(s, i - 1, 1) end;
      out := out || case when p is null or p !~ '[a-zа-яёўқғҳ]' or p ~ '[аеёиоуўэюяъьaeiou]' then 'ye' else 'e' end;
    else
      out := out || case c
        when 'а' then 'a' when 'б' then 'b' when 'в' then 'v' when 'г' then 'g' when 'д' then 'd' when 'ё' then 'yo'
        when 'ж' then 'j' when 'з' then 'z' when 'и' then 'i' when 'й' then 'y' when 'к' then 'k' when 'л' then 'l'
        when 'м' then 'm' when 'н' then 'n' when 'о' then 'o' when 'п' then 'p' when 'р' then 'r' when 'с' then 's'
        when 'т' then 't' when 'у' then 'u' when 'ф' then 'f' when 'х' then 'x' when 'ц' then 'ts' when 'ч' then 'ch'
        when 'ш' then 'sh' when 'щ' then 'sh' when 'ъ' then '’' when 'ы' then 'i' when 'ь' then '' when 'э' then 'e'
        when 'ю' then 'yu' when 'я' then 'ya' when 'ў' then 'o‘' when 'қ' then 'q' when 'ғ' then 'g‘' when 'ҳ' then 'h'
        else c end;
    end if;
  end loop;
  return out;
end;
$$;

-- One word in title case: o‘/g‘ with ‘, other apostrophes ’, every hyphen part capitalized.
create function private.uz_word(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select string_agg(upper(left(part, 1)) || substr(part, 2), '-' order by n)
  from unnest(string_to_array(
    regexp_replace(regexp_replace(lower(value), '([og])[`''ʻ’‘]', '\1‘', 'g'), '[`''ʻ]', '’', 'g'), '-'
  )) with ordinality as t(part, n);
$$;

with fixed as (
  select id, (
    select string_agg(private.uz_word(private.uz_latin(w)), ' ' order by n)
    from unnest(regexp_split_to_array(btrim(full_name), '\s+')) with ordinality as t(w, n)
    where w <> ''
  ) as name
  from public.pupils
)
update public.pupils p
set full_name = left(f.name, 120),
    display_name = left(
      split_part(f.name, ' ', 1)
      || coalesce(' ' || nullif(substring(split_part(f.name, ' ', 2) from '^(Sh|Ch|[OG]‘|.)'), '') || '.', ''),
      60)
from fixed f
where f.id = p.id and f.name is not null;

drop function private.uz_word(text);
drop function private.uz_latin(text);
