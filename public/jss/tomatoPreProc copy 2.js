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
let label;
let datos;
let datosDS3;
let noFluo;


$("#demoUpload").click(function () {
  let names = [];

  $.ajax({
    type: "GET",
    url: "/upDemoData",
    data: {},
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
      color = randomColor({
        count: output.datosDS3.length,
        luminosity: "bright",
        format: "rgb",
      });
      var datosDS3String = output.datosDS3[0].map((str) => {
        return parseInt(str, 10);
      });
      dataset["0"].data[0].x = output.allLabels[0];
      dataset["0"].data[0].y = datosDS3String[0];

      for (let i = 1; i < output.allLabels.length; i++) {
        dataset["0"].data.push({
          x: output.allLabels[i],
          y: datosDS3String[i],
        });
      }

      for (let i = 1; i < output.datosDS3.length; i++) {
        datosDS3String = output.datosDS3[i].map((str) => {
          return parseInt(str, 10);
        });
        dataset.push({
          label: "RD " + (i + 1),
          data: [{ x: output.allLabels[0], y: datosDS3String[0] }],
          backgroundColor: color[i],
          borderWidth: 1,
          borderColor: color[i],
          pointRadius: 1,
          tension: 0,
          showLine: true,
        });
        for (let j = 1; j < output.allLabels.length; j++) {
          dataset[i].data.push({
            x: output.allLabels[j],
            y: datosDS3String[j],
          });
        }
      }
      myChart.update();
      label = output.allLabels;
      datos = output.datos;
      datosDS3 = output.datosDS3;
    },
  }).done(function (data) {
    //console.log(data);
    //alert(data);
  });
});

$("input[type=file]").on("change", function () {
  var fileInput = document.getElementById("input");
  var files = fileInput.files;
  var formData = new FormData();
  for (var i = 0; i < files.length; i++) {
    formData.append("files", files[i]);
  }
  $.ajax({
    url: "/upload",
    type: "POST",
    data: formData,
    processData: false,
    contentType: false,
    success: function (output) {
      color = randomColor({
        count: output.datosDS3.length,
        luminosity: "bright",
        format: "rgb",
      });
      var datosDS3String = output.datosDS3[0].map((str) => {
        return parseInt(str, 10);
      });
      dataset["0"].data[0].x = output.allLabels[0];
      dataset["0"].data[0].y = datosDS3String[0];

      for (let i = 1; i < output.allLabels.length; i++) {
        dataset["0"].data.push({
          x: output.allLabels[i],
          y: datosDS3String[i],
        });
      }

      for (let i = 1; i < output.datosDS3.length; i++) {
        datosDS3String = output.datosDS3[i].map((str) => {
          return parseInt(str, 10);
        });
        dataset.push({
          label: "RD " + (i + 1),
          data: [{ x: output.allLabels[0], y: datosDS3String[0] }],
          backgroundColor: color[i],
          borderWidth: 1,
          borderColor: color[i],
          pointRadius: 1,
          tension: 0,
          showLine: true,
        });
        console.log("1");
        for (let j = 1; j < output.allLabels.length; j++) {
          dataset[i].data.push({
            x: output.allLabels[j],
            y: datosDS3String[j],
          });
        }
      }
      console.log(myChart.data.dataset);
      myChart.update();
      label = output.allLabels;
      datos = output.datos;
      datosDS3 = output.datosDS3;
    },
  });
});

$("#bandShow").click(function () {
  var bandIndex = [];
  bands = bands.map((str) => Number(str));
  label.forEach((labelItem, i) => {
    bands.forEach((band, j) => {
      if (labelItem === band) {
        bandIndex[j] = i + 800;
      }
    });
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
  console.log(label);
  console.log(datos);
  console.log(datosDS3);
  $.ajax({
    url: "/dtw",
    type: "GET",
    data: {
      //label: label,
      //datos: datos,
      //datosDS3: datosDS3,
    },
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
    },
  });
});

$("#noFluo").click(function () {
  var polynomialDeg = document.querySelector("#polyDeg").value;
  var checkSavG = document.querySelector('#savGo');
  
  let sav = checkSavG.checked ? 1 : 0;

  $.ajax({
    url: "/noFluo",
    type: "POST",
    data: {
      polynomialDeg: polynomialDeg,
      sav: sav,
      //datosDS3: datosDS3,
    },
    dataType: "text",
    success: function (response) {
      output = JSON.parse(response);
      var datosDS3String = output.noFluo[0].map((str) => {
        return parseInt(str, 10);
      });
      dataset2["0"].data[0].x = label[0];
      dataset2["0"].data[0].y = datosDS3String[0];

      for (let i = 1; i < label.length; i++) {
        dataset2["0"].data.push({ x: label[i], y: datosDS3String[i] });
      }

      for (let i = 1; i < output.noFluo.length; i++) {
        datosDS3String = output.noFluo[i].map((str) => {
          return parseInt(str, 10);
        });
        dataset2.push({
          label: "NF " + (i + 1),
          data: [{ x: label[0], y: datosDS3String[0] }],
          backgroundColor: color[i],
          borderWidth: 1,
          borderColor: color[i],
          pointRadius: 0.5,
          tension: 0,
          showLine: true,
        });
        for (let j = 1; j < label.length; j++) {
          dataset2[i].data.push({ x: label[j], y: datosDS3String[j] });
        }
      }
      myChart2.update();
      noFluo = output.noFluo;
    },
  });
});
