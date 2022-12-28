var lasFile;
function uploadLAS(file) {
  console.log(file);

  var reader = new FileReader();
  reader.onerror = function () {
    alert("error reading las/laz");
  };
  reader.onload = function (evt) {
    lasFile = new LASFile(reader.result, file[0].name);
    console.log(
      `Opened LAS/LAZ file '${file[0].name}' containing ${lasFile.numPoints} points`
    );
    console.log(lasFile);
    console.log(`Bounds = ${lasFile.bounds}`);

    lasFile.loadPoints();
    console.log(`Loaded ${lasFile.numLoadedPoints} (noise discarded)`);
    console.log(lasFile.positions);
    let positionNumsArray = [];
    const positionNormal = new Float32Array(lasFile.numPoints * 3);
    // lasFile.positions.forEach((element) => {
    //   positionNumsArray.push(element / 10000.0);
    // });
    // positionNormal.set(positionNumsArray);
    // lasFile.positions = positionNormal;
    if (lasFile.hasColors) {
      console.log("File has colors");
      var startTime = performance.now();
      lasFile.Color32 = Float32Array.from(
        lasFile.colors,
        (octet) => octet / 0xff
      );
      var endTime = performance.now();
      console.log(
        `Call to convert typed array took ${endTime - startTime} milliseconds`
      );
      console.log(lasFile.colors);
    }
    stages();
  };
  reader.readAsArrayBuffer(file[0]);
}
