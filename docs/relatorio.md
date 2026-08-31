# Relatório — Servidores Single-Thread e Multi-Thread

## 1. Introdução
O trabalho implementa e compara dois modelos de processamento de requisições: Single-Thread e Multi-Thread.

## 2. Objetivos
- Implementar os dois modelos.
- Simular requisições.
- Medir tempo total, tempo médio, throughput, CPU e memória.
- Comparar os resultados.
- Identificar vantagens, desvantagens e cenários de uso.

## 3. Implementação
O Single-Thread usa processamento sequencial. O Multi-Thread usa `ThreadPoolExecutor`.

O workload simula uma pequena espera de I/O com `time.sleep(0.01)`. Isso permite observar a concorrência de threads em uma carga com espera.

## 4. Metodologia
Foram usadas diferentes quantidades de requisições e múltiplas repetições. Os resultados oficiais devem ser gerados executando `python src/benchmark.py`.

## 5. Análise
Para workloads com espera de I/O, o Multi-Thread tende a reduzir o tempo total. Porém, threads aumentam a complexidade e o consumo de recursos.

Em workloads CPU-bound, o GIL do CPython pode limitar ganhos com threads; nesse caso, processos ou outras estratégias podem ser mais adequados.

## 6. Conclusão
Single-Thread privilegia simplicidade e previsibilidade. Multi-Thread privilegia concorrência e é especialmente interessante quando há operações de I/O concorrentes.
