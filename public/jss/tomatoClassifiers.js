let bands = [
    "915",
    "1000",
    "1051",
    "1070",
    "1115",
    "1155",
    "1184",
    "1218",
    "1274",
    "1288",
    "1326",
    "1382",
    "1440",
    "1525",
    "1610",
    "1674",
  ];

let bandsComp = [
"Cellulose, lignin",
"Carotenoids, protein",
"Carbohydrates",
"Cellulose",
"Carbohydrates",
"Carbohydrates, Cellulose",
"Xylan",
"Aliphatic, xylan",
"Lignin",
"Aliphatic",
"Cellulose, lignin",
"Aliphatic",
"Aliphatic",
"Carotenoids",
"Lignin",
"Protein",
];
let layout = {
    showlegend: false,
    legend: {x: 1,xanchor: 'right',y: 0.5},
    title: {text:'PCAs',font: {family: 'Courier New, monospace',size: 16,}},
    scene:{
         aspectmode: "manual",
         aspectratio: {x: 1, y: 0.7, z: 1,},
         xaxis: {
             title: {
                    text: 'PCA 1',
                    font: {family: 'Courier New, monospace',size: 18,color: '#7f7f7f'}},
                nticks: 9,
        //	range: [-7, 7],
        },
         yaxis: {
             title: {
                    text: 'PCA 2',
                    font: {family: 'Courier New, monospace',size: 18,color: '#7f7f7f'}},
                nticks: 7,
        //	range: [-10, 10],
        },
         zaxis: {
             title: {
                    text: 'PCA 3',
                    font: {family: 'Courier New, monospace',size: 18,color: '#7f7f7f'}},
                 nticks: 10,
        // range: [-5, 6],
        }},
    margin: {t: 20, l: 20, r: 20, b: 20}
};
let color;
let annotations = [];
let plotted = 0;
let section = "";
let label;
let datos;
let datosDS3;
let noFluo = [];
let normal = [];
let target = [];
let ids;
let names = [];
let pred = [];
let data1 = [];
let trainingData = [];
let dess = 0;
let colors;
let diagNames;
let zeroes, ones, twos, samples, diagnosisName;
let responses = []
let responsesCONS = []
var dataForDatasets = []
let dessElement = document.querySelector('#dess');

class UndoStack {
    constructor() {this.stack = []}
    pushState(state) {this.stack.push(state)}
    undo() {return this.stack.pop()}
    canUndo() {return this.stack.length > 0}
  }
  
  let undoStackDatos = new UndoStack();
  let undoStackDatosDS3 = new UndoStack();
  let undoStackNoFluo = new UndoStack();
  let undoStackNormal = new UndoStack();

