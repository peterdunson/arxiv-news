"""
Generate sitemap.xml for SEO
"""
from datetime import datetime
from database import SessionLocal
from models import Paper

def generate_sitemap():
    """Generate XML sitemap of all papers"""
    db = SessionLocal()

    try:
        papers = db.query(Paper).order_by(Paper.created_at.desc()).limit(1000).all()

        xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

        # Homepage
        xml += '  <url>\n'
        xml += '    <loc>https://arxiv-news.com/</loc>\n'
        xml += '    <changefreq>hourly</changefreq>\n'
        xml += '    <priority>1.0</priority>\n'
        xml += '  </url>\n'

        # Category pages
        categories = ['all', 'cs.AI', 'cs.LG', 'cs.CV', 'cs.CL', 'cs.RO', 'stat.ML', 'math', 'physics', 'quant-ph']
        for cat in categories:
            xml += '  <url>\n'
            xml += f'    <loc>https://arxiv-news.com/?cat={cat}</loc>\n'
            xml += '    <changefreq>daily</changefreq>\n'
            xml += '    <priority>0.8</priority>\n'
            xml += '  </url>\n'

        # Paper pages
        for paper in papers:
            xml += '  <url>\n'
            xml += f'    <loc>https://arxiv-news.com/paper/{paper.arxiv_id}</loc>\n'
            xml += f'    <lastmod>{paper.created_at.strftime("%Y-%m-%d")}</lastmod>\n'
            xml += '    <changefreq>weekly</changefreq>\n'
            xml += '    <priority>0.6</priority>\n'
            xml += '  </url>\n'

        xml += '</urlset>'

        return xml
    finally:
        db.close()

if __name__ == "__main__":
    sitemap = generate_sitemap()
    with open("sitemap.xml", "w") as f:
        f.write(sitemap)
    print(f"✓ Sitemap generated with {sitemap.count('<url>')} URLs")
