const DATA_URL = "data/benchmark.csv";

let data = [];
let filtered = [];

const $ = (id) => document.getElementById(id);


// ============================================================
// LEITURA DO CSV
// ============================================================

function csv(text) {
    const lines = text.trim().split(/\r?\n/);

    const headers = lines[0].split(",");

    return lines.slice(1).map((line) => {

        const values = line.split(",");
        const row = {};

        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim();
        });

        // Campos numéricos inteiros
        ["requisicoes", "workers", "repeticao"].forEach((key) => {
            row[key] = Number(row[key]);
        });

        // Campos numéricos decimais
        [
            "tempo_total_s",
            "tempo_medio_ms",
            "throughput_req_s",
            "cpu_percent",
            "memoria_mb"
        ].forEach((key) => {
            row[key] = Number(row[key]);
        });

        return row;
    });
}


// ============================================================
// MÉDIA
// ============================================================

function avg(rows, key) {

    if (!rows.length) {
        return 0;
    }

    return rows.reduce((sum, row) => {
        return sum + Number(row[key] || 0);
    }, 0) / rows.length;
}


// ============================================================
// AGRUPAMENTO DOS RESULTADOS
// ============================================================

function grouped(rows) {

    const map = new Map();

    rows.forEach((row) => {

        const key = `${row.modelo}|${row.requisicoes}`;

        if (!map.has(key)) {
            map.set(key, []);
        }

        map.get(key).push(row);
    });

    return [...map.values()].map((group) => ({

        ...group[0],

        tempo_total_s:
            avg(group, "tempo_total_s"),

        tempo_medio_ms:
            avg(group, "tempo_medio_ms"),

        throughput_req_s:
            avg(group, "throughput_req_s"),

        cpu_percent:
            avg(group, "cpu_percent"),

        memoria_mb:
            avg(group, "memoria_mb")

    }));
}


// ============================================================
// FILTROS
// ============================================================

function filters() {

    const requestValues = [
        ...new Set(data.map((row) => row.requisicoes))
    ].sort((a, b) => a - b);

    const repetitionValues = [
        ...new Set(data.map((row) => row.repeticao))
    ].sort((a, b) => a - b);


    $("requestFilter").innerHTML =
        '<option value="all">Todas</option>' +
        requestValues
            .map((value) => {
                return `<option value="${value}">${value}</option>`;
            })
            .join("");


    $("repFilter").innerHTML =
        '<option value="avg">Média</option>' +
        repetitionValues
            .map((value) => {
                return `<option value="${value}">Repetição ${value}</option>`;
            })
            .join("");
}


// ============================================================
// APLICAR FILTROS
// ============================================================

function apply() {

    const requestValue = $("requestFilter").value;
    const repetitionValue = $("repFilter").value;


    filtered = data.filter((row) => {

        const requestOk =
            requestValue === "all" ||
            row.requisicoes === Number(requestValue);


        const repetitionOk =
            repetitionValue === "avg" ||
            row.repeticao === Number(repetitionValue);


        return requestOk && repetitionOk;
    });


    render();
}


// ============================================================
// RENDERIZAÇÃO DA TABELA E INDICADORES
// ============================================================

function render() {

    const rows = filtered.length ? filtered : data;


    if (!rows.length) {
        $("body").innerHTML = `
            <tr>
                <td colspan="7">
                    Nenhum resultado encontrado.
                </td>
            </tr>
        `;

        return;
    }


    // Melhor tempo
    const bestTime = [...rows]
        .sort((a, b) => a.tempo_total_s - b.tempo_total_s)[0];


    // Melhor throughput
    const bestThroughput = [...rows]
        .sort((a, b) => b.throughput_req_s - a.throughput_req_s)[0];


    $("bestTime").textContent =
        bestTime.tempo_total_s.toFixed(2) + " s";

    $("bestTimeLabel").textContent =
        bestTime.modelo;


    $("bestThroughput").textContent =
        bestThroughput.throughput_req_s.toFixed(1) + " req/s";

    $("bestThroughputLabel").textContent =
        bestThroughput.modelo;


    $("totalRequests").textContent =
        Math.max(...rows.map((row) => row.requisicoes));


    const multiThread = rows.find(
        (row) => row.modelo === "Multi-Thread"
    );


    $("workerCount").textContent =
        multiThread ? multiThread.workers : "—";


    // ========================================================
    // TABELA
    // ========================================================

    const tableRows =
        $("repFilter").value === "avg"
            ? grouped(rows)
            : rows;


    tableRows.sort((a, b) => {

        if (a.requisicoes !== b.requisicoes) {
            return a.requisicoes - b.requisicoes;
        }

        return a.modelo.localeCompare(b.modelo);
    });


    $("body").innerHTML = tableRows.map((row) => {

        return `
            <tr>
                <td>${row.modelo}</td>

                <td>${row.requisicoes}</td>

                <td>
                    ${row.tempo_total_s.toFixed(3)} s
                </td>

                <td>
                    ${row.tempo_medio_ms.toFixed(2)} ms
                </td>

                <td>
                    ${row.throughput_req_s.toFixed(2)} req/s
                </td>

                <td>
                    ${row.cpu_percent.toFixed(1)}%
                </td>

                <td>
                    ${row.memoria_mb.toFixed(1)} MB
                </td>
            </tr>
        `;

    }).join("");


    drawAll();
}


