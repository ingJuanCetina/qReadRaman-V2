const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const { PCA } = require('ml-pca');

const server = http.createServer(app);
const router = express.Router();
const fs = require("fs");
const numeric = require('numeric');
const { createObjectCsvWriter } = require('csv-writer');
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./uploads/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
var randomColor = require('randomcolor');

var synaptic = require('synaptic'); // this line is not needed in the browser
const { log } = require("console");
var Neuron = synaptic.Neuron,
		Layer = synaptic.Layer,
		Network = synaptic.Network,
		Trainer = synaptic.Trainer,
		Architect = synaptic.Architect;

function Perceptron(input, hidden, output){
  var inputLayer = new Layer(input);
  var hiddenLayer = new Layer(hidden);
  var outputLayer = new Layer(output);

  inputLayer.project(hiddenLayer);
  hiddenLayer.project(outputLayer);

  this.set({
    input: inputLayer,
    hidden: [hiddenLayer],
    output: outputLayer
  });
}
function LSTM(input, blocks, output){
  var inputLayer = new Layer(input);
  var inputGate = new Layer(blocks);
  var forgetGate = new Layer(blocks);
  var memoryCell = new Layer(blocks);
  var outputGate = new Layer(blocks);
  var outputLayer = new Layer(output);

  var input = inputLayer.project(memoryCell);
  inputLayer.project(inputGate);
  inputLayer.project(forgetGate);
  inputLayer.project(outputGate);

  var output = memoryCell.project(outputLayer);

  var self = memoryCell.project(memoryCell);

  memoryCell.project(inputGate);
  memoryCell.project(forgetGate);
  memoryCell.project(outputGate);

  inputGate.gate(input, Layer.gateType.INPUT);
  forgetGate.gate(self, Layer.gateType.ONE_TO_ONE);
  outputGate.gate(output, Layer.gateType.OUTPUT);

  inputLayer.project(outputLayer);

  this.set({
    input: inputLayer,
    hidden: [inputGate, forgetGate, memoryCell, outputGate],
    output: outputLayer
  });
}
LSTM.prototype = new Network();
LSTM.prototype.constructor = LSTM;

let section = "";
let lines = [];
let labels = [];
let label = [];
let labelG = [];
let labelFull = [];
let datos = [];
let datosDSS = [];
let datosDS3 = [];
let names = [];
let allLabels = [];
let noFluo = [];
let normal = [];
let ids = [];
let removidos = [];
let removidos2 = [];
let removidos3 = [];
let color = [];
let pred = [];
let target = [];
let trainingData = [];
let dess = 0;
let dessName = '';
var data1 = [];

app.use(express.static("public"));
app.use(express.static("node_modules"));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

let trainingTargetsReal;
let trainingTargets = Array(181).fill([1, 0, 0]);
    trainingTargets.fill([0, 1, 0], 60, 120); 
    trainingTargets.fill([0, 0, 1], 120, 181);

const port = 3100;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/HTMLs/login.html"));
});

app.get("/tomato1", (req, res) => {
  section = "none";
  datos = [];
  datosDS3 = [];
  noFluo = [];
  normal = [];
  res.sendFile(path.join(__dirname, "/HTMLs/tomato1.html"));
});

app.get("/upDemoData", (req, res) => {
  datos = [];
  section = "RD";
  datosDS3 = [];
  
  for (var c = 0; c < 9; c++) {
    var direction = "/demoData/CLsoP1_0" + c + ".txt";
    const fs = require("fs");
    var data = fs.readFileSync(__dirname + direction, {
      encoding: "utf8",
      flag: "r",
    });
    getData(data, c);
  }
  for (var i = 0; i < 9; i++) {names[i] = "CLsoP1_0" + i + ".txt"}

  color = randomColor({
    count: datosDS3.length,
    luminosity: "bright",
    format: "rgb",
  });
  res.json({ datos: datos, datosDS3: datosDS3, allLabels: allLabels, names : names, color: color });
});

app.post("/upload", upload.array("files"), function (req, res) {
  section = "RD";
  datos = [];
  datosDS3 = [];
  const uploadedFiles = req.files;
  var c = 0;
  uploadedFiles.forEach((file) => {
    var data = fs.readFileSync(file.path, { encoding: "utf8", flag: "r" });
    getData(data, c);
    names[c] = file.originalname;
    c++;
  });
  color = randomColor({
    count: datosDS3.length,
    luminosity: "bright",
    format: "rgb",
  });
  res.json({ datos, datosDS3, allLabels, names, color });
});

