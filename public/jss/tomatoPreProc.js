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
let color;
let annotations = [];
let plotted = 0;
let section = "";
let label;
let datos;
let datosDS3;
let noFluo = [];
let normal = [];
let ids;
let names = [];
var dataForDatasets = []
var dataForDatasets2 = []
var dataForDatasets3 = []

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

$("#demoUpload").click(function () {
  section = "RD ";
  $.ajax({
    type: "GET",
    url: "/upDemoData",
    data: {},
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
      color = output.color
      names = output.names;
      myChart.data.datasets = [];
      
      for (let i = 0; i < output.datosDS3.length; i++) {
        const datosDS3String = output.datosDS3[i].map((str) => parseInt(str, 10));
        dataForDatasets[i] = output.allLabels.map((label, j) => ({ x: label, y: datosDS3String[j] }));
        myChart.data.datasets.push({
          label: `RD ${i + 1}`,
          data: dataForDatasets[i],
          backgroundColor: color[i],
          borderWidth: 1,
          borderColor: color[i],
          pointRadius: 1,
          tension: 0,
          showLine: true,
        });
      }
      myChart.update();
      label = output.allLabels;
      datos = output.datos;
      datosDS3 = output.datosDS3;
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
    },
  }).done(function (data) {});
});

$("input[type=file]").on("change", function () {
  section = "RD ";
  var fileInput = document.getElementById("input");
  var files = fileInput.files;
  var formData = new FormData();
  for (var i = 0; i < files.length; i++) {formData.append("files", files[i])}
  $.ajax({
    url: "/upload",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (output) {
      label = output.allLabels;
      datos = output.datos;
      datosDS3 = output.datosDS3;
      color = output.color;
      names = output.names;
      var datosDS3String = datosDS3[0].map((str) => {return parseInt(str, 10)});
      dataset["0"].data[0].x = label[0];
      dataset["0"].data[0].y = datosDS3String[0];

      for (let i = 1; i < label.length; i++) {
        dataset["0"].data.push({
          x: label[i],
          y: datosDS3String[i],
        });
      }

      for (let i = 1; i < datosDS3.length; i++) {
        datosDS3String = datosDS3[i].map((str) => {
          return parseInt(str, 10);
        });
        dataset.push({
          label: "RD " + (i + 1),
          data: [{ x: label[0], y: datosDS3String[0] }],
          backgroundColor: color[i],
          borderWidth: 1,
          borderColor: color[i],
          pointRadius: 1,
          tension: 0,
          showLine: true,
        });
        for (let j = 1; j < label.length; j++) {
          dataset[i].data.push({
            x: label[j],
            y: datosDS3String[j],
          });
        }
      }
      myChart.update();
    },
  });
});

$("#bandShow").click(function () {
  var bandIndex = [];
  bands = bands.map((str) => Number(str));
  label.forEach((labelItem, i) => {
    bands.forEach((band, j) => {if (labelItem === band) {bandIndex[j] = i + 800}});
  });

  if (plotted == 0) {
    annotations = bandIndex.map((band, index) => ({
      type: "line",
      id: "vline" + index,
      xMin: band,
      xMax: band,
      borderColor: "rgba(50, 50, 50, 1)",
      borderWidth: 1.5,
      borderDash: [20, 5, 5, 5],
    }));
    plotted = 1;
  } else {
    annotations = [];
    plotted = 0;
  }
  myChart.options.plugins.annotation.annotations = annotations;
  myChart2.options.plugins.annotation.annotations = annotations;
  myChart.update();
  myChart2.update();
});

$("#dtw").click(function () {
  $.ajax({
    url: "/dtw",
    type: "POST",
    data: {dtwM: document.querySelector('#dtwMethod').value},
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
      for (var i = output.rem.length -1; i >= 0; i--) {
        if (output.rem[i] == 1) {
          undoStackDatos.pushState(datos[i]);
          undoStackDatosDS3.pushState(datosDS3[i]);
          myChart.data.datasets.splice(i, 1);
          var d1 = datos.splice(i, 1);
          var d2 = datosDS3.splice(i, 1);
          var d3 = 0;
          var d4 = 0;
          if (noFluo.length > 0) {d3 = 
            undoStackNoFluo.pushState(noFluo[i]);
            noFluo.splice(i, 1)
            myChart2.data.datasets.splice(i, 1)
            myChart2.update();
            } else {console.log("Array is empty")};
          if (normal.length > 0) {
            undoStackNormal.pushState(normal[i]);
            d4 = normal.splice(i, 1)
            } else {console.log("Array is empty")};
        }        
      }
      myChart.update();
      $.ajax({
        url: '/update-variable',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ 
          datos : datos,
          datosDS3 : datosDS3,
          noFluo : noFluo,
          normal : normal
        }),
        success: function(response) {},
      });
    },
  });
});