// ============================================================
// DADOS DOS GRÁFICOS
// ============================================================

function chartData(metric) {

    const rows = filtered.length ? filtered : data;

    const groupedData = grouped(rows);


    const labels = [
        ...new Set(
            groupedData.map((row) => row.requisicoes)
        )
    ].sort((a, b) => a - b);


    const single = labels.map((number) => {

        const row = groupedData.find(
            (item) =>
                item.modelo === "Single-Thread" &&
                item.requisicoes === number
        );

        return row ? row[metric] : null;
    });


    const multi = labels.map((number) => {

        const row = groupedData.find(
            (item) =>
                item.modelo === "Multi-Thread" &&
                item.requisicoes === number
        );

        return row ? row[metric] : null;
    });


    return {
        labels,
        single,
        multi
    };
}


// ============================================================
// CONFIGURAÇÃO DO CANVAS
// ============================================================

function setup(canvas) {

    const ratio = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;


    const context = canvas.getContext("2d");

    context.scale(ratio, ratio);


    return [
        context,
        rect.width,
        rect.height
    ];
}


// ============================================================
// GRÁFICO DE LINHA
// ============================================================

function lineChart(canvas, chart) {

    const [ctx, width, height] = setup(canvas);


    const padding = {
        left: 48,
        right: 18,
        top: 25,
        bottom: 42
    };


    const values = [
        ...chart.single,
        ...chart.multi
    ].filter(
        (value) => value !== null
    );


    if (!values.length) {
        return;
    }


    const max = Math.max(...values, 1);


    const X = (index) => {

        return padding.left +
            index *
            (width - padding.left - padding.right) /
            Math.max(chart.labels.length - 1, 1);
    };


    const Y = (value) => {

        return height -
            padding.bottom -
            (value / max) *
            (height - padding.top - padding.bottom);
    };


    ctx.clearRect(0, 0, width, height);

    ctx.font = "11px system-ui";


    // Linhas horizontais
    for (let i = 0; i < 5; i++) {

        const y =
            padding.top +
            i *
            (height - padding.top - padding.bottom) /
            4;


        ctx.strokeStyle = "#ddd";

        ctx.beginPath();

        ctx.moveTo(padding.left, y);

        ctx.lineTo(
            width - padding.right,
            y
        );

        ctx.stroke();


        ctx.fillStyle = "#777";

        ctx.fillText(
            (max * (1 - i / 4)).toFixed(
                max < 10 ? 1 : 0
            ),
            5,
            y + 4
        );
    }


    // Duas linhas
    [
        {
            name: "Single-Thread",
            values: chart.single,
            color: "#222"
        },
        {
            name: "Multi-Thread",
            values: chart.multi,
            color: "#9bbd17"
        }
    ].forEach((series) => {

        ctx.strokeStyle = series.color;

        ctx.lineWidth = 3;

        ctx.beginPath();


        series.values.forEach((value, index) => {

            if (value === null) {
                return;
            }


            if (index === 0) {

                ctx.moveTo(
                    X(index),
                    Y(value)
                );

            } else {

                ctx.lineTo(
                    X(index),
                    Y(value)
                );
            }
        });


        ctx.stroke();


        // Pontos
        series.values.forEach((value, index) => {

            if (value === null) {
                return;
            }


            ctx.fillStyle = series.color;

            ctx.beginPath();

            ctx.arc(
                X(index),
                Y(value),
                4,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });
    });


    // Eixo X
    ctx.fillStyle = "#777";

    chart.labels.forEach((label, index) => {

        ctx.fillText(
            label,
            X(index) - 8,
            height - 15
        );
    });
}


// ============================================================
// GRÁFICO DE BARRAS
// ============================================================

function barChart(canvas, chart) {

    const [ctx, width, height] = setup(canvas);


    const padding = {
        left: 45,
        right: 15,
        top: 25,
        bottom: 45
    };


    const values = [
        ...chart.single,
        ...chart.multi
    ].filter(
        (value) => value !== null
    );


    if (!values.length) {
        return;
    }


    const max = Math.max(...values, 1);


    const groupWidth =
        (width - padding.left - padding.right) /
        Math.max(chart.labels.length, 1);


    const barWidth =
        Math.min(28, groupWidth / 3);


    const Y = (value) => {

        return height -
            padding.bottom -
            (value / max) *
            (height - padding.top - padding.bottom);
    };


    ctx.clearRect(0, 0, width, height);

    ctx.font = "11px system-ui";


    // Linhas horizontais
    for (let i = 0; i < 5; i++) {

        const y =
            padding.top +
            i *
            (height - padding.top - padding.bottom) /
            4;


        ctx.strokeStyle = "#ddd";

        ctx.beginPath();

        ctx.moveTo(padding.left, y);

        ctx.lineTo(
            width - padding.right,
            y
        );

        ctx.stroke();


        ctx.fillStyle = "#777";

        ctx.fillText(
            (max * (1 - i / 4)).toFixed(
                max < 10 ? 1 : 0
            ),
            5,
            y + 4
        );
    }


    // Barras
    chart.labels.forEach((label, index) => {

        const center =
            padding.left +
            index * groupWidth +
            groupWidth / 2;


        [
            chart.single[index],
            chart.multi[index]
        ].forEach((value, seriesIndex) => {

            if (value === null) {
                return;
            }


            ctx.fillStyle =
                seriesIndex === 0
                    ? "#222"
                    : "#9bbd17";


            const x =
                center +
                (seriesIndex - 0.5) *
                (barWidth + 4);


            const y = Y(value);


            ctx.fillRect(
                x,
                y,
                barWidth,
                height - padding.bottom - y
            );
        });


        ctx.fillStyle = "#777";

        ctx.fillText(
            label,
            center - 9,
            height - 15
        );
    });
}


// ============================================================
// DESENHAR TODOS OS GRÁFICOS
// ============================================================

function drawAll() {

    lineChart(
        $("timeChart"),
        chartData("tempo_total_s")
    );


    lineChart(
        $("throughputChart"),
        chartData("throughput_req_s")
    );


    barChart(
        $("cpuChart"),
        chartData("cpu_percent")
    );


    barChart(
        $("memoryChart"),
        chartData("memoria_mb")
    );
}


// ============================================================
// CARREGAR CSV
// ============================================================

async function load() {

    try {

        console.log("Carregando:", DATA_URL);


        const response =
            await fetch(DATA_URL);


        if (!response.ok) {

            throw new Error(
                `Erro HTTP ${response.status}`
            );
        }


        const text =
            await response.text();


        console.log(
            "CSV carregado:",
            text.substring(0, 200)
        );


        data = csv(text);


        console.log(
            "Registros carregados:",
            data.length
        );


        if (!data.length) {

            throw new Error(
                "O CSV está vazio."
            );
        }


        filters();

        apply();


    } catch (error) {

        console.error(
            "Erro ao carregar benchmark:",
            error
        );


        $("body").innerHTML = `
            <tr>
                <td colspan="7">
                    Erro ao carregar os resultados.
                    <br>
                    <small>
                        ${error.message}
                    </small>
                </td>
            </tr>
        `;
    }
}


// ============================================================
// EVENTOS
// ============================================================

$("requestFilter").addEventListener(
    "change",
    apply
);


$("repFilter").addEventListener(
    "change",
    apply
);


$("reset").addEventListener(
    "click",
    () => {

        $("requestFilter").value = "all";

        $("repFilter").value = "avg";

        apply();
    }
);


window.addEventListener(
    "resize",
    drawAll
);


// ============================================================
// INICIAR
// ============================================================

load();