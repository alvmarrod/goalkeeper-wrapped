
/* 
  Per user: 
  - [Radar] per gift type - total amount the user at the end of the year
  
  Per gift type:
  - [Pie] per user - total amount the user at the end of the year
  - [Time Scale] - total amount of gifts per user at the end of each month

  Goals:
  - [Pie] per user - total amount the user at the end of the year
  - [Time Scale] - total amount of goals per user at the end of each year

  Honor:
  - [Pie] per user - total amount the user at the end of the year
  - [Pie] per honor type - total amount the user at the end of the year
  - [Time Scale] - total amount of honor per user and month

  Factcheck:
  - [Pie] per user - total amount the user at the end of the year
  - [Time Scale] - total amount of factchecks at the end of each month

  Effects:
  - Delay
  - Progressive line
*/

/*
    TOP LEVEL FUNCTIONS
*/

async function generateGraphs(elementId) {

    const graphsElement = document.getElementById(elementId);
    var groupSeparator;

    // 2. Goals
    // - [Pie] per user - total amount the user at the end of the year
    // - [Time Scale] - total amount of goals per user at the end of each year
    const goalsDiv = document.createElement('div');
    goalsDiv.id = 'goalsGroup';
    graphsElement.appendChild(goalsDiv);
    groupSeparator = document.createElement('div');
    groupSeparator.className = 'group-separator';
    graphsElement.appendChild(groupSeparator);

    const goalsData = await loadCSV("goals_accumulated.csv");
    plotTimeScaleGraph(goalsDiv, "goalsGraph", goalsData, "Goles", "Month", "Accumulated Goals", "User");

    const goalsPerMonthData = await loadCSV("goals_per_month.csv");
    plotBarGraph(goalsDiv, "goalsPerMonthGraph", goalsPerMonthData, "Goles por mes", "Month", "Month Goals", "User");

    // 3. Gifts
    // - [Pie] per user - total amount the user at the end of the year
    // - [Time Scale] - total amount of gifts per user at the end of each year
    const giftsDiv = document.createElement('div');
    giftsDiv.id = 'giftsGroup';
    graphsElement.appendChild(giftsDiv);
    groupSeparator = document.createElement('div');
    groupSeparator.className = 'group-separator';
    graphsElement.appendChild(groupSeparator);

    const giftsPerMonthData = await loadCSV("gifts_accumulated_per_month.csv");
    plotTimeScaleGraph(giftsDiv, "giftsGraph", giftsPerMonthData, "Premios", "Month", "Accumulated Amount", "User");

    const giftsPerUserAndTypeData = await loadCSV("gifts_per_type_and_user.csv");
    // We plot a graph per user. In the CSV, each user has several rows, one per type of gift.
    var dataPerUser = {};
    giftsPerUserAndTypeData.forEach(row => {
        const user = row.User;
        if (!dataPerUser[user]) {
            dataPerUser[user] = [];
        }
        dataPerUser[user].push(row);
    });

    for (const user in dataPerUser) {
        const userGifts = dataPerUser[user];
        plotRadarGraph(giftsDiv, "giftsPerUserAndTypeGraph" + user, userGifts, "Premios - " + user, "Premio", "Amount", user);
    }

    // 4. Honor
    // - [Pie] per user - total amount the user at the end of the year
    // - [Pie] per honor type - total amount the user at the end of the year
    const honorDiv = document.createElement('div');
    honorDiv.id = 'honorGroup';
    graphsElement.appendChild(honorDiv);
    groupSeparator = document.createElement('div');
    groupSeparator.className = 'group-separator';
    graphsElement.appendChild(groupSeparator);

    const honorPerUserAndMonthData = await loadCSV("honor_accumulated_per_month.csv");
    plotTimeScaleGraph(honorDiv, "honorGraph", honorPerUserAndMonthData, "Honor", "Month", "Accumulated Amount", "User");

    const honorPerTypeData = await loadCSV("honor_per_type.csv");
    plotPieGraph(honorDiv, "honorGraph", honorPerTypeData, "Honor por tipo", "Honor", "Amount");

    const honorPerUser = await loadCSV("honor_per_user.csv");
    plotPieGraph(honorDiv, "honorPerTypeGraph", honorPerUser, "Honor por persona", "User", "Amount");

    // 5. Factcheck
    // - [Pie] per user - total amount the user at the end of the year
    // - [Time Scale] - total amount of factchecks per user at the end of each year

    const factcheckDiv = document.createElement('div');
    factcheckDiv.id = 'factcheckGroup';
    graphsElement.appendChild(factcheckDiv);
    groupSeparator = document.createElement('div');
    groupSeparator.className = 'group-separator';
    graphsElement.appendChild(groupSeparator);

    const factcheckPerMonthData = await loadCSV("factcheck_accumulated_per_month.csv");
    plotTimeScaleGraph(factcheckDiv, "factcheckGraph", factcheckPerMonthData, "Factcheck", "Month", "Accumulated Amount", "User");

    const factcheckPerUser = await loadCSV("factcheck_per_user.csv");
    plotPieGraph(factcheckDiv, "factcheckPerUserGraph", factcheckPerUser, "Factcheck por persona", "User", "Amount");

    return null;
}

/*
    PER OBJECT TYPE LEVEL FUNCTIONS: Goals, Gifts, Honor
*/


/*
    AUXILIARY FUNCTIONS
*/

// Function to get a color from a predefined pool of colors
const colorMap = new Map();

function getColorFromPool(user) {
    const colorPool = [
        '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5', 
        '#FF8C33', '#8CFF33', '#338CFF', '#FF338C', '#8C33FF', '#33FF8C',
        '#FF33A1', '#A133FF', '#33FFF5', '#FF8C33', '#8CFF33', '#338CFF'
    ];

    if (!colorMap.has(user)) {
        // console.log('User:', user, 'Color:', colorPool[colorMap.size]);
        colorMap.set(user, colorPool[colorMap.size]);
    }

    return colorMap.get(user);
}

// Converts a CSV string into an array of dictionaries
// where each dictionary represents a row in the CSV file
// and the keys are the column names, which are expected
// to be in the first row of the CSV file.
function CSVToArray( strData ){

    const rows = strData.split('\n');
    const headers = rows[0].split(',');
    const array = rows.slice(1).map(row => {
      const values = row.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });

    //console.log("ARRAY Es un array: " + Array.isArray(array));
    return array;
        
}

async function loadCSV(filename) {
    const dataFilePath = "../data/" + filename;

    try {
        const response = await fetch(dataFilePath);
        const text = await response.text();
        const data = CSVToArray(text);
        return data;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Plots a radar graph with the vector provided as argument
// using chartjs library from: https://www.chartjs.org/docs/latest/charts/radar.html
function plotRadarGraph(parentDiv, elementId, data, title, xLabelColumn, yLabelColumn, user) {

    // Verificar que data es un array
    if (!Array.isArray(data)) {
        console.error('Error: data is not an array, but a ' + typeof data);
        return;
    }

    const newTitle = document.createElement('h3');
    newTitle.innerHTML = title;
    parentDiv.appendChild(newTitle);

    const newCanvas = document.createElement('canvas');
    newCanvas.id = elementId;
    newCanvas.width = 300;
    newCanvas.height = 200;
    parentDiv.appendChild(newCanvas);

    const newSeparator = document.createElement('div');
    newSeparator.className = 'separator';
    parentDiv.appendChild(newSeparator);

    const ctx = newCanvas.getContext('2d');

    // Plot the data, which is a list of dictionaries, where each dictionary
    // represents a row in the CSV file and the keys are the column names.
    // This is a radar graph, so we need to provide the labels and the data, only 2 dimensions.
    const labels = data.map(row => row[xLabelColumn]);
    const dataSeries = data.map(row => parseFloat(row[yLabelColumn]));

    const radarGraph = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: dataSeries,
                backgroundColor: getColorFromPool(user) + '80', // Adding transparency manually
                borderColor: getColorFromPool(user),
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                r: {
                    min: 0,
                    angleLines: {
                        color: 'rgb(255, 255, 255)'
                    },
                    grid: {
                        color: 'rgb(255, 255, 255)'
                    },
                    pointLabels: {
                        color: getColorFromPool(user),
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    ticks: {
                        precision: 0,
                        beginAtZero: true,
                        showLabelBackdrop: true,
                        backdropColor: 'rgb(0, 0, 0)',
                        color: getColorFromPool(user),
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });

    return radarGraph;
}

// Plots a pie graph with the vector provided as argument
// using chartjs library from: https://www.chartjs.org/docs/latest/charts/pie.html
function plotPieGraph(parentDiv, elementId, data, title, xLabelColumn, yLabelColumn) {

    // Verificar que data es un array
    if (!Array.isArray(data)) {
        console.error('Error: data is not an array, but a ' + typeof data);
        return;
    }

    const newTitle = document.createElement('h3');
    newTitle.innerHTML = title;
    parentDiv.appendChild(newTitle);

    const newCanvas = document.createElement('canvas');
    newCanvas.id = elementId;
    newCanvas.width = 300;
    newCanvas.height = 200;
    parentDiv.appendChild(newCanvas);

    const newSeparator = document.createElement('div');
    newSeparator.className = 'separator';
    parentDiv.appendChild(newSeparator);

    const ctx = newCanvas.getContext('2d');

    // Plot the data, which is a list of dictionaries, where each dictionary
    // represents a row in the CSV file and the keys are the column names.
    // This is a pie chart, so we need to provide the labels and the data, only 2 dimensions.
    const labels = data.map(row => row[xLabelColumn]);
    const dataSeries = data.map(row => parseFloat(row[yLabelColumn]));

    const pieGraph = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: title,
                data: dataSeries,
                backgroundColor: labels.map(label => getColorFromPool(label)),
                borderColor: labels.map(label => getColorFromPool(label)),
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    return pieGraph;
}

// Plots a bar graph with the vector provided as argument
// using chartjs library from: https://www.chartjs.org/docs/latest/charts/bar.html
function plotBarGraph(parentDiv, elementId, data, title, xLabelColumn, yLabelColumn, seriesColumn, stacked) {
    
    // Verificar que data es un array
    if (!Array.isArray(data)) {
        console.error('Error: data is not an array, but a ' + typeof data);
        return;
    }

    const newTitle = document.createElement('h3');
    newTitle.innerHTML = title;
    parentDiv.appendChild(newTitle);

    const newCanvas = document.createElement('canvas');
    newCanvas.id = elementId;
    newCanvas.width = 800;
    newCanvas.height = 400;
    parentDiv.appendChild(newCanvas);

    const newSeparator = document.createElement('div');
    newSeparator.className = 'separator';
    parentDiv.appendChild(newSeparator);

    const ctx = newCanvas.getContext('2d');

    // Plot the data, which is a list of dictionaries, where each dictionary
    // represents a row in the CSV file and the keys are the column names.
    // xLabelColumn is the name of the column that contains the x-axis labels
    // yLabelColumn is the name of the column that contains the y-axis labels
    // seriesColumn is the name of the column that contains the series labels
    // Transformar los datos en el formato adecuado para Chart.js
    const datasets = data.reduce((acc, row) => {
        const xLabel = row[xLabelColumn];
        const series = row[seriesColumn];
        const yLabel = row[yLabelColumn];

        // console.log("xLabel: " + xLabel + " series: " + series + " yLabel: " + yLabel);

        let dataset = acc.find(d => d.label === series);
        if (!dataset) {
            dataset = {
                label: series,
                data: [],
                fill: false,
                backgroundColor: getColorFromPool(series),
                borderColor: getColorFromPool(series),
                tension: 0.1
            };
            acc.push(dataset);
        }
        dataset.data.push({ x: xLabel, y: parseFloat(yLabel) });
        return acc;
    }, []);

    // Verificar los datos transformados
    // console.log('Datasets:', datasets);

    // Crear el gráfico de líneas
    const barGraph = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    title: {
                        display: true,
                        text: xLabelColumn
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yLabelColumn
                    },
                    ticks: {
                        callback: function(value) {
                            return value; // Mostrar los valores del eje Y
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    return barGraph;
}

// Plots a time scale graph with the vector provided as argument
// using chartjs library from: https://www.chartjs.org/docs/latest/charts/line.html
function plotTimeScaleGraph(parentDiv, elementId, data, title, xLabelColumn, yLabelColumn, seriesColumn) {

    // Verificar que data es un array
    if (!Array.isArray(data)) {
        console.error('Error: data is not an array, but a ' + typeof data);
        return;
    }

    const newTitle = document.createElement('h3');
    newTitle.innerHTML = title;
    parentDiv.appendChild(newTitle);

    const newCanvas = document.createElement('canvas');
    newCanvas.id = elementId;
    newCanvas.width = 800;
    newCanvas.height = 400;
    parentDiv.appendChild(newCanvas);

    const newSeparator = document.createElement('div');
    newSeparator.className = 'separator';
    parentDiv.appendChild(newSeparator);

    const ctx = newCanvas.getContext('2d');

    // Plot the data, which is a list of dictionaries, where each dictionary
    // represents a row in the CSV file and the keys are the column names.
    // xLabelColumn is the name of the column that contains the x-axis labels
    // yLabelColumn is the name of the column that contains the y-axis labels
    // seriesColumn is the name of the column that contains the series labels
    // Transformar los datos en el formato adecuado para Chart.js
    const datasets = data.reduce((acc, row) => {
        const xLabel = row[xLabelColumn];
        const series = row[seriesColumn];
        const yLabel = row[yLabelColumn];

        // console.log("xLabel: " + xLabel + " series: " + series + " yLabel: " + yLabel);

        let dataset = acc.find(d => d.label === series);
        if (!dataset) {
            dataset = {
                label: series,
                data: [],
                fill: false,
                borderColor: getColorFromPool(series),
                tension: 0.1
            };
            acc.push(dataset);
        }
        dataset.data.push({ x: xLabel, y: parseFloat(yLabel) });
        return acc;
    }, []);

    // Verificar los datos transformados
    // console.log('Datasets:', datasets);

    // Crear el gráfico de líneas
    const timeScaleGraph = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    title: {
                        display: true,
                        text: xLabelColumn
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: yLabelColumn
                    },
                    ticks: {
                        callback: function(value) {
                            return value; // Mostrar los valores del eje Y
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    return timeScaleGraph;
}