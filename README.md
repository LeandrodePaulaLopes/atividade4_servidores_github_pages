# Atividade 4 — Servidores Single-Thread e Multi-Thread

Projeto acadêmico com lógica em Python e apresentação em HTML/CSS/JavaScript para GitHub Pages.

## Executar
```bash
pip install -r requirements.txt
python src/benchmark.py
```

O benchmark grava os resultados diretamente em `site/data/benchmark.csv`.

Exemplo:
```bash
python src/benchmark.py --requests 10 50 100 250 500 1000 --repetitions 5 --workers 8
```

## Publicar no GitHub Pages
No GitHub: Settings → Pages → Deploy from a branch → branch `main` → pasta `/site`.

## Observação
Os dados que acompanham o projeto são demonstrativos. Execute o benchmark no seu computador antes da entrega para substituir os números pelos resultados reais.