app.post('/update-variable', (req, res) => {
  datos = req.body.datos;
  datosDS3 = req.body.datosDS3;
  ids = datos.map(extractFirstNumber);
  if (noFluo.length) {noFluo = req.body.noFluo}
  if (normal.length) {normal = req.body.normal}
  console.log('Variable updated successfully');
});

app.post("/dtw", function (req, res) {
  removeFluo(datosDS3, allLabels, 5, 1);
  normalize(noFluo, allLabels, 1);
  ids = datos.map(extractFirstNumber);
    switch (req.body.dtwM) {
      case "0":
            var medData = normal[Math.floor(Math.random() * normal.length)];
      break;
      case "1":
            var ids = datos.map(dato => dato[0]);
            const datoSort = datos.map(dato => [dato[0], dato[1]]).sort((a,b) => a[1]-b[1]);
            const medIndex = Math.round((datoSort.length-1)/2);
            const med = datoSort[medIndex][0];
            const find = ids.indexOf(med);
            var medData = normal[find];
      break;
      case "2":
            const ss = require('simple-statistics');
            let meanData = [];
            let meanDatas = [];
            let meanData2 = [];
            let meanDatas2 = [];
            var medData = [];
            
            for (let i = 0; i < datosDS3.length; i++) {
              meanData[i] = datosDS3[i].map(Number);
              meanDatas[i] = ss.mean(meanData[i]);
            }
            
            for (let j = 0; j < normal[0].length; j++) {
              for (let i = 0; i < normal.length; i++) {
                meanData2[i] = normal[i][j];
              }
              meanData2 = meanData2.map(Number);
              meanDatas2[j] = ss.mean(meanData2);
              medData[j] = meanDatas2[j];
            }
        break;
        case "3":
          var medData = [];
          for (let i = 0; i < normal[0].length; i++) {
            const datoS = normal.map(dato => dato[i] = Number(dato[i]));
            const trimmedMeanDS3 = trimmedMean(datoS, 0.1);
            medData[i-1] = trimmedMeanDS3;
          }
        break;
    }
    const DynamicTimeWarping = require('dynamic-time-warping');
    var distFunc = function( a, b ) {return Math.abs( a - b )};
    
    var dtwN = normal.map(normalData => new DynamicTimeWarping(normalData, medData, distFunc));
    var distN = dtwN.map(dtw => dtw.getPath());
    var sizesN = distN.map(dist => dist.length);

    var distN2 = [];
    var distN3 = [];
    var distN4 = [];
    var datosDS4 = [];
    var l = [];
    
    for (var j = 0; j < distN.length; j++) {
      distN2 = distN[j];
      datosDS4 = normal[j]
      for (var i = 0; i < sizesN[j]; i++) {
          distN3.push(datosDS4[distN2[i][0]] - medData[distN2[i][1]])
          l[i] = i;
      }
    distN4[j] = distN3;
    distN3 = [];
    }

    let rem = distN4.map(arr => arr.some(val => val < -1.2 || val > 1.2) ? 1 : 0);

    for (var i = rem.length -1; i >= 0; i--) {
      if (rem[i] == 1) {
          removidos2.push(datos[i])
          removidos3.push(datosDS3[i])
          var removed4 = datosDS3.splice(i, 1);
          var removed5 = datos.splice(i, 1);
      }}
  res.json({ rem : rem});
});

app.post("/noFluo", function (req, res) {
  section = "noFluo";
  removeFluo(datosDS3, label, req.body.polynomialDeg, req.body.sav);
  res.json({ noFluo: noFluo, ids });
});

app.post("/normalize", function (req, res) {
  section = "normalized";
  normalize(noFluo, label, req.body.rm)
  res.json({ normal: normal, ids });
});

app.get('/download-csv', (req, res) => {
  let csv = [];
  section = "RD"
  ids = datos.map(extractFirstNumber);
  
  csv[0] = ["Raman Shift [cm -1]"];
  for (var i = 0; i < ids.length; i++) {csv[0].push(section + ids[i])}
  for (i = 1; i < allLabels.length; i++) {csv[i] = [allLabels[i-1] , datosDS3[0][i-1]];
    for (var j = 1; j < datosDS3.length; j++) {csv[i].push(datosDS3[j][i-1])}}
  const csvFileCreator = require('csv-file-creator');
  csvFileCreator(section +".csv", csv);
  console.log("CSV saved.");

  var oldPath = path.join(__dirname, '/' + section + '.csv');
  var newPath = path.join(__dirname, '/public/' + section + '.csv');

  fs.rename(oldPath, newPath, function (err) {
    if (err) throw err
      console.log('Successfully renamed - AKA moved!')
  })

  const filePath = path.join(__dirname, '/public/' + section + '.csv');
  console.log(filePath);
  setTimeout(() => {res.sendFile(filePath)}, 100);
});

