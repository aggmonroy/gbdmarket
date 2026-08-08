create table if not exists public.home_gallery_pool (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text not null,
  cta_url text not null default '/catalogo',
  is_active boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

grant select on public.home_gallery_pool to anon, authenticated;
grant all on public.home_gallery_pool to service_role;

alter table public.home_gallery_pool enable row level security;

create policy "Pool de ambientaciones visible para todos"
on public.home_gallery_pool for select
to anon, authenticated
using (true);

insert into public.home_gallery_pool (title, subtitle, image_url, cta_url, position) values
('Sala en uso','Juego de sala y mesa de centro en el hogar','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80','/catalogo?q=sala',1),
('Comedor familiar','Juego de comedor servido en casa','https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1600&q=80','/catalogo?q=comedor',2),
('Recámara lista','Cama, colchón y cómoda en uso','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80','/catalogo?q=recamara',3),
('Cocinando en casa','Estufa y horno en plena preparación','https://images.unsplash.com/photo-1585659722983-3a675dabf23d?auto=format&fit=crop&w=1600&q=80','/catalogo?q=estufa',4),
('Día de lavado','Lavadora y secadora en la lavandería','https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1600&q=80','/catalogo?q=lavadora',5),
('Refrigeración en familia','Refrigeradora abastecida en la cocina','https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1600&q=80','/catalogo?q=refrigeradora',6),
('Noche de películas','Smart TV y mueble de sala en uso','https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1600&q=80','/catalogo?q=televisor',7),
('Descanso con aire','Aire acondicionado climatizando la recámara','https://images.unsplash.com/photo-1631545308456-511dcbf8f97b?auto=format&fit=crop&w=1600&q=80','/catalogo?q=aire',8),
('Home office','Escritorio y silla en la rutina diaria','https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=1600&q=80','/catalogo?q=escritorio',9),
('Cocina equipada','Microondas y campana en el día a día','https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1600&q=80','/catalogo?q=microondas',10),
('Sala contemporánea','Sofá modular y alfombra en el estar','https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80','/catalogo?q=sofa',11),
('Comedor moderno','Mesa y sillas para reunir a la familia','https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1600&q=80','/catalogo?q=mesa',12),
('Dormitorio principal','Colchón y veladores en uso','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=80','/catalogo?q=cama',13),
('Cocina abierta','Electrodomésticos trabajando en casa','https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1600&q=80','/catalogo?q=cocina',14),
('Cuarto infantil','Muebles para los más pequeños','https://images.unsplash.com/photo-1595787039714-d99ec1e6dfef?auto=format&fit=crop&w=1600&q=80','/catalogo?q=nino',15),
('Terraza en familia','Muebles de exterior en uso','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80','/catalogo?q=exterior',16);

create or replace function public.rotar_galeria_inicio()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
  offset_semana integer;
begin
  select count(*) into total from public.home_gallery_pool where is_active;
  if total < 1 then
    return;
  end if;
  offset_semana := (extract(week from now())::int * 3) % total;

  with pool as (
    select title, subtitle, image_url, cta_url,
           row_number() over (order by position, id) - 1 as idx
    from public.home_gallery_pool
    where is_active
  ), picks as (
    select p.*, s.i
    from generate_series(0, 9) as s(i)
    join pool p on p.idx = ((offset_semana + s.i) % total)
  )
  insert into public.content_blocks (key, section, title, subtitle, image_url, cta_url, display_order, is_active, has_draft, draft_data)
  select 'home.gallery.' || (i + 1), 'home.gallery', title, subtitle, image_url, cta_url, i, true, false, null
  from picks
  on conflict (key) do update set
    title = excluded.title,
    subtitle = excluded.subtitle,
    image_url = excluded.image_url,
    cta_url = excluded.cta_url,
    display_order = excluded.display_order,
    is_active = true,
    has_draft = false,
    draft_data = null;
end;
$$;

revoke execute on function public.rotar_galeria_inicio() from public, anon, authenticated;
grant execute on function public.rotar_galeria_inicio() to service_role;