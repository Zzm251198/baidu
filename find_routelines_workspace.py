with open(r"c:\Users\33626\Desktop\shenzhen-metro-cargo-platform\App.tsx", 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if "routeLines" in line or "startLine" in line or "startStations" in line:
            print(f"Line {i}: {line.strip()}")
