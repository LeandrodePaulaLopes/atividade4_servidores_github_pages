from dataclasses import dataclass
from typing import Callable, Iterable
import os
import time
import psutil

@dataclass
class Resultado:
    modelo: str
    requisicoes: int
    workers: int
    repeticao: int
    tempo_total_s: float
    tempo_medio_ms: float
    throughput_req_s: float
    cpu_percent: float
    memoria_mb: float

def medir_execucao(modelo: str, requisicoes: int, workers: int,
                   repeticao: int, funcao: Callable, ids: Iterable[int]) -> Resultado:
    processo = psutil.Process(os.getpid())
    processo.cpu_percent(interval=None)
    memoria_antes = processo.memory_info().rss

    inicio = time.perf_counter()
    funcao(ids)
    tempo = time.perf_counter() - inicio

    cpu = processo.cpu_percent(interval=0.05)
    memoria_depois = processo.memory_info().rss
    memoria_mb = max(memoria_antes, memoria_depois) / (1024 * 1024)

    return Resultado(
        modelo=modelo,
        requisicoes=requisicoes,
        workers=workers,
        repeticao=repeticao,
        tempo_total_s=tempo,
        tempo_medio_ms=(tempo / requisicoes) * 1000 if requisicoes else 0,
        throughput_req_s=requisicoes / tempo if tempo > 0 else 0,
        cpu_percent=cpu,
        memoria_mb=memoria_mb,
    )
