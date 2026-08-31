from concurrent.futures import ThreadPoolExecutor
import os
import time

def processar_requisicao(request_id: int) -> None:
    # Simula a mesma carga usada no Single-Thread.
    time.sleep(0.01)

def executar(ids, workers: int | None = None) -> None:
    workers = workers or min(32, (os.cpu_count() or 2) + 4)
    with ThreadPoolExecutor(max_workers=workers) as executor:
        list(executor.map(processar_requisicao, ids))