app.get('/download-csv2', (req, res) => {
  let csv = [];
  ids = datos.map(extractFirstNumber);
  let data2Write = [];
  if (section == "noFluo") {data2Write = noFluo} else if (section == "normalized") {data2Write = normal}
  
  csv[0] = ["Raman Shift [cm -1]"];
  for (var i = 0; i < ids.length; i++) {csv[0].push(section + ids[i])}
  for (i = 1; i < allLabels.length; i++) {csv[i] = [allLabels[i-1] , data2Write[0][i-1]];
    for (var j = 1; j < data2Write.length; j++) {csv[i].push(data2Write[j][i-1])}}
  const csvFileCreator = require('csv-file-creator');
  csvFileCreator(section +".csv", csv);
  console.log("CSV saved.");

  var oldPath = path.join(__dirname, '/' + section + '.csv');
  var newPath = path.join(__dirname, '/public/' + section + '.csv');

  fs.rename(oldPath, newPath, function (err) {
    if (err) throw err
      console.log("Saved to " + newPath)
  })

  const filePath = path.join(__dirname, '/public/' + section + '.csv');
  setTimeout(() => {res.sendFile(filePath)}, 100);
});

/////////////////////////////////////////////////////////////////

app.get('/tomato2', (req, res) => {
  res.sendFile(path.join(__dirname, "/HTMLs/tomato2.html"));
});

app.get('/tomatoR', (req, res) => {
  res.sendFile(path.join(__dirname, "/HTMLs/results.html"));
});

app.post("/firstPlot", (req, res) => {
  dess = req.body.dess;
  if (dess == 0) {dessName = 'CLSO';
  } else if (dess == 1) {dessName = 'CMM';
  } else if (dess == 2) {dessName = '3Classes'}

  var data = fs.readFileSync(path.resolve(__dirname,`./models/PCAs${dessName}.json`),{encoding:'utf8', flag:'r'});
  trainingData = JSON.parse(data.toString());
  var data1 = numeric.transpose(trainingData);

  trainingTargetsReal = Array(trainingData.length).fill(0);
  if (dess == 0) {
    trainingTargetsReal.fill(1, 70, trainingData.length); // 66
  } else if (dess == 1) {
    trainingTargetsReal.fill(1, 84, trainingData.length); // 79
  } else if (dess == 2) {
    trainingTargetsReal.fill(1, 60, 120); 
    trainingTargetsReal.fill(2, 120, trainingData.length);
  }
  target = trainingTargetsReal
  res.json({ color, names, allLabels, datos, datosDS3, noFluo, normal, ids , target, trainingData, data1});
});

app.get("/pca", (req, res) => {
  ////////////////////////////////////////////////
  /*
    const pca = new PCA(normal);
    const modelJSON = JSON.stringify(pca.toJSON(), null, 2);
    fs.writeFileSync(path.resolve(__dirname,'./models/PCAmodel.json'), modelJSON, (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
    });
  */
    ///////////////////////////////////////////
  const loadedModelJSON = fs.readFileSync(path.resolve(__dirname,`./models/PCAmodel${dessName}.json`), 'utf8');
  const pca = PCA.load(JSON.parse(loadedModelJSON));
  pred = pca.predict(normal, { nComponents: 6 }).data.map(x => Array.from(x));
  var loadsT = [];
  var loadsIndex = [];
  var higherLoadT = [];
  var loads = pca.getLoadings()
  var loads = loads.data
  for (var i = 0; i < loads.length; i++) {loads[i] = Array.from(loads[i]);}
  for (var i = 0; i < 6; i++) {
    loadsT[i] = (element) => element === Math.max.apply(Math, loads[i]);
    loadsIndex[i] = loads[i].findIndex(loadsT[i])
    higherLoadT[i] = allLabels[loads[i].findIndex(loadsT[i])]
  }
  normalizePCA(pred, label, 1)
  data1 = numeric.transpose(pred)
  ///////////////////////////////////
  /*
    var predJSON = JSON.stringify(pred);
    fs.writeFile(path.resolve(__dirname,'./models/PCAs2.json'), predJSON, 'utf8', (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return;
      }
    });
  */
  //////////////////////////////////////////////
  res.json({ higherLoadT, pred, data1 });
});