dessElement.addEventListener('change', (event) => {
  $.ajax({
    type: "POST",
    url: "/firstPlot",
    data: {dess: document.querySelector('#dess').value},
    dataType: "text",
    success: function (response) {
        output = JSON.parse(response);
        color = output.color;
        names = output.names;
        datos = output.datos;
        datosDS3 = output.datosDS3;
        noFluo = output.noFluo;
        normal = output.normal;
        allLabels = output.allLabels;
        ids = output.ids;
        target = output.target;
        trainingData = output.trainingData;
        data1 = output.data1;
        myChart.data.datasets = [];

        for (let i = 0; i < normal.length; i++) {
            const normalString = normal[i].map((str) => parseFloat(str, 10));
            myChart.data.datasets.push({
                label: `RD ${ids[i]}`,
                data: allLabels.map((label, j) => ({ x: label, y: normalString[j] })),
                backgroundColor: color[ids[i]-1],
                borderWidth: 1,
                borderColor: color[ids[i]-1],
                pointRadius: 0.5,
                tension: 0,
                showLine: true,
            });
        };

        if (dess == 0) {
            colors = target.map(t => {
                if (t === 0) return 'rgba(0, 0, 250, 1)';
                if (t === 1) return 'rgba(0, 255, 0, 1)';
                return 'rgba(0, 0, 0, 1)'; // Default color
            });
            diagNames = target.map(t => {
                if (t === 0) return 'CLso';
                if (t === 1) return 'Healthy';
                return 'None'; // Default color
            });
        } else if (dess == 1) {
            colors = target.map(t => {
                if (t === 0) return 'rgba(250, 0, 0, 1)';
                if (t === 1) return 'rgba(0, 255, 0, 1)';
                return 'rgba(0, 0, 0, 1)'; // Default color
            });
            diagNames = target.map(t => {
                if (t === 0) return 'Cmm';
                if (t === 1) return 'Healthy';
                return 'None'; // Default color
            });
        } else if (dess == 2) {
            colors = target.map(t => {
                if (t === 0) return 'rgba(0, 0, 250, 1)';
                if (t === 1) return 'rgba(250, 0, 0, 1)';
                if (t === 2) return 'rgba(0, 255, 0, 1)';
                return 'rgba(0, 0, 0, 1)'; // Default color
            });
            diagNames = target.map(t => {
                if (t === 0) return 'CLso';
                if (t === 1) return 'Cmm';
                if (t === 2) return 'Healthy';
                return 'None'; // Default color
            });
        }
            
            dataCSLO = {
                x: data1[0],
                y: data1[1],
                z: data1[2],
                mode:"markers",
                name: diagNames,
                text: diagNames,
                type:"scatter3d",
                marker: {color: colors, size: 5}
            };
        
        //var data0 = [dataCSLO, dataCMM, dataHealthy, dataTest];
        var data0 = [dataCSLO];
        Plotly.newPlot("3dplot", data0, layout, {displaylogo: false, willReadFrequently: true}, );
        
        myChart.update();
        label = output.allLabels;
        datos = output.datos;
        datosDS3 = output.datosDS3;
    },
    }).done(function (data) {});
});

function firstPlot() {
    dess = document.getElementById('dess').value;
    $.ajax({
        type: "POST",
        url: "/firstPlot",
        data: {dess: document.querySelector('#dess').value},
        dataType: "text",
        success: function (response) {
            output = JSON.parse(response);
            color = output.color;
            names = output.names;
            datos = output.datos;
            datosDS3 = output.datosDS3;
            noFluo = output.noFluo;
            normal = output.normal;
            allLabels = output.allLabels;
            ids = output.ids;
            target = output.target
            trainingData = output.trainingData;
            data1 = output.data1;
            myChart.data.datasets = [];

            for (let i = 0; i < normal.length; i++) {
                const normalString = normal[i].map((str) => parseFloat(str, 10));
                dataForDatasets[i] = normalString;
                myChart.data.datasets.push({
                    label: `RD ${ids[i]}`,
                    data: allLabels.map((label, j) => ({ x: label, y: normalString[j] })),
                    backgroundColor: color[ids[i]-1],
                    borderWidth: 1,
                    borderColor: color[ids[i]-1],
                    pointRadius: 0.5,
                    tension: 0,
                    showLine: true,
                });
            };
            colors = target.map(t => {
                if (t === 0) return 'rgba(0, 0, 250, 1)';
                if (t === 1) return 'rgba(250, 0, 0, 1)';
                if (t === 2) return 'rgba(0, 255, 0, 1)';
                return 'rgba(0, 0, 0, 1)'; // Default color
            });
            diagNames = target.map(t => {
                if (t === 0) return 'CLso';
                if (t === 1) return 'Cmm';
                if (t === 2) return 'Healthy';
                return 'None'; // Default color
            });
            dataCSLO = {
                x: data1[0],
                y: data1[1],
                z: data1[2],
                mode:"markers",
                name: diagNames,
                text: diagNames,
                type:"scatter3d",
                marker: {color: colors, size: 5}
            };
            
            //var data0 = [dataCSLO, dataCMM, dataHealthy, dataTest];
            var data0 = [dataCSLO];
            Plotly.newPlot("3dplot", data0, layout, {displaylogo: false, willReadFrequently: true}, );
            
            myChart.update();
            label = output.allLabels;
            datos = output.datos;
            datosDS3 = output.datosDS3;
        },
    }).done(function (data) {
    });
};

$("#PCA").click(function () {
    $.ajax({
        type: "GET",
        url: "/pca",
        data: {},
        dataType: "text",
        success: function (response) {
            annotations = []
            output = JSON.parse(response);
            var data1 = output.data1
            var higherLoadT = output.higherLoadT;
            annotations = higherLoadT.map(function(load, index) {
                return {
                    type: 'line',
                    id: 'vline' + index,
                    xMin: load,
                    xMax: load,
                    borderColor: 'rgba(50, 50, 50, 1)',
                    borderWidth: 1.5,
                    borderDash: [20, 5, 5, 5]
                }});
            myChart.options.plugins.annotation.annotations = annotations;
            myChart.update();
            var gd = document.getElementById('3dplot');
            removeTraceByName(gd, 'RD');
            Plotly.addTraces("3dplot", {
                x: data1[0],
                y: data1[1],
                z: data1[2],
                type: "scatter3d", 
                mode:"markers", 
                name: 'RD',
                text: 'Tested',
                marker: {
                    color: 'rgba(0, 0, 0, 1)', 
                    size: 8,
                }
            });
        },
      }).done(function (data) {
      });
});

$("#exportPCA").click(function () {
    $.ajax({
        type: "GET",
        url: "/exportPCA",
        data: {},
        dataType: "text",
        success: function (response) {
        }
      }).done(function (data) {});
});

$(document).on('click', '#exportMLP', function () {
    var expMLP = responses[responses.length - 1]
    var className = 'MLP'
    $.ajax({
        type: "GET",
        url: "/exportMLP",
        data: {
            data: expMLP,
            name: className
        },
        dataType: "text",
        success: function (response) {}
      }).done(function (data) {
      });
});

$(document).on('click', '#exportLSTM', function () {
    var expMLP = responses[responses.length - 1]
    var className = 'LSTM'
    $.ajax({
        type: "GET",
        url: "/exportMLP",
        data: {
            data: expMLP,
            name: className
        },
        dataType: "text",
        success: function (response) {}
      }).done(function (data) {
      });
});

$(document).on('click', '#exportLDA', function () {
    var expMLP = responses[responses.length - 1]
    var className = 'LDA'
    $.ajax({
        type: "GET",
        url: "/exportMLP",
        data: {
            data: expMLP,
            name: className
        },
        dataType: "text",
        success: function (response) {}
      }).done(function (data) {
      });
});

$(document).on('click', '#exportKNN', function () {
    var expMLP = responses[responses.length - 1]
    var className = 'KNN'
    $.ajax({
        type: "GET",
        url: "/exportMLP",
        data: {
            data: expMLP,
            name: className
        },
        dataType: "text",
        success: function (response) {}
      }).done(function (data) {
      });
});

$(document).on('click', '#exportPLS', function () {
    var expMLP = responses[responses.length - 1]
    var className = 'PLS'
    $.ajax({
        type: "GET",
        url: "/exportMLP",
        data: {
            data: expMLP,
            name: className
        },
        dataType: "text",
        success: function (response) {}
      }).done(function (data) {
      });
});

$(document).on('click', '#exportConcensus', function () {
    var expMLP = responsesCONS[responsesCONS.length - 1]
    var className = 'Consensus'
    $.ajax({
        type: "GET",
        url: "/exportCONS",
        data: {
            data: expMLP,
            name: className
        },
        dataType: "text",
        success: function (response) {}
      }).done(function (data) {
      });
});

