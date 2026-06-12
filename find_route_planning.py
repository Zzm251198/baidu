with open(r"c:\Users\33626\Desktop\shenzhen-metro-cargo-platform\App.tsx", 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
# Let's search for "simResult" or "findRoute" or similar keywords
for i, line in enumerate(lines, 1):
    if any(x in line for x in ["simResult", "findRoute", "highlightPath", "shortest", "path", "algorithm", "bfs"]):
        print(f"Line {i}: {line.strip()}")
