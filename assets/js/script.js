import {
  DESCRIPTION,
  DUEDATE,
  STATE,
  STATEVAL,
  TITLE,
  ID,
  getListEntries,
  createEntry,
  getEntry,
  deleteEntry,
  setStatus,
} from "./taskStore.js";



const lane = {
  TODOID: "todo-cards",
  WIPID: "in-progress-cards",
  DONEID: "done-cards",
};

const statusLane = {};
statusLane[lane.TODOID] = STATEVAL.TODO;
statusLane[lane.WIPID] = STATEVAL.WIP;
statusLane[lane.DONEID] = STATEVAL.COMPLETE;


const cardColoring = {
  LATE: "card-late",
  WARN: "card-warn",
  GOOD: "card-good",
};

const kvMapping = {};
kvMapping[TITLE] = TITLE;
kvMapping[DUEDATE] = DUEDATE;
kvMapping[DESCRIPTION] = DESCRIPTION;


function createTaskCard(task, state) {
  if (!task) return null;


  const c = !state ? cardColoring.LATE : state;

  const card = $(`
  <div class="card ${c} " id="${task[ID]}">
  <div class="card-body">
  <h5 class="card-title">${task[TITLE]}</h5>
  <h6 class="card-subtitle">${dayjs(
    dayjs(task[DUEDATE])
  ).format("MM/DD/YYYY")}</h6>
  <p class="card-text">${task[DESCRIPTION]}
  </p><button class="btn-delete btn btn-primary" data-id="${
    task[ID]
  }">Delete</button>
  </div>
  </div>
`)
    .data("text", task[ID])
    .draggable({
      cursor: "move",
      revert: true,
    });
  return card;
}


function getCardStatus(state, timein) {

  const aday = 86400 * 1000;


  if (
    !state ||
    !timein ||
    (state !== STATEVAL.COMPLETE && dayjs().valueOf() - timein > aday)
  )
    return cardColoring.LATE;
  else if (
    state === STATEVAL.COMPLETE ||
    dayjs().valueOf() - timein < 0
  )
    return cardColoring.GOOD;
   else return cardColoring.WARN;
}

// Todo: create a function to render the task list and make cards draggable
function renderTaskList() {

  Object.values(lane).map((item) => $(`#${item}`).empty());

  const taskList = getListEntries();

  if (!taskList || taskList.length < 1) return;

  //map state to the container
  const stateMap = {};
  stateMap[STATEVAL.TODO] = `#${lane.TODOID}`;
  stateMap[STATEVAL.WIP] = `#${lane.WIPID}`;
  stateMap[STATEVAL.COMPLETE] = `#${lane.DONEID}`;

  taskList.forEach((t) => {
    let card = null;

    if ((card = createTaskCard(t, getCardStatus(t[STATE], t[DUEDATE])))) {
      
      $(stateMap[t[STATE]]).append(card);
    }
  });
}


function setInputInvalid(element) {
  const invalid = "is-invalid";
  
  if (!element.hasClass(invalid)) element.addClass(invalid);
}


function validateAddTask(elements) {
  let isValid = true;

  const invalid = "is-invalid";
  elements.each(function () {
    let x = null;
    if (!(x = $(this).val()) || x === "") {
      isValid = false;
      setInputInvalid($(this));
    } else {

      if ($(this).attr("id") !== "taskDueDate") {
        $(this).removeClass(invalid);
      } else {
        if (!dayjs($(this).val()).isValid()) {
        
          isValid = false;
          setInputInvalid($(this));
        } else {
          $(this).removeClass(invalid);
        }
      }
    }
  });

  return isValid;
}

// Todo: create a function to handle adding a new task
function handleAddTask(event) {
  event.preventDefault();

  //get all the inputs
  let formInputs = $("#taskTitle, #taskDueDate, #taskDescription");
  if (!validateAddTask(formInputs)) return;
  const task = {};
  formInputs.each(function () {
    task[kvMapping[$(this).attr("id")]] = $(this).val();
    $(this).val("");
  });

  //send to storage
  createEntry(task);
  $("#createTaskModal").modal("hide");
  renderTaskList();
}

// Todo: create a function to handle deleting a task
function handleDeleteTask(event) {
  let id = $(event.target).attr("data-id");
  deleteEntry(id);
  $(`#${id}`).remove();
}

function isAccepted(target, taskId) {
  if (!target || !taskId) return false;

  let entry = null;
  const status = (entry = getEntry(taskId)) ? entry[STATE] : null;
  if (!status) {
    console.log(`warn: unable to get status for ${taskId}`);
    return false;
  }
  if (target === lane.TODOID) return status === STATEVAL.WIP;
 
  if (target === lane.WIPID) return status === STATEVAL.TODO;
 
  if (target === lane.DONEID)
    return status === STATEVAL.TODO || status === STATEVAL.WIP;

  return false;
}

// Todo: create a function to handle dropping a task into a new status lane
function handleDrop(event, ui) {
  let a = event.target.id;
  let b = ui.draggable.data("text");

  if (!isAccepted(a, b)) return;
  setStatus(b, statusLane[a]);


  let x = $(`#${a}`);
  let y = $(`#${b}`);
  y.removeAttr("style");
  x.append(y);

  //clear color
  if (a === lane.DONEID){
    let c = ui.draggable.attr("class")
    .replace(cardColoring.LATE, cardColoring.GOOD)
    .replace(cardColoring.WARN, cardColoring.GOOD);
    ui.draggable.attr("class", c);
  } 
}

// Todo: when the page loads, render the task list,
//add event listeners, make lanes droppable,
//and make the due date field a date picker
$(document).ready(function () {
  $("#taskDueDate").datepicker();
  $("#btnAddTask").on("click", handleAddTask);
  renderTaskList();
  makeDroppable(Object.values(lane));
  makeDeleteDelegate(Object.values(lane));
});


function makeDeleteDelegate(items) {
  items.forEach((item) => {
    console.log(item);
    let x = $(`#${item}`);
    x.on("click", ".btn-delete", handleDeleteTask);
  });
}

function makeDroppable(items) {
  items.forEach((item) => {
    let x = $(`#${item}`);
    x.droppable({
      hoverClass: "hovered",
      drop: handleDrop,
    });
  });
}
