import zipfile, xml.etree.ElementTree as ET, sys

W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

with zipfile.ZipFile('diplom.docx', 'r') as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)
body = root.find('{%s}body' % W)

def get_text(para):
    texts = []
    for elem in para.iter('{%s}t' % W):
        if elem.text:
            texts.append(elem.text)
    return ''.join(texts).strip()

def get_style(para):
    pPr = para.find('{%s}pPr' % W)
    if pPr is not None:
        pStyle = pPr.find('{%s}pStyle' % W)
        if pStyle is not None:
            return pStyle.get('{%s}val' % W, '')
    return ''

def extract_paras(elem):
    results = []
    tag = elem.tag.split('}')[-1]
    if tag == 'p':
        text = get_text(elem)
        style = get_style(elem)
        if text:
            results.append((style, text))
    else:
        for child in elem:
            results.extend(extract_paras(child))
    return results

paras = extract_paras(body)
with open('extracted.txt', 'w', encoding='utf-8') as f:
    for style, text in paras:
        if style:
            f.write('[' + style + '] ' + text[:300] + '\n')
        else:
            f.write(text[:300] + '\n')
