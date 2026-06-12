with open(r"c:\Users\33626\Desktop\系统前端\shenzhen-metro-cargo-platform\components\StationData.ts", 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if "深圳北" in line:
            print(f"Line {i}: {line.strip()}")
