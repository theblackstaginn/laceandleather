#!/usr/bin/env python3
import html, mimetypes, os, re, subprocess
from datetime import datetime, timezone
from email.utils import format_datetime, parsedate_to_datetime
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT=Path(__file__).resolve().parents[1]
BASE='https://laceleatherarcane.com/'
PAGES=['index.html','buttons.html','smithy-textures.html','grimoire-pages.html','mapmaker-sheets.html','light-aged-parchment-vol-1.html',*['journal/'+x for x in ['how-to-print-parchment-paper.html','suneen-reef.html','whispering-bay.html','coastline-drafting.html','region-notes.html','travel-routes.html','settlement-planning.html','campaign-map-notes.html','map-legends.html']]]
CATS={
'journal/how-to-print-parchment-paper.html':('Printable Paper','Journaling'),
'index.html':('Digital Art','Worldbuilding'),'buttons.html':('Fantasy UI','Game Assets'),'smithy-textures.html':('Fantasy Design','Digital Textures'),'grimoire-pages.html':('Grimoire','Printable Design'),'mapmaker-sheets.html':('Fantasy Cartography','Worldbuilding'),'light-aged-parchment-vol-1.html':('Parchment','Digital Textures'),
'journal/suneen-reef.html':('Fantasy Maps','Worldbuilding'),'journal/whispering-bay.html':('Fantasy Maps','Worldbuilding'),'journal/coastline-drafting.html':('Fantasy Cartography','Worldbuilding'),'journal/region-notes.html':('Worldbuilding','Fantasy Cartography'),'journal/travel-routes.html':('Worldbuilding','TTRPG'),'journal/settlement-planning.html':('Worldbuilding','Fantasy Cartography'),'journal/campaign-map-notes.html':('TTRPG','Fantasy Maps'),'journal/map-legends.html':('Fantasy Cartography','Map Design')}
USE=[('map-design','Fantasy Map Design: Building Worlds on Aged Parchment','Fantasy Maps','Worldbuilding'),('rpg-handouts','TTRPG Handouts: Giving Campaign Notes a World-Worn Surface','TTRPG','Printable Design'),('tarot-layouts','Tarot Layouts: Archival Parchment for Divination Designs','Tarot Design','Printable Design'),('journal-pages','Journal Pages: Building Printable Reflection and Lore Sheets','Journaling','Printables'),('book-covers','Fantasy Book Covers: Adding Tactile Material to Publishing Art','Book Design','Fantasy Art'),('website-heroes','Website Heroes: Old-World Surfaces for Digital Interfaces','Web Design','Fantasy UI')]

def clean(s): return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s or ''))).strip()
def attr(src,pat):
 m=re.search(pat,src,re.I|re.S); return html.unescape(m.group(1)).strip() if m else ''
def absurl(u,rel):
 if not u:return ''
 if u.startswith('https://'):return u
 p=(Path(rel).parent/u).as_posix();
 while p.startswith('../'):p=p[3:]
 return BASE+p.lstrip('./')
def date(rel):
 try:
  s=subprocess.check_output(['git','log','-1','--format=%cD','--',rel],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
  return parsedate_to_datetime(s).astimezone(timezone.utc) if s else datetime.now(timezone.utc)
 except:return datetime.now(timezone.utc)
def page(rel):
 src=(ROOT/rel).read_text(encoding='utf-8')
 title=attr(src,r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)') or attr(src,r'<title>(.*?)</title>')
 title=re.sub(r'\s*[|·]\s*Lace\s*&\s*Leather(?:\s*Arcane)?\s*$','',clean(title),flags=re.I)
 desc=clean(attr(src,r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)'))
 canon=attr(src,r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)') or BASE+rel.replace('index.html','')
 image=absurl(attr(src,r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)'),rel)
 chunks=[clean(x) for x in re.findall(r'<(?:p|li)\b[^>]*>(.*?)</(?:p|li)>',src,re.I|re.S)]
 for x in chunks:
  if len(desc)>=300:break
  if x and x not in desc:desc=(desc+' '+x).strip()
 return dict(title=title,link=canon,description=desc[:1100],image=image,date=date(rel),categories=CATS.get(rel,('Lace & Leather',)),src=src)
def enclosure(u):
 mime=mimetypes.guess_type(urlparse(u).path)[0] or 'image/webp'; size=0
 if u.startswith(BASE):
  p=ROOT/unquote(u[len(BASE):]); size=p.stat().st_size if p.exists() and p.is_file() else 0
 return size,mime
def item(x):
 enc=''
 if x['image']:
  size,mime=enclosure(x['image']); enc=f'      <enclosure url="{html.escape(x["image"],quote=True)}" length="{size}" type="{mime}" />\n'
 cats=''.join(f'      <category>{html.escape(c)}</category>\n' for c in x['categories'])
 desc=x['description'].replace(']]>',']]]]><![CDATA[>')
 return f'''    <item>\n      <title>{html.escape(x['title'])}</title>\n      <link>{html.escape(x['link'])}</link>\n      <guid isPermaLink="true">{html.escape(x['link'])}</guid>\n      <pubDate>{format_datetime(x['date'],usegmt=True)}</pubDate>\n      <dc:creator>Lace &amp; Leather Arcane</dc:creator>\n      <description><![CDATA[{desc}]]></description>\n{enc}{cats}    </item>\n'''

items=[page(p) for p in PAGES]
u=page('use-case.html')
for anchor,title,c1,c2 in USE:
 m=re.search(rf'<figure\b[^>]*id=["\']{re.escape(anchor)}["\'][^>]*>(.*?)</figure>',u['src'],re.I|re.S); block=m.group(1) if m else ''
 image=absurl(attr(block,r'<img[^>]+src=["\']([^"\']+)'),'use-case.html') or u['image']
 desc=clean(block)
 if len(desc)<250:desc=u['description']
 items.append(dict(title=title,link=f'{BASE}use-case.html#{anchor}',description=desc[:1100],image=image,date=u['date'],categories=(c1,c2)))
items={x['link']:x for x in items if x['title'] and x['link']}.values(); items=sorted(items,key=lambda x:x['date'],reverse=True)[:20]
if len(items)<20:raise SystemExit(f'Expected at least 20 items, found {len(items)}')
now=format_datetime(datetime.now(timezone.utc),usegmt=True)
body=''.join(item(x) for x in items)
feed=f'''<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">\n  <channel>\n    <title>Lace &amp; Leather Arcane</title>\n    <link>{BASE}</link>\n    <description>Original fantasy design showcases, digital texture releases, RPG interface assets, cartography resources, and creator use cases from Lace &amp; Leather Arcane.</description>\n    <language>en-US</language>\n    <lastBuildDate>{now}</lastBuildDate>\n    <atom:link href="{BASE}feed.xml" rel="self" type="application/rss+xml" />\n    <atom:link href="{BASE}" rel="alternate" type="text/html" />\n    <image><url>{BASE}assets/l%26l_logo.webp</url><title>Lace &amp; Leather Arcane</title><link>{BASE}</link></image>\n\n{body}  </channel>\n</rss>\n'''
(ROOT/'feed.xml').write_text(feed,encoding='utf-8')
print(f'Wrote feed.xml with {len(items)} items')