$("#testMLP").click(function () {
    responses = []
    $.ajax({
        type: "GET",
        url: "/testMLP",
        data: {},
        dataType: "text",
        success: function (response) {
            const output = JSON.parse(response);
            zeroes = output.zeroes;
            ones = output.ones;
            twos = output.twos;
            samples = output.samples;
            diagnosisName = output.diagnosisName;
            var name = 'Multi-Layer Perceptron';
            var surname = 'MLP';
            responses.push(output)
            showResults(zeroes, ones, twos, samples, name, diagnosisName, surname);
        }
      }).done(function (data) {});
});

$("#testLSTM").click(function () {
    responses = []
    $.ajax({
        type: "GET",
        url: "/testLSTM",
        data: {},
        dataType: "text",
        success: function (response) {
            const output = JSON.parse(response);
            const { zeroes, ones, twos, samples, diagnosisName } = output;
            var name = 'Long Short-Term Memory Network';
            var surname = 'LSTM';
            responses.push(output)
            showResults(zeroes, ones, twos, samples, name, diagnosisName, surname);
        }
      }).done(function (data) {});
      
});

$("#testLDA").click(function () {
    responses = []
    $.ajax({
        type: "GET",
        url: "/testLDA",
        data: {},
        dataType: "text",
        success: function (response) {
            const output = JSON.parse(response);
            const { zeroes, ones, twos, samples, diagnosisName } = output;
            const name = 'Linear Discriminant Analisys';
            var surname = 'LDA';
            responses.push(output)
            showResults(zeroes, ones, twos, samples, name, diagnosisName, surname);
        }
      }).done(function (data) {});
      
});

$("#testKNN").click(function () {
    responses = []
    $.ajax({
        type: "GET",
        url: "/testKNN",
        data: {},
        dataType: "text",
        success: function (response) {
            const output = JSON.parse(response);
            const { zeroes, ones, twos, samples, diagnosisName } = output;
            const name = 'K-Nearest Neighbor';
            var surname = 'KNN';
            responses.push(output)
            showResults(zeroes, ones, twos, samples, name, diagnosisName, surname);
        }
      }).done(function (data) {});
});

$("#testPLS").click(function () {
    responses = []
    $.ajax({
        type: "GET",
        url: "/testPLS",
        data: {},
        dataType: "text",
        success: function (response) {
            const output = JSON.parse(response);
            const { zeroes, ones, twos, samples, diagnosisName } = output;
            const name = 'Partial Least Squares';
            var surname = 'PLS';
            responses.push(output)
            showResults(zeroes, ones, twos, samples, name, diagnosisName, surname);
        }
      }).done(function (data) {});
});

$("#testConcensus").click(function () {
    $.ajax({
        type: "GET",
        url: "/testConcensus",
        data: {},
        dataType: "text",
        success: function (response) {
            const output = JSON.parse(response);
            const { zMLP, zLSTM, zLDA, zKNN, zPLS, zCons, diagnosisMLP, diagnosisLSTM, diagnosisLDA, diagnosisKNN, diagnosisPLS, diagnosisCons } = output;
            responsesCONS.push(output)
            showResultsCons(zMLP, zLSTM, zLDA, zKNN, zPLS, zCons, diagnosisMLP, diagnosisLSTM, diagnosisLDA, diagnosisKNN, diagnosisPLS, diagnosisCons);
        }
      }).done(function (data) {});
});

$("#restart" ).click(function() {
    const content = document.getElementById("restart");
    content.load("tomato1.html")});