$("#noFluo").click(function () {
  section = "noFluo";
  $.ajax({
    url: "/noFluo",
    type: "POST",
    data: {
      polynomialDeg: document.querySelector("#polyDeg").value,
      sav: document.querySelector('#savGo').checked ? 1 : 0,
    },
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
      myChart2.data.datasets = [];
      ids = output.ids;
      for (let i = 0; i < output.noFluo.length; i++) {
        const datosDS3String = output.noFluo[i].map((str) => parseInt(str, 10));
        dataForDatasets2[i] = datosDS3String;
        myChart2.data.datasets.push({
          label: "NF " + output.ids[i],
          data: label.map((label, j) => ({ x: label, y: datosDS3String[j] })),
          backgroundColor: color[output.ids[i]-1],
          borderWidth: 1,
          borderColor: color[output.ids[i]-1],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        });
      }
      myChart2.update();
      noFluo = output.noFluo;
    },
  });
});

$("#normalize").click(function () {
  section = "normalized";
  $.ajax({
    url: "/normalize",
    type: "POST",
    data: {rm: document.getElementById('rmNeg').checked ? 0 : 1},
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
      ids = output.ids;
      myChart2.data.datasets = [];
      for (let i = 0; i < output.normal.length; i++) {
        const datosDS3String = output.normal[i].map((str) => parseFloat(str, 10));
        dataForDatasets3[i] = datosDS3String;
        myChart2.data.datasets.push({
          label: "NF " + ids[i],
          data: label.map((label, j) => ({ x: label, y: datosDS3String[j] })),
          backgroundColor: color[ids[i]-1],
          borderWidth: 1,
          borderColor: color[ids[i]-1],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        });
      }
      myChart2.update();
      normal = output.normal;
    },
  });
})

$("#restart" ).click(function() {location.reload()});

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
    label: `RD ${undone1[0]}`,
    data: dataForDatasets[undone1[0] - 1],
    backgroundColor: color[undone1[0] - 1],
    borderWidth: 1,
    borderColor: color[undone1[0] - 1],
    pointRadius: 1,
    tension: 0,
    showLine: true,
  });
  
  if (myChart2.data.datasets.length >= 2) {
      if (noFluo.length >= 1 && normal.length == 0) {
        myChart2.data.datasets.push({
          label: "NF " + undone1[0],
          data: label.map((label, j) => ({ x: label, y: dataForDatasets2[undone1[0] - 1][j] })),
          backgroundColor: color[undone1[0] - 1],
          borderWidth: 1,
          borderColor: color[undone1[0] - 1],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        }); 
      }
      if (normal.length >= 1) {
        myChart2.data.datasets.push({
          label: "NF " + undone1[0],
          data: label.map((label, j) => ({ x: label, y: dataForDatasets3[undone1[0] - 1][j] })),
          backgroundColor: color[undone1[0] - 1],
          borderWidth: 1,
          borderColor: color[undone1[0] - 1],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        }); 
      }
    myChart2.update();
  }
  myChart.update();
})

$("#undo2").click(function () {
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
    label: `RD ${undone1[0]}`,
    data: dataForDatasets[undone1[0] - 1],
    backgroundColor: color[undone1[0] - 1],
    borderWidth: 1,
    borderColor: color[undone1[0] - 1],
    pointRadius: 1,
    tension: 0,
    showLine: true,
  });
  
  if (myChart2.data.datasets.length >= 2) {
      if (noFluo.length >= 1 && normal.length == 0) {
        myChart2.data.datasets.push({
          label: "NF " + undone1[0],
          data: label.map((label, j) => ({ x: label, y: dataForDatasets2[undone1[0] - 1][j] })),
          backgroundColor: color[undone1[0] - 1],
          borderWidth: 1,
          borderColor: color[undone1[0] - 1],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        }); 
      }
      if (normal.length >= 1) {
        myChart2.data.datasets.push({
          label: "NF " + undone1[0],
          data: label.map((label, j) => ({ x: label, y: dataForDatasets3[undone1[0] - 1][j] })),
          backgroundColor: color[undone1[0] - 1],
          borderWidth: 1,
          borderColor: color[undone1[0] - 1],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        }); 
      }
    myChart2.update();
  }
  myChart.update();
})

function extractFirstNumber(array) {
  return array.flat().find(element => typeof element === 'number');
}