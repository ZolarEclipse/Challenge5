const TASK = "taskEntries";

export const TITLE = "taskTitle";
export const DUEDATE = "taskDueDate";
export const DESCRIPTION = "taskDescription";
export const STATE = "state";
export const ID = "taskId";
export const STATEVAL = {
  TODO: "Not Yet Started",
  WIP: "In Progress",
  COMPLETE: "Completed",
};

function generateTaskId() {

  return crypto.randomUUID();
}


export function getListEntries() {
  let store = localStorage.getItem(TASK);
  return store ? JSON.parse(store) : [];
}


export function getEntry(id) {
  let f = getListEntries().find((t) => id === t[ID]);
  return f ? f : null;
}


export function setStatus(id, status) {
  if (!id || !status) return;
  let f = getEntry(id);
  if (!f) return;

  f[STATE] = status;
  setEntry(id, f);
}


export function setEntry(id, task) {
  if ((!id) || (!task)) return false;
  
  //get existing array
  let store = getListEntries();
  let i = store.findIndex((a) => id === a[ID]);
  if (i > -1) {
    store[i] = { ...store[i], ...task };
    localStorage.setItem(TASK, JSON.stringify(store));
    return true;
  }
  return false;
}



export function createEntry(posting) {
  if (posting) {
    posting[ID] = generateTaskId();
    posting[STATE] = STATEVAL.TODO;

    posting[DUEDATE] = dayjs(posting[DUEDATE]).valueOf();

    let store = getListEntries();
    store.push(posting);
    localStorage.setItem(TASK, JSON.stringify(store));
  }
}

// Removes task

export function deleteEntry(id) {
  if (!id || !getEntry(id)) return false;
  let store = getListEntries();
  store = store.filter((a) => id !== a[ID]);
  localStorage.setItem(TASK, JSON.stringify(store));
  return true;
}

