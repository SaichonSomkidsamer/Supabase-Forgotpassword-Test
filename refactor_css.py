import re
import os

workspace = "/Users/saichon/Desktop/Admin_UI"
html_files = ["admins.html", "dashboard.html", "orders.html", "test.html"]
style_css_path = os.path.join(workspace, "css", "style.css")

all_css = []

for file in html_files:
    path = os.path.join(workspace, file)
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract style block
    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
    if style_match:
        css = style_match.group(1).strip()
        all_css.append(f"/* === Extracted from {file} === */\n{css}\n")
        
        # Remove style block
        content = content.replace(style_match.group(0), "")
        
        # Ensure style.css is linked
        if 'href="css/style.css"' not in content:
            # Insert after layout.css if exists, else before </head>
            if 'href="css/layout.css"' in content:
                content = content.replace('<link rel="stylesheet" href="css/layout.css">', '<link rel="stylesheet" href="css/layout.css">\n    <link rel="stylesheet" href="css/style.css">')
            else:
                content = content.replace('</head>', '    <link rel="stylesheet" href="css/style.css">\n</head>')
                
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
            
if all_css:
    with open(style_css_path, 'a', encoding='utf-8') as f:
        f.write("\n\n" + "\n".join(all_css))
        
print("CSS extracted and files updated successfully.")