$("#undo").click(function () {
    var undone1 = undoStackDatos.undo();
    var undone2 = undoStackDatosDS3.undo();
    var undone3 = undoStackNoFluo.undo();
    var undone4 = undoStackNormal.undo();
    datos.push(undone1)
    datosDS3.push(undone2);
    if (undone3 !== undefined) {noFluo.push(undone3)}
    if (undone4 !== undefined) {normal.push(undone4)}
    
    $.ajax({
        url: '/update-variable',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
        datos : datos,
        datosDS3 : datosDS3,
        noFluo : noFluo,
        normal : normal,
        }),
        success: function(response) {
        },
    });
    ids = datos.map(extractFirstNumber);
    const datosDS3String = undone2.map((str) => parseInt(str, 10));
    myChart.data.datasets.push({
        label: "NF " + undone1[0],
        data: label.map((label, j) => ({ x: label, y: dataForDatasets[undone1[0] - 1][j] })),
        backgroundColor: color[undone1[0] - 1],
        borderWidth: 1,
        borderColor: color[undone1[0] - 1],
        pointRadius: 0.5,
        tension: 0,
        showLine: true,
        }); 
        
    myChart.update();
    })
/////////////////////////////////////////////////////////////////

function showResults(clso, cmm, healty, samples, name, diagnosis, surname) {
    const myModal = new bootstrap.Modal(document.getElementById('exampleModal'));
    const modalName = document.getElementById('classifierName');
    const modalSamples = document.getElementById('samples');
    const modalCLSO = document.getElementById('clso');
    const modalCMM = document.getElementById('cmm');
    const modalHEALTY = document.getElementById('healty');
    const modalResult = document.getElementById('result');
    const expButton = document.getElementsByClassName('modal1-exp')[0];
    expButton.id = `export${surname}`;
        
    clso = (clso / samples) * 100;
    cmm = (cmm / samples) * 100;
    healty = (healty / samples) * 100;
    modalName.innerText = name;
    modalSamples.innerText = samples;
    modalCLSO.innerText = clso.toFixed(2) + '%';
    modalCMM.innerText = cmm.toFixed(2) + '%';
    modalHEALTY.innerText = healty.toFixed(2) + '%';
    modalResult.innerText = diagnosis;
    myModal.show();
  }

function showResultsCons(zMLP, zLSTM, zLDA, zKNN, zPLS, zCons, diagnosisMLP, diagnosisLSTM, diagnosisLDA, diagnosisKNN, diagnosisPLS, diagnosisCons) {
    const myModal = new bootstrap.Modal(document.getElementById('exampleModal2'));
    const modaldMLP = document.getElementById('dMLP');
    const modalpMLP = document.getElementById('pMLP');
    const modaldLSTM = document.getElementById('dLSTM');
    const modalpLSTM = document.getElementById('pLSTM');
    const modaldLDA = document.getElementById('dLDA');
    const modalpLDA = document.getElementById('pLDA');
    const modaldKNN = document.getElementById('dKNN');
    const modalpKNN = document.getElementById('pKNN');
    const modaldPLS = document.getElementById('dPLS');
    const modalpPLS = document.getElementById('pPLS');
    const modaldCons = document.getElementById('dCons');
    const modalpCons = document.getElementById('pCons');
    const expButton = document.getElementsByClassName('modal2-exp')[0];
    expButton.id = `exportConcensus`;

    modaldMLP.innerText = diagnosisMLP;
    modalpMLP.innerText = zMLP.toFixed(2);
    modaldLSTM.innerText = diagnosisLSTM;
    modalpLSTM.innerText = zLSTM.toFixed(2);
    modaldLDA.innerText = diagnosisLDA;
    modalpLDA.innerText = zLDA.toFixed(2);
    modaldKNN.innerText = diagnosisKNN;
    modalpKNN.innerText = zKNN.toFixed(2);
    modaldPLS.innerText = diagnosisPLS;
    modalpPLS.innerText = zPLS.toFixed(2);
    modaldCons.innerText = diagnosisCons;
    modalpCons.innerText = zCons.toFixed(2);

    myModal.show();
}

function extractFirstNumber(array) {
    return array.flat().find(element => typeof element === 'number');
  }

function removeTraceByName(gd, name) {
    var index = -1;
    for(var i = 0; i < gd.data.length; i++) {
        if(gd.data[i].name === name) {
            index = i;
            break;
        }
    }
    if(index !== -1) {
        Plotly.deleteTraces(gd, index);
    }
}