with open(r"c:\Users\33626\Desktop\系统前端\shenzhen-metro-cargo-platform\App.tsx", 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if "起点选择" in line or "终点选择" in line or "开始仿真" in line or "card.value" in line or "FilterSelect" in line:
            print(f"Line {i}: {line.strip()}")
