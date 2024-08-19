$("#demoUpload").click(function () {
  let names = [];
  console.log(dataset);
    $.ajax({
        type: 'GET',
        url: "/upDemoData",
        data: {},
        dataType: "text",
        success: function(response){
          output = JSON.parse(response)
            //dataset = [];


          var datosDS3String = output.datosDS3[0].map(str => {
            return parseInt(str, 10);
          });
          //console.log(dataset["0"].data[0].x);
          dataset["0"].data[0].x = output.allLabels[0];
          dataset["0"].data[0].y = datosDS3String[0];

          for (let i = 1; i < output.allLabels.length; i++) {
            dataset["0"].data.push({ x: output.allLabels[i], y: datosDS3String[i] });
          }

          for (let i = 1; i < output.datosDS3.length; i++) {
            dataset.push({
              label: 'RD ' + (i+1),
              data: [{ x: 1000, y: 100 }],
              backgroundColor: 'rgba(127, 0, 0, 1)',
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.5)',
              pointRadius: 1,
              tension: 0,
              showLine: true,
            });

            datosDS3String = output.datosDS3[i].map(str => {
              return parseInt(str, 10);
            });

            dataset[(i).toString()].data[0].x = output.allLabels[0];
            dataset[(i).toString()].data[0].y = datosDS3String[0];

            for (let j = 1; j < output.datosDS3.length; j++) {
              console.log(output.datosDS3[j]);
             
              console.log(dataset);
              
              dataset[(j).toString()].data.push({ x: output.allLabels[j], y: datosDS3String[j] });
            }
          }
            //dataset["0"].data.push({ x: output.allLabels[0], y: datosDS3String[0] });

/*
            dataset[0] = {
              label: 'Roll cf6',
              data: [{ x: output.allLabels, y: datosDS3String }],
              backgroundColor: 'rgba(127, 0, 0, 1)',
              borderWidth: 2,
              borderColor: 'rgba(0, 0, 0, 0.5)',
              pointRadius: 3,
              tension: 0,
              showLine: true,
            }
*/
/*
          for (let i = 0; i < output.datosDS3.length; i++) {
            dataset[(i).toString()].data.push({ x: output.allLabels, y: output.datosDS3[i] });
          }
*/
          myChart.update();
          //console.log(dataset["0"].data);
        }
}).done(function(data){
    //console.log(data);
    //alert(data);
});
})