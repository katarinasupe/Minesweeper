var visitedCells = [];
var suspiciousCells = [];
var openedCells = [];
//Kad je svih nRows*nCols-nMines polja bez mina otkriveno, igra završava pobjedom igrača.
$(document).ready(function () {
  $("h1").hide();
  $("#board").hide();
  $("#new_game").hide();
  $("#start_game").on("click", initializeGame);
  $("#new_game").on("click", newGame);
  $("#board").on("contextmenu", function () {
    var rect = cnv.getBoundingClientRect(); //get border of canvas
    var x = event.clientX - rect.left; //calculate the true coordinates relative to the position of the screen
    var y = event.clientY - rect.top;
    var row = Math.floor(y / 30); //since each cell is 30x30px
    var col = Math.floor(x / 30);

    var filter1 = openedCells.filter(function (openedElement) { //if it's already opened it cannot become suspicious
      return openedElement.row === row && openedElement.col === col;
    });

    if (filter1.length === 0) { 
      isOpened = false;
    } else isOpened = true;

    if (!isOpened) { //if it's not opened it can be suspicious
      if (suspiciousCells.length === 0) { //push first suspicious
        suspiciousCells.push({ row: row, col: col });
        ctx.fillStyle = "black";
        ctx.font = "15px Georgia";
        ctx.fillText("?", col * 30 + 10, row * 30 + 20);
      } else { //if it's not first suspicious, check if it's already clicked 
        var filter2 = suspiciousCells.filter(function (suspiciousElement) {
          return suspiciousElement.row === row && suspiciousElement.col === col;
        });
        if (filter2.length === 0) {
          isSuspicious = false;
        } else isSuspicious = true;

        if (!isSuspicious) { //if it's not already suspicious, make it suspicious
          suspiciousCells.push({ row: row, col: col });
          ctx.fillStyle = "black";
          ctx.font = "15px Georgia";
          ctx.fillText("?", col * 30 + 10, row * 30 + 20);
        }
      }
    }

    return false; //no context menu
  });
  $("#board").on("click", function () {
    //---------location of the click---------
    var rect = cnv.getBoundingClientRect(); 
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    row = Math.floor(y / 30); 
    col = Math.floor(x / 30);
    console.log("Trenutni redak " + row);
    console.log("Trenutni stupac " + col);

    //---------adding to visitedCells and revealing cells---------
    if (visitedCells.length === 0) {
      //first cell
      var currentCell = { row: row, col: col };
      visitedCells.push(currentCell);
      revealCells();
    } else {
      //check whether it's already visited, if not, add it
      var isThere = false;
      visitedCells.forEach((element) => {
        if (element.row === row && element.col === col) {
          isThere = true;
        }
      });

      if (!isThere) {
        //if it's not already visited
        currentCell = { row: row, col: col };
        visitedCells.push(currentCell);
        revealCells();
      }
    }
    console.log(visitedCells);
  });
});

//---------initialize game by getting the game id and drawing the board---------
function initializeGame() {
  $("#board").show();
  //if some of the input is empty
  if (
    $("#num_rows").val().length === 0 ||
    $("#num_cols").val().length === 0 ||
    $("#num_mines").val().length === 0
  ) {
    alert("Sva polja moraju biti zadana!");
  }
  //if input is not empty
  else {
    nRows = Number($("#num_rows").val());
    nCols = Number($("#num_cols").val());
    nMines = Number($("#num_mines").val());
    //if each inputed content is not a number
    if (isNaN(nRows) || isNaN(nCols) || isNaN(nMines)) {
      alert("U svim poljima morate zadati broj!");
    }
    //alert if 1 <= nRows, nCols <= 20, te 0 <= nMines <= nRows * nCols not true
    else if (nRows < 1 || nCols > 20 || nMines < 0 || nMines > nRows * nCols) {
      alert(
        "Broj redaka je nužno veći ili jednak 1, broj stupaca manji ili jednak 20 te je broj mina veći ili jednak 0 i manji ili jednak umnošku broja redaka i stupaca!"
      );
    }
    //now it's okay, send nRows, nCols, nMines -> initialize board
    else {
      $.ajax({
        url: "https://rp2.studenti.math.hr/~zbujanov/dz4/id.php",
        type: "GET",
        data: {
          nCols: nCols,
          nRows: nRows,
          nMines: nMines,
        },
        dataType: "json",
        success: function (data) {
          id = data.id;
          console.log("id igre " + id);
          drawBoard();
        },
        error: function (xhr, status) {
          if (status !== null)
            console.log("Greška prilikom Ajax poziva: " + status);
        },
      });

      $(".set_game").hide();
      $("h1").show();
      $("#new_game").show();
      if ($("#board").is(":hidden")) {
        $("#board").show();
      }
    }
    console.log("Zadani broj redaka " + nRows);
    console.log("Zadani broj stupaca " + nCols);
    console.log("Zadani broj mina " + nMines);
  }
}

