import os
from playwright.sync_api import sync_playwright
from PIL import Image

def render_svg():
    svg_file = os.path.abspath('docs/flow-maps/sos-vietnam-architecture.flow.svg')
    png_file = os.path.abspath('docs/flow-maps/sos-vietnam-architecture-flow.png')
    temp_html = os.path.abspath('docs/flow-maps/temp_render.html')

    with open(svg_file, 'r', encoding='utf-8') as f:
        svg_content = f.read()

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body {{
    margin: 0;
    padding: 0;
    background: #030712;
    overflow: hidden;
  }}
  svg {{
    display: block;
    width: 1200px;
    height: 820px;
  }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""

    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    html_url = f"file:///{temp_html.replace(os.sep, '/')}"

    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome')
        page = browser.new_page(viewport={'width': 1200, 'height': 820})
        page.goto(html_url)
        page.wait_for_timeout(2000)
        page.screenshot(path=png_file, full_page=True)
        browser.close()

    if os.path.exists(temp_html):
        os.remove(temp_html)

    im = Image.open(png_file)
    print(f"Rendered SVG to PNG: {png_file}")
    print(f"Size: {os.path.getsize(png_file)} bytes, Dimensions: {im.size}")

if __name__ == '__main__':
    render_svg()