app.get("/exportPCA", (req, res) => {
  let csv = [];
  section = "RD"
  ids = datos.map(extractFirstNumber);

  csv[0] = ["PCAs"];
  for (var i = 0; i < ids.length; i++) {csv[0].push(section + ids[i])}
  for (i = 1; i < data1.length + 1; i++) {csv[i] = ["PCA " + i, data1[i-1][0]];
    for (var j = 1; j < datosDS3.length; j++) {csv[i].push(data1[i-1][j])}}
  const csvFileCreator = require('csv-file-creator');
  csvFileCreator("Probando.csv", csv);
  console.log("CSV saved.");
  var oldPath = path.join(__dirname, '/' + 'Probando.csv');
  var newPath = path.join(__dirname, '/public/' + 'PCAs.csv');

  fs.rename(oldPath, newPath, function (err) {
    if (err) throw err
      console.log('Successfully renamed - AKA moved!')
  })

  const filePath = path.join(__dirname, '/public/' + 'Probando.csv');
  console.log(newPath);
  setTimeout(() => {res.sendFile(filePath)}, 100);
});

app.get("/testMLP", (req, res) => {
  var loadMLPmodelJSON = fs.readFileSync(path.resolve(__dirname,`./models/MLPmodel${dessName}.json`), 'utf8');
  var myPerceptron = Network.fromJSON(JSON.parse(loadMLPmodelJSON));
  console.log(myPerceptron)
  let resultsMLPTest = [];
  pred.forEach((data) => {resultsMLPTest.push(myPerceptron.activate(data))});

  if (dess == 0 || dess == 1) {
    var resultsMLPTestFinal2 = resultsMLPTest.map((element) => Math.round(element));
    var resultsMLPTestFinal = resultsMLPTestFinal2.map(x => x === 0 ? 1 : 0);
  } else if (dess == 2) {
    var resultsMLPTestFinal = resultsMLPTest.map(arr => arr.indexOf(Math.max(...arr)));
  }
  let [zeroes, ones, twos, samples, diagnosisName] = resultsProcessing(resultsMLPTestFinal);
  res.json({ zeroes, ones, twos, samples, diagnosisName });
});

app.get("/testLSTM", (req, res) => {
  var loadLSTMmodelJSON = fs.readFileSync(path.resolve(__dirname,`./models/LSTMmodel${dessName}.json`), 'utf8');
  var myLSTM = Network.fromJSON(JSON.parse(loadLSTMmodelJSON));
  console.log(myLSTM)
  let resultsLSTMTest = [];
  pred.forEach((data) => {resultsLSTMTest.push(myLSTM.activate(data))});

  if (dess == 0 || dess == 1) {
    var resultsLSTMTestFinal2 = resultsLSTMTest.map((element) => Math.round(element));
    var resultsLSTMTestFinal = resultsLSTMTestFinal2.map(x => x === 0 ? 1 : 0);
  } else if (dess == 2) {
    var resultsLSTMTestFinal = resultsLSTMTest.map(arr => arr.indexOf(Math.max(...arr)));
  }
  let [zeroes, ones, twos, samples, diagnosisName] = resultsProcessing(resultsLSTMTestFinal);
  
  res.json({ zeroes, ones, twos, samples, diagnosisName });
});

app.get("/exportMLP", (req, res) => {
  let className = req.query.name
  let csv = [];
  let clso = (req.query.data.zeroes / req.query.data.samples) * 100;
  let cmm = (req.query.data.ones / req.query.data.samples) * 100;
  let healty = (req.query.data.twos / req.query.data.samples) * 100;
  csv[0] = [`${className} Results: `];
  csv[1] = ["Number of samples: ", req.query.data.samples];
  csv[2] = ["CLso: ", `${clso} %`];
  csv[3] = ["Cmm: ", `${cmm} %`];
  csv[4] = ["Healthy: ", `${healty} %`];
  csv[5] = ["Diagnosis: ", req.query.data.diagnosisName];

  const csvFileCreator = require('csv-file-creator');
  csvFileCreator("Probando.csv", csv);
  console.log("CSV saved.");

  var oldPath = path.join(__dirname, '/' + 'Probando.csv');
  var newPath = path.join(__dirname, '/public/' + `${className} Results.csv`);

  fs.rename(oldPath, newPath, function (err) {
    if (err) throw err
      console.log('Successfully renamed - AKA moved!')
  })
  setTimeout(() => {res.sendFile(newPath)}, 100);
});