//---------draw board using canvas where each cell is 30x30px---------
function drawBoard() {
  board = $("#board");
  board.attr("width", nCols * 30);
  board.attr("height", nRows * 30);
  cnv = $("#board").get(0);
  ctx = cnv.getContext("2d");
  ctx.strokeRect(0, 0, nCols * 30, nRows * 30);
  for (var i = 1; i < nCols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 30, 0);
    ctx.lineTo(i * 30, nRows * 30);
    ctx.stroke();
  }
  for (var j = 1; j < nRows; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * 30);
    ctx.lineTo(nCols * 30, j * 30);
    ctx.stroke();
  }
}

//---------write the number of neighboring mines on revealed cells---------
function revealCells() {
  $.ajax({
    url: "https://rp2.studenti.math.hr/~zbujanov/dz4/cell.php",
    type: "GET",
    data: {
      id: id,
      row: row,
      col: col,
    },
    dataType: "json",
    success: function (data) {
      if (data.boom === true) {
        alert("Bum! Izgubili ste!");
        newGame();
      } else {
        data.cells.forEach((element) => {
          var filter = openedCells.filter(function (openedElement) {
            return (
              openedElement.row === element.row &&
              openedElement.col === element.col
            );
          });

          if (filter.length === 0) {
            isOpened = false;
          } else isOpened = true;

          if (!isOpened && element.mines !== 0) {
            //if it's not zero, write number of mines
            openedCells.push(element);
            ctx.fillStyle = "#a8f7b1";
            ctx.fillRect(element.col * 30, element.row * 30, 30, 30);
            ctx.fillStyle = "black";
            ctx.font = "15px Georgia";
            ctx.fillText(
              element.mines,
              element.col * 30 + 10,
              element.row * 30 + 20
            );
            if(openedCells.length === nRows*nCols-nMines){
              alert("Pobjeda!");
              newGame();
            }
          } else if (!isOpened && element.mines === 0) {
            //don't write zero mines, just open cell            
            openedCells.push(element);
            ctx.fillStyle = "#a8f7b1";
            ctx.fillRect(element.col * 30, element.row * 30, 30, 30);
            if(openedCells.length === nRows*nCols-nMines){
              alert("Pobjeda!");
              newGame();
            }
          }
        });
      }
      if (openedCells.length === 0) {
        //first click fills openedCells with cells
        for (var i = 0; i < data.cells.length; i++) {
          openedCells[i] = data.cells[i];
        }
      }
      console.log(data);
      //console.log(openedCells);
    },
    error: function (xhr, status) {
      if (status !== null)
        console.log("Greška prilikom Ajax poziva: " + status);
    },
  });
}

//---------reset game and offer input of new board dimensions---------
function newGame() {
  nRows = null;
  nCols = null;
  id = null;
  $("h1").hide();
  $("#new_game").hide();
  $("#board").hide();
  $(".set_game").show();
  visitedCells = [];
  suspiciousCells = [];
  openedCells = [];
}
