import os
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
from bs4 import BeautifulSoup

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    # Fetch content
    req = urllib.request.Request(
        FEED_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        xml_content = response.read()
        
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    root = ET.fromstring(xml_content)
    updates = []
    
    entries = root.findall('atom:entry', ns)
    for entry_idx, entry in enumerate(entries):
        date_str = entry.find('atom:title', ns).text
        updated_str = entry.find('atom:updated', ns).text
        link_elem = entry.find('atom:link[@rel="alternate"]', ns)
        entry_link = link_elem.attrib.get('href') if link_elem is not None else ""
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        if not content_html:
            continue
            
        soup = BeautifulSoup(content_html, 'html.parser')
        headers = soup.find_all(['h3', 'h4'])
        
        if not headers:
            # Treat entire body as a single General update
            # We clean up links to ensure they open in new tabs
            for a in soup.find_all('a'):
                a['target'] = '_blank'
                a['rel'] = 'noopener noreferrer'
            
            updates.append({
                'id': f"bq-{entry_idx}-0",
                'date': date_str,
                'updated': updated_str,
                'link': entry_link,
                'type': 'General',
                'content': str(soup)
            })
        else:
            for h_idx, h in enumerate(headers):
                update_type = h.text.strip()
                sibling = h.next_sibling
                sibling_htmls = []
                while sibling and sibling.name not in ['h3', 'h4']:
                    if sibling.name:
                        # Clean up links in sibling
                        for a in sibling.find_all('a') if hasattr(sibling, 'find_all') else []:
                            a['target'] = '_blank'
                            a['rel'] = 'noopener noreferrer'
                        sibling_htmls.append(str(sibling))
                    elif isinstance(sibling, str) and sibling.strip():
                        sibling_htmls.append(f"<p>{sibling.strip()}</p>")
                    sibling = sibling.next_sibling
                
                content = "".join(sibling_htmls)
                # Formulate a stable link for this specific section if possible
                anchor = date_str.replace(' ', '_')
                specific_link = f"{entry_link}#{anchor}" if entry_link else ""
                
                updates.append({
                    'id': f"bq-{entry_idx}-{h_idx}",
                    'date': date_str,
                    'updated': updated_str,
                    'link': specific_link,
                    'type': update_type,
                    'content': content
                })
                
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        # We can pass force_refresh query param, although we just fetch fresh here anyway
        updates = fetch_and_parse_feed()
        return jsonify({
            'status': 'success',
            'count': len(updates),
            'data': updates
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