app.get("/exportCONS", (req, res) => {
  let className = req.query.name
  let csv = [];
  csv[0] = [`${className} Results`]
  csv[1] = []
  csv[2] = [`Classifier: `, `Diagnosis: `, `Confidence: `];
  csv[3] = ["MLP: ", `${req.query.data.diagnosisMLP}`, `${req.query.data.zMLP} %`];
  csv[4] = ["LSTM: ", `${req.query.data.diagnosisLSTM}`, `${req.query.data.zLSTM} %`];
  csv[5] = ["LDA: ", `${req.query.data.diagnosisLDA}`, `${req.query.data.zLDA} %`];
  csv[6] = ["KNN: ", `${req.query.data.diagnosisKNN}`, `${req.query.data.zKNN} %`];
  csv[7] = ["PLS: ", `${req.query.data.diagnosisPLS}`, `${req.query.data.zPLS} %`];
  csv[8] = ["Consensus: ", `${req.query.data.diagnosisCons}`, `${req.query.data.zCons} %`];

  const csvFileCreator = require('csv-file-creator');
  csvFileCreator("Probando.csv", csv);
  console.log("CSV saved.");

  var oldPath = path.join(__dirname, '/' + 'Probando.csv');
  var newPath = path.join(__dirname, '/public/' + `${className} Results.csv`);

  fs.rename(oldPath, newPath, function (err) {
    if (err) throw err
      console.log('Successfully renamed - AKA moved!')
  })
  setTimeout(() => {res.sendFile(newPath)}, 100);
});

app.get("/exportLSTM", (req, res) => {
});

app.get("/testLDA", (req, res) => {
  const LDA = require('pw-lda');
  if (dess == 0) {
    var class1 = trainingData.slice(0, 66);
    var class2 = trainingData.slice(-66);
    var classifier = new LDA(class1, class2);
  } else if (dess == 1) {
    var class1 = trainingData.slice(0, 79);
    var class2 = trainingData.slice(-79);
    var classifier = new LDA(class1, class2);
  } else if (dess == 2) {
    var class1 = trainingData.slice(0, 60);
    var class2 = trainingData.slice(60, 120);
    var class3 = trainingData.slice(-61);
    var classifier = new LDA(class1, class2, class3);
  }

  var resultsLDATraining = [];
  for(let i = 0; i < pred.length; i++){
    resultsLDATraining.push(classifier.classify(pred[i]));
  }

  if (dess == 0 || dess == 1) {
    resultsLDATraining = resultsLDATraining.map(x => x === 0 ? 1 : 0);
  }

  let [zeroes, ones, twos, samples, diagnosisName] = resultsProcessing(resultsLDATraining);
  res.json({ zeroes, ones, twos, samples, diagnosisName });
});

app.get("/testKNN", (req, res) => {
  const KNN = require('ml-knn');
  if (dess == 0 || dess == 1) {var knn = new KNN(trainingData, trainingTargetsReal, { k: 2 })
  } else if (dess == 2) {var knn = new KNN(trainingData, trainingTargetsReal, { k: 3 })};
  
  var resultsKNNTraining = knn.predict(pred);
  if (dess == 0 || dess == 1) {
    resultsKNNTraining = resultsKNNTraining.map(x => x === 0 ? 1 : 0);
  }

  let [zeroes, ones, twos, samples, diagnosisName] = resultsProcessing(resultsKNNTraining);
  res.json({ zeroes, ones, twos, samples, diagnosisName });
});

app.get("/testPLS", (req, res) => {
  const {OPLS} = require('ml-pls');
  const model = new OPLS(trainingData, trainingTargetsReal);
  const prediction = model.predict(pred);

  const results = prediction.predictiveComponents.data.map(result => result[0]);
  var resultsPLSTraining = []

  if (dess == 0 || dess == 1) {
      resultsPLSTraining = results.map(result => result < 0 ? 0 : 1);
      resultsPLSTraining = resultsPLSTraining.map(x => x === 0 ? 1 : 0);
    }  else if (dess == 2) {
      resultsPLSTraining = results.map(result => result < -0.7 ? 0 : result > 0.7 ? 2 : 1);
    };

  let [zeroes, ones, twos, samples, diagnosisName] = resultsProcessing(resultsPLSTraining);
  res.json({ zeroes, ones, twos, samples, diagnosisName });
});

app.get("/testConcensus", (req, res) => {
  const LDA = require('pw-lda');
  const KNN = require('ml-knn');
  const {OPLS} = require('ml-pls');

  if (dess == 0) {
    var class1 = trainingData.slice(0, 66);
    var class2 = trainingData.slice(-66);
    var classifier = new LDA(class1, class2);
  } else if (dess == 1) {
    var class1 = trainingData.slice(0, 79);
    var class2 = trainingData.slice(-79);
    var classifier = new LDA(class1, class2);
  } else if (dess == 2) {
    var class1 = trainingData.slice(0, 60);
    var class2 = trainingData.slice(60, 120);
    var class3 = trainingData.slice(-61);
    var classifier = new LDA(class1, class2, class3);
  }

  if (dess == 0 || dess == 1) {var knn = new KNN(trainingData, trainingTargetsReal, { k: 2 })
  } else if (dess == 2) {var knn = new KNN(trainingData, trainingTargetsReal, { k: 3 })};

  const model = new OPLS(trainingData, trainingTargetsReal);
  var loadMLPmodelJSON = fs.readFileSync(path.resolve(__dirname,`./models/MLPmodel${dessName}.json`), 'utf8');
  var myPerceptron = Network.fromJSON(JSON.parse(loadMLPmodelJSON));
  var loadLSTMmodelJSON = fs.readFileSync(path.resolve(__dirname,`./models/LSTMmodel${dessName}.json`), 'utf8');
  var myLSTM = Network.fromJSON(JSON.parse(loadLSTMmodelJSON));

  let resultsMLPTest = [];
  let resultsLSTMTest = [];
  let resultsLDATest = [];
  pred.forEach((data) => {
      resultsMLPTest.push(myPerceptron.activate(data));
      resultsLSTMTest.push(myLSTM.activate(data));
      resultsLDATest.push(classifier.classify(data));
  });
  var resultsKNNTest = knn.predict(pred);
  const prediction = model.predict(pred);

  var resultsPLSTest = []
  const results = prediction.predictiveComponents.data.map(result => result[0]);
  if (dess == 0 || dess == 1) {
    resultsMLPTest = resultsMLPTest.map((element) => Math.round(element));
    resultsLSTMTest = resultsLSTMTest.map((element) => Math.round(element));
    resultsPLSTest = results.map(result => result < 0 ? 0 : 1);
  } else if (dess == 2) {
    resultsMLPTest = resultsMLPTest.map(arr => arr.indexOf(Math.max(...arr)));
    resultsLSTMTest = resultsLSTMTest.map(arr => arr.indexOf(Math.max(...arr)));
    resultsPLSTest = results.map(result => result < -0.7 ? 0 : result > 0.7 ? 2 : 1);
  }
  if (dess == 0 || dess == 1) {
    resultsMLPTest = resultsMLPTest.map(x => x === 0 ? 1 : 0);
    resultsLSTMTest = resultsLSTMTest.map(x => x === 0 ? 1 : 0);
    resultsLDATest = resultsLDATest.map(x => x === 0 ? 1 : 0);
    resultsKNNTest = resultsKNNTest.map(x => x === 0 ? 1 : 0);
    resultsPLSTest = resultsPLSTest.map(x => x === 0 ? 1 : 0);
  }
  let [zMLP, diagnosisMLP] = resultsProcessingCons(resultsMLPTest)
  let [zLSTM, diagnosisLSTM] = resultsProcessingCons(resultsLSTMTest)
  let [zLDA, diagnosisLDA] = resultsProcessingCons(resultsLDATest)
  let [zKNN, diagnosisKNN] = resultsProcessingCons(resultsKNNTest)
  let [zPLS, diagnosisPLS] = resultsProcessingCons(resultsPLSTest)
  
  const combinedArray = [resultsMLPTest, resultsLSTMTest,resultsLDATest,resultsKNNTest,resultsPLSTest];
  const resultsConsTest = [];
  for (let i = 0; i < combinedArray[0].length; i++) {
    const counts = {};
    let maxCount = 0;
    let mostRepeatedElement = null;

    for (let j = 0; j < combinedArray.length; j++) {
      const element = combinedArray[j][i];
      counts[element] = counts[element] ? counts[element] + 1 : 1;

      if (counts[element] > maxCount) {
        maxCount = counts[element];
        mostRepeatedElement = element;
      }
    }
    resultsConsTest.push(mostRepeatedElement);
  }
  let [zCons, diagnosisCons] = resultsProcessingCons2(resultsConsTest)
  res.json({ zMLP, zLSTM, zLDA, zKNN, zPLS, zCons, diagnosisMLP, diagnosisLSTM, diagnosisLDA, diagnosisKNN, diagnosisPLS, diagnosisCons });
});
//////////////////////////////////////////////////////////////////

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

////////////////////////////////////////////////////////////////
//////////////////// Functions /////////////////////////////////

function getData(data, c) {
  const lines = data.split(/\r?\n/);
  let inic;
  for (var i = 0; i < lines.length - 1; i++) {
    if (isNaN(parseFloat(lines[i]))) {inic = i}}
  const position = data.search(parseFloat(lines[inic + 1]));
  const result = data.slice(position);
  const stimuliArray = result.split("\n").map((ln) => ln.split("\t"));
  const labels = [];
  const yax = [];
  const yax2 = [c + 1];
  for (i = 0; i < stimuliArray.length - 1; ++i) {
    labels[i] = stimuliArray[i][0];
    yax[i] = stimuliArray[i][1].replace(/\r?\n|\r/g, "");
  }
  label.push(labels);
  datos.push(yax2.concat(yax));
  datosDSS.push(yax);

  labelG = labels.slice(0, labels.length - 1).map(Math.round);

  const datosG3 = yax.filter((_, i) => labelG[i] >= 800 && labelG[i] <= 1750);
  const labelCut = [
    800,
    ...labelG.filter((labelG) => labelG >= 800 && labelG <= 1750),
  ];

  var datoFull = [];
  for (var i = 0; i < 951; i++) {
    allLabels[i] = i + 800;
    if (allLabels[i] == labelCut[i]) {
      datoFull[i] = datosG3[i];
    } else if (allLabels[i] < labelCut[i]) {
      datoFull[i] = datosG3[i];
      var dataInd = (Number(datoFull[i]) + Number(datoFull[i - 1])) / 2;
      dataInd = Math.round(dataInd * 100) / 100;
      datoFull[i] = dataInd.toString();
      labelCut.splice(i, 0, i + 800);
    } else if (allLabels[i] > labelCut[i]) {
      datoFull[i] = datosG3[i];
      var dataInd = (Number(datoFull[i]) + Number(datoFull[i - 1])) / 2;
      dataInd = Math.round(dataInd * 100) / 100;
      datoFull[i] = dataInd.toString();
      labelCut[i] = i + 800;
    }
  }
  datosDS3.push(datoFull);
  labelFull.push(allLabels);
}

function removeFluo(datosDS3, label, polynomialDeg, checkSavG) {
  ids = datos.map(extractFirstNumber);
  noFluo = [];
  const { createModel } = require("polynomial-regression");
  const model = createModel();
  const unknownXValue = [];
  const poly = Number(polynomialDeg);

  const dataVector2 = datosDS3.map((element) =>
    element.map((str) => Number(str)).map((str, i) => [allLabels[i], str])
  );
  let estimatedDatas2 = [];
  for (let i = 0; i < datos.length; i++) {
    model.fit(dataVector2[i], [poly]);
    estimatedDatas2[i] = allLabels.map((label) => model.estimate(poly, label));
  }

  datosDS3.map((datos2, w) => {
    let estimatedDatas3 = estimatedDatas2[w];
    noFluo[w] = datos2.map((datos2, i) => datos2 - estimatedDatas3[i]);
  });

  const {sgg} = require("ml-savitzky-golay-generalized");
  const options = {
    windowSize: 25,
    derivative: 0,
    polynomial: 3,
  };
  if (checkSavG == 1) {
    const answer1 = noFluo.map((num, index) => sgg(num, label, options));
    noFluo = [...answer1];
    noFluo = noFluo.map((num, index) => [...answer1[index]]);
  }
}

function normalize(noFluo, label, rm) {
  normal = [];
  ids = datos.map(extractFirstNumber);
  for (let i = 0; i < noFluo.length; i++) {
      const timeSeries = noFluo[i];
      const mean = timeSeries.reduce((acc, val) => acc + val, 0) / timeSeries.length;
      const variance = timeSeries
          .map(val => Math.pow(val - mean, 2))
          .reduce((acc, val) => acc + val, 0) / timeSeries.length;
      const standardDeviation = Math.sqrt(variance);
      const normalized = timeSeries.map(val => (val - mean) / standardDeviation);
      normalized.forEach((val, j) => {
          if (rm == 0 && val <= 0) {normalized[j] = 0}
      });
      normal.push(normalized);
  }
}

function extractFirstNumber(array) {
  return array.flat().find(element => typeof element === 'number');
}

//////////////////////////////////////////////////////////////////
function trimmedMean(arr, percent) {
  const sortedArr = [...arr].sort((a, b) => a - b);
  const trimCount = Math.round(sortedArr.length * percent);

  const trimmedArr = sortedArr.slice(trimCount, sortedArr.length - trimCount);
  const sum = trimmedArr.reduce((a, b) => a + b, 0);

  return sum / trimmedArr.length;
}

function normalizePCA(noFluo, label, rm) {
  pred = [];
  ids = datos.map(extractFirstNumber);
  for (let i = 0; i < noFluo.length; i++) {
      const timeSeries = noFluo[i];
      const mean = timeSeries.reduce((acc, val) => acc + val, 0) / timeSeries.length;
      const variance = timeSeries
          .map(val => Math.pow(val - mean, 2))
          .reduce((acc, val) => acc + val, 0) / timeSeries.length;
      const standardDeviation = Math.sqrt(variance);
      const normalized = timeSeries.map(val => (val - mean) / standardDeviation);
      normalized.forEach((val, j) => {if (rm == 0 && val <= 0) {normalized[j] = 0}});
      pred.push(normalized);
  }
}

function normalizePCATraining(noFluo, rm) {
  trainingData = [];
  for (let i = 0; i < noFluo.length; i++) {
      const timeSeries = noFluo[i];
      const mean = timeSeries.reduce((acc, val) => acc + val, 0) / timeSeries.length;
      const variance = timeSeries
          .map(val => Math.pow(val - mean, 2))
          .reduce((acc, val) => acc + val, 0) / timeSeries.length;
      const standardDeviation = Math.sqrt(variance);
      const normalized = timeSeries.map(val => (val - mean) / standardDeviation);
      normalized.forEach((val, j) => {if (rm == 0 && val <= 0) {normalized[j] = 0}});
      trainingData.push(normalized);
  }
}

function resultsProcessing(results) {
  if (dess == 0) {
    for (let i = 0; i < results.length; i++) {if (results[i] == 1) {results[i] = 2}}    
  } else if (dess == 1) {
    for (let i = 0; i < results.length; i++) {
      if (results[i] == 0) {results[i] = 1} else if (results[i] == 1) {results[i] = 2}
    }    
  }
  const counts = {};
  results.forEach(value => {counts[value] = counts[value] ? counts[value] + 1 : 1});
  let diagnosis;
  let highestCount = 0;
  Object.keys(counts).forEach(value => {
    if (counts[value] > highestCount) {
      diagnosis = value;
      highestCount = counts[value];
    }
  });
  var diagnosisName = '';
  if (diagnosis == 0) {diagnosisName = 'CLSo'
  } else if (diagnosis == 1) {diagnosisName = 'Cmm'
  } else {diagnosisName = 'Healty'}

  let zeroes = 0;
  let ones = 0;
  let twos = 0;
  for (let i = 0; i < results.length; i++) {
    if (results[i] === 0) {zeroes++;
    } else if (results[i] === 1) {ones++;
    } else if (results[i] === 2) {twos++;
    }
  }
  var samples = results.length;
  return [zeroes, ones, twos, samples, diagnosisName];
}

function resultsProcessingCons(results) {
  if (dess == 0) {
    for (let i = 0; i < results.length; i++) {if (results[i] == 1) {results[i] = 2}}    
  } else if (dess == 1) {
    for (let i = 0; i < results.length; i++) {
      if (results[i] == 0) {results[i] = 1} else if (results[i] == 1) {results[i] = 2}
    }    
  }
  const counts = {};
  results.forEach(value => {
    counts[value] = counts[value] ? counts[value] + 1 : 1;
  });
  let diagnosis;
  let highestCount = 0;
  Object.keys(counts).forEach(value => {
    if (counts[value] > highestCount) {
      diagnosis = value;
      highestCount = counts[value];
    }
  });
  var diagnosisName = '';
  if (diagnosis == 0) {diagnosisName = 'CLSo'
  } else if (diagnosis == 1) {diagnosisName = 'Cmm'
  } else {diagnosisName = 'Healty'}

  let zeroes = 0;
  let ones = 0;
  let twos = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i] === 0) {zeroes++;
    } else if (results[i] === 1) {ones++;
    } else if (results[i] === 2) {twos++;
    }
  }
  var samples = results.length;
  zeroes = (zeroes / samples) * 100;;
  ones = (ones / samples) * 100;;
  twos = (twos / samples) * 100;;
  const bestGuess = Math.max(zeroes, ones, twos);
  return [bestGuess, diagnosisName];
}

function resultsProcessingCons2(results) {
  const counts = {};
  results.forEach(value => {
    counts[value] = counts[value] ? counts[value] + 1 : 1;
  });
  let diagnosis;
  let highestCount = 0;
  Object.keys(counts).forEach(value => {
    if (counts[value] > highestCount) {
      diagnosis = value;
      highestCount = counts[value];
    }
  });
  
  var diagnosisName = '';
  if (diagnosis == 0) {diagnosisName = 'CLSo'
  } else if (diagnosis == 1) {diagnosisName = 'Cmm'
  } else {diagnosisName = 'Healty'}

  let zeroes = 0;
  let ones = 0;
  let twos = 0;

  for (let i = 0; i < results.length; i++) {
    if (results[i] === 0) {zeroes++;
    } else if (results[i] === 1) {ones++;
    } else if (results[i] === 2) {twos++;
    }
  }
  
  var samples = results.length;
  zeroes = (zeroes / samples) * 100;;
  ones = (ones / samples) * 100;;
  twos = (twos / samples) * 100;;
  const bestGuess = Math.max(zeroes, ones, twos);
  return [bestGuess, diagnosisName];
}