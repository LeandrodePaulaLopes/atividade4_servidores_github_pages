from pathlib import Path
import csv
import random

saida = Path(__file__).resolve().parents[1] / "docs" / "data" / "benchmark.csv"
saida.parent.mkdir(parents=True, exist_ok=True)
random.seed(4)

linhas = []
for n in [10, 50, 100, 250, 500]:
    for rep in range(1, 4):
        single = n * 0.010 + random.uniform(-0.003, 0.003)
        multi = n * 0.010 / 8 + 0.012 + random.uniform(-0.003, 0.003)
        for modelo, tempo, workers in [
            ("Single-Thread", single, 1),
            ("Multi-Thread", multi, 8),
        ]:
            linhas.append({
                "modelo": modelo, "requisicoes": n, "workers": workers,
                "repeticao": rep, "tempo_total_s": round(tempo, 5),
                "tempo_medio_ms": round(tempo / n * 1000, 5),
                "throughput_req_s": round(n / tempo, 3),
                "cpu_percent": round((28 if modelo == "Single-Thread" else 65) + random.uniform(-4, 4), 2),
                "memoria_mb": round((42 if modelo == "Single-Thread" else 55) + random.uniform(-1, 2), 2)
            })

with saida.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=linhas[0].keys())
    writer.writeheader()
    writer.writerows(linhas)

print(saida)
