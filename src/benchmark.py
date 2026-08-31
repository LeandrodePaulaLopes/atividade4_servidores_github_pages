from pathlib import Path
import argparse
import csv
import os
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.metricas import medir_execucao
from src.servidor_single import executar as executar_single
from src.servidor_multi import executar as executar_multi

CAMPOS = [
    "modelo", "requisicoes", "workers", "repeticao",
    "tempo_total_s", "tempo_medio_ms", "throughput_req_s",
    "cpu_percent", "memoria_mb"
]

def executar_benchmark(quantidades, repeticoes, workers, saida):
    saida.parent.mkdir(parents=True, exist_ok=True)
    with saida.open("w", newline="", encoding="utf-8") as arquivo:
        writer = csv.DictWriter(arquivo, fieldnames=CAMPOS)
        writer.writeheader()

        for quantidade in sorted(set(quantidades)):
            for repeticao in range(1, repeticoes + 1):
                ids = list(range(1, quantidade + 1))

                single = medir_execucao(
                    "Single-Thread", quantidade, 1, repeticao,
                    executar_single, ids
                )
                writer.writerow(single.__dict__)
                arquivo.flush()
                time.sleep(0.2)

                multi = medir_execucao(
                    "Multi-Thread", quantidade, workers, repeticao,
                    lambda x: executar_multi(x, workers), ids
                )
                writer.writerow(multi.__dict__)
                arquivo.flush()

                print(
                    f"{quantidade:>5} req | rep {repeticao} | "
                    f"single={single.tempo_total_s:.3f}s | "
                    f"multi={multi.tempo_total_s:.3f}s"
                )

    print(f"\nResultados salvos em: {saida}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--requests", nargs="+", type=int,
                        default=[10, 50, 100, 250, 500])
    parser.add_argument("--repetitions", type=int, default=3)
    parser.add_argument("--workers", type=int,
                        default=min(16, (os.cpu_count() or 2) + 4))
    parser.add_argument("--output", type=Path,
                        default=ROOT / "docs" / "data" / "benchmark.csv")
    args = parser.parse_args()
    executar_benchmark(args.requests, args.repetitions, args.workers, args.output)

if __name__ == "__main__":
    main()
