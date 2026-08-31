import time

def processar_requisicao(request_id: int) -> None:
    # Simula uma requisição que passa por uma espera de I/O.
    time.sleep(0.01)

def executar(ids) -> None:
    for request_id in ids:
        processar_requisicao(request_id)
