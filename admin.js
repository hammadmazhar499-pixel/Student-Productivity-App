/* ============================================
   Student Productivity App - Admin Module
   Admin read/write dashboard. Fetches all tasks,
   calculates statistics, and handles CRUD operations.
   ============================================ */

const ADMIN_TASKS_API_URL = "http://localhost:3000/tasks";

const ALLOWED_TYPES = ["Assignment", "Quiz", "Exam", "Project", "Study Session"];
const ALLOWED_PRIORITIES = ["Low", "Medium", "High"];
const ALLOWED_STATUSES = ["Pending", "In Progress", "Completed"];

let currentAdminTasks = [];
let currentEditTaskId = null;
let currentDeleteTaskId = null;

let taskModalInstance = null;
let deleteModalInstance = null;

/**
 * Initializes the admin dashboard once the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
  loadAdminTasks();

  const taskModalEl = document.getElementById("adminTaskModal");
  if (taskModalEl) {
    taskModalInstance = new bootstrap.Modal(taskModalEl);
  }

  const deleteModalEl = document.getElementById("adminDeleteModal");
  if (deleteModalEl) {
    deleteModalInstance = new bootstrap.Modal(deleteModalEl);
  }

  const btnAddTask = document.getElementById("btn-add-task");
  if (btnAddTask) {
    btnAddTask.addEventListener("click", openCreateTaskModal);
  }

  const taskForm = document.getElementById("admin-task-form");
  if (taskForm) {
    taskForm.addEventListener("submit", handleAdminTaskSubmit);
  }

  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener("click", deleteAdminTask);
  }
});

/* ============================================
   ADMIN TASK LOADING AND RENDERING
   ============================================ */

/**
 * Fetches all tasks (both visible and hidden) from JSON Server.
 * Shows loading, error, or empty states as appropriate.
 * Triggers statistics calculation and table rendering on success.
 */
async function loadAdminTasks() {
  showAdminLoading();

  try {
    const response = await fetch(ADMIN_TASKS_API_URL);

    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    const tasks = await response.json();
    currentAdminTasks = tasks;

    if (tasks.length === 0) {
      showAdminEmptyState();
      renderStatistics(calculateStatistics([]));
      return;
    }

    const stats = calculateStatistics(tasks);
    renderStatistics(stats);
    renderAdminTasks(tasks);

  } catch (error) {
    showAdminError();
  }
}

/**
 * Calculates summary statistics from the fetched task array.
 * @param {Array} tasks - Array of all task objects
 * @returns {Object} Object containing total, completed, pending, and completion rate
 */
function calculateStatistics(tasks) {
  let total = tasks.length;
  let completed = 0;
  let pending = 0;
  
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].status === "Completed") {
      completed++;
    } else if (tasks[i].status === "Pending") {
      pending++;
    }
  }

  let rate = 0;
  if (total > 0) {
    rate = Math.round((completed / total) * 100);
  }

  return {
    total: total,
    completed: completed,
    pending: pending,
    rate: rate
  };
}

/**
 * Updates the statistics cards in the DOM.
 * @param {Object} stats - The calculated statistics object
 */
function renderStatistics(stats) {
  document.getElementById("stat-total").textContent = stats.total;
  document.getElementById("stat-completed").textContent = stats.completed;
  document.getElementById("stat-pending").textContent = stats.pending;
  document.getElementById("stat-rate").textContent = stats.rate + "%";
  
  document.getElementById("admin-stats").classList.remove("d-none");
}

/**
 * Renders the task array as table rows.
 * @param {Array} tasks - Array of all task objects
 */
function renderAdminTasks(tasks) {
  clearAdminStates();
  
  const tbody = document.getElementById("admin-table-body");
  tbody.innerHTML = ""; // Clear existing rows

  for (let i = 0; i < tasks.length; i++) {
    const row = createAdminTaskRow(tasks[i]);
    tbody.appendChild(row);
  }

  document.getElementById("admin-table-container").classList.remove("d-none");
}

/**
 * Creates a table row element for a single task using DOM methods.
 * @param {Object} task - A single task object
 * @returns {HTMLElement} A table row element (tr)
 */
function createAdminTaskRow(task) {
  const tr = document.createElement("tr");

  const tdTitle = document.createElement("td");
  tdTitle.style.paddingLeft = "24px";
  tdTitle.className = "fw-medium";
  tdTitle.textContent = task.title;
  tr.appendChild(tdTitle);

  const tdCourse = document.createElement("td");
  tdCourse.style.fontSize = "0.85rem";
  tdCourse.textContent = task.course;
  tr.appendChild(tdCourse);

  const tdType = document.createElement("td");
  const badgeType = document.createElement("span");
  badgeType.className = "badge badge-type";
  badgeType.textContent = task.type;
  tdType.appendChild(badgeType);
  tr.appendChild(tdType);

  const tdDueDate = document.createElement("td");
  tdDueDate.textContent = formatDate(task.dueDate);
  tr.appendChild(tdDueDate);

  const tdPriority = document.createElement("td");
  tdPriority.appendChild(createPriorityBadge(task.priority));
  tr.appendChild(tdPriority);

  const tdStatus = document.createElement("td");
  tdStatus.appendChild(createStatusBadge(task.status));
  tr.appendChild(tdStatus);

  const tdHours = document.createElement("td");
  tdHours.textContent = task.estimatedHours;
  tr.appendChild(tdHours);

  const tdSource = document.createElement("td");
  const sourceDetails = getSourceBadgeDetails(task.source);
  const sourceBadge = document.createElement("span");
  sourceBadge.className = "badge " + sourceDetails.className;
  sourceBadge.textContent = sourceDetails.text;
  tdSource.appendChild(sourceBadge);
  tr.appendChild(tdSource);

  const tdVisibility = document.createElement("td");
  const visibilityBadge = document.createElement("span");
  if (task.isVisible) {
    visibilityBadge.className = "badge badge-visible";
    visibilityBadge.textContent = "Visible";
  } else {
    visibilityBadge.className = "badge badge-hidden";
    visibilityBadge.textContent = "Hidden";
  }
  tdVisibility.appendChild(visibilityBadge);
  tr.appendChild(tdVisibility);

  const tdCreated = document.createElement("td");
  tdCreated.style.fontSize = "0.85rem";
  tdCreated.textContent = formatDate(task.createdAt);
  tr.appendChild(tdCreated);

  // Actions Column
  const tdActions = document.createElement("td");
  tdActions.className = "td-actions";
  tdActions.style.paddingRight = "24px";

  const btnEdit = document.createElement("button");
  btnEdit.type = "button";
  btnEdit.className = "btn btn-sm btn-outline-primary";

  const editIcon = document.createElement("i");
  editIcon.className = "bi bi-pencil-square";
  editIcon.setAttribute("aria-hidden", "true");
  btnEdit.appendChild(editIcon);
  btnEdit.appendChild(document.createTextNode(" Edit"));

  btnEdit.addEventListener("click", function () {
    openEditTaskModal(task.id);
  });
  
  const btnDelete = document.createElement("button");
  btnDelete.type = "button";
  btnDelete.className = "btn btn-sm btn-outline-danger";

  const deleteIcon = document.createElement("i");
  deleteIcon.className = "bi bi-trash3";
  deleteIcon.setAttribute("aria-hidden", "true");
  btnDelete.appendChild(deleteIcon);
  btnDelete.appendChild(document.createTextNode(" Delete"));

  btnDelete.addEventListener("click", function () {
    openDeleteTaskModal(task.id, task.title);
  });

  tdActions.appendChild(btnEdit);
  tdActions.appendChild(btnDelete);
  tr.appendChild(tdActions);

  return tr;
}

/* ============================================
   ADMIN CRUD OPERATIONS
   ============================================ */

/**
 * Prepares and opens the task modal in create mode.
 */
function openCreateTaskModal() {
  currentEditTaskId = null;
  document.getElementById("admin-task-form").reset();
  clearAdminFormValidation();
  hideAdminModalError();

  document.getElementById("adminTaskModalLabel").textContent = "Add New Task";
  document.getElementById("adminTaskStatus").value = "Pending";
  document.getElementById("adminTaskVisible").checked = true;

  if (taskModalInstance) {
    taskModalInstance.show();
  }
}

/**
 * Prepares and opens the task modal in edit mode.
 * @param {number|string} id - The task ID to edit
 */
function openEditTaskModal(id) {
  let task = null;
  for (let i = 0; i < currentAdminTasks.length; i++) {
    if (currentAdminTasks[i].id === id) {
      task = currentAdminTasks[i];
      break;
    }
  }

  if (!task) return;

  currentEditTaskId = task.id;
  clearAdminFormValidation();
  hideAdminModalError();

  document.getElementById("adminTaskModalLabel").textContent = "Edit Task";
  
  document.getElementById("adminTaskTitle").value = task.title;
  document.getElementById("adminTaskCourse").value = task.course;
  document.getElementById("adminTaskType").value = task.type;
  document.getElementById("adminTaskDueDate").value = task.dueDate;
  document.getElementById("adminTaskPriority").value = task.priority;
  document.getElementById("adminTaskStatus").value = task.status;
  document.getElementById("adminTaskHours").value = task.estimatedHours;
  document.getElementById("adminTaskDescription").value = task.description || "";
  document.getElementById("adminTaskVisible").checked = task.isVisible;

  if (taskModalInstance) {
    taskModalInstance.show();
  }
}

/**
 * Handles submission of the admin task form (both create and edit).
 * @param {Event} event - The form submit event
 */
async function handleAdminTaskSubmit(event) {
  event.preventDefault();
  hideAdminModalError();
  clearAdminFormValidation();

  if (!validateAdminTaskForm()) {
    return;
  }

  const taskData = getAdminTaskFormValues();

  if (currentEditTaskId === null) {
    await createAdminTask(taskData);
  } else {
    await updateAdminTask(currentEditTaskId, taskData);
  }
}

/**
 * Reads form fields and builds the task object.
 * Automatically assigns createdAt if in create mode.
 * @returns {Object} Validated task object ready for submission
 */
function getAdminTaskFormValues() {
  const data = {
    title: document.getElementById("adminTaskTitle").value.trim(),
    course: document.getElementById("adminTaskCourse").value.trim(),
    type: document.getElementById("adminTaskType").value,
    dueDate: document.getElementById("adminTaskDueDate").value,
    priority: document.getElementById("adminTaskPriority").value,
    status: document.getElementById("adminTaskStatus").value,
    estimatedHours: Number(document.getElementById("adminTaskHours").value),
    description: document.getElementById("adminTaskDescription").value.trim(),
    isVisible: document.getElementById("adminTaskVisible").checked
  };

  if (currentEditTaskId === null) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    data.createdAt = year + "-" + month + "-" + day;
    data.source = "Admin";
  }

  return data;
}

/**
 * Sends a POST request to create a new task.
 * @param {Object} taskData - The new task data
 */
async function createAdminTask(taskData) {
  try {
    const response = await fetch(ADMIN_TASKS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    if (taskModalInstance) {
      taskModalInstance.hide();
    }
    showAdminSuccessMessage("Task successfully created.");
    await loadAdminTasks();
  } catch (error) {
    showAdminModalError();
  }
}

/**
 * Sends a PATCH request to update an existing task.
 * @param {number|string} id - The task ID
 * @param {Object} taskData - The updated task data
 */
async function updateAdminTask(id, taskData) {
  try {
    const response = await fetch(ADMIN_TASKS_API_URL + "/" + id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    if (taskModalInstance) {
      taskModalInstance.hide();
    }
    showAdminSuccessMessage("Task successfully updated.");
    await loadAdminTasks();
  } catch (error) {
    showAdminModalError();
  }
}

/**
 * Prepares and opens the delete confirmation modal.
 * @param {number|string} id - The task ID to delete
 * @param {string} title - The title of the task to delete
 */
function openDeleteTaskModal(id, title) {
  currentDeleteTaskId = id;
  document.getElementById("delete-task-title-display").textContent = title;
  
  const errorAlert = document.getElementById("admin-delete-error");
  if (errorAlert) {
    errorAlert.classList.add("d-none");
  }

  if (deleteModalInstance) {
    deleteModalInstance.show();
  }
}

/**
 * Sends a DELETE request to remove a task.
 */
async function deleteAdminTask() {
  if (currentDeleteTaskId === null) return;

  try {
    const response = await fetch(ADMIN_TASKS_API_URL + "/" + currentDeleteTaskId, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    if (deleteModalInstance) {
      deleteModalInstance.hide();
    }
    showAdminSuccessMessage("Task successfully deleted.");
    currentDeleteTaskId = null;
    await loadAdminTasks();
  } catch (error) {
    const errorAlert = document.getElementById("admin-delete-error");
    if (errorAlert) {
      errorAlert.classList.remove("d-none");
    }
  }
}

/* ============================================
   ADMIN FORM VALIDATION
   ============================================ */

/**
 * Validates the admin form fields.
 * @returns {boolean} True if all fields are valid
 */
function validateAdminTaskForm() {
  let isValid = true;

  // Title
  const title = document.getElementById("adminTaskTitle").value.trim();
  if (title.length === 0) {
    showAdminFieldError("adminTaskTitle", "adminTaskTitleFeedback", "Task title is required.");
    isValid = false;
  } else if (title.length < 3) {
    showAdminFieldError("adminTaskTitle", "adminTaskTitleFeedback", "Title must be at least 3 characters.");
    isValid = false;
  } else if (title.length > 100) {
    showAdminFieldError("adminTaskTitle", "adminTaskTitleFeedback", "Title must not exceed 100 characters.");
    isValid = false;
  } else {
    clearAdminFieldError("adminTaskTitle", "adminTaskTitleFeedback");
  }

  // Course
  const course = document.getElementById("adminTaskCourse").value.trim();
  if (course.length === 0) {
    showAdminFieldError("adminTaskCourse", "adminTaskCourseFeedback", "Course is required.");
    isValid = false;
  } else if (course.length < 2) {
    showAdminFieldError("adminTaskCourse", "adminTaskCourseFeedback", "Course must be at least 2 characters.");
    isValid = false;
  } else if (course.length > 80) {
    showAdminFieldError("adminTaskCourse", "adminTaskCourseFeedback", "Course must not exceed 80 characters.");
    isValid = false;
  } else {
    clearAdminFieldError("adminTaskCourse", "adminTaskCourseFeedback");
  }

  // Task Type
  const type = document.getElementById("adminTaskType").value;
  if (type === "") {
    showAdminFieldError("adminTaskType", "adminTaskTypeFeedback", "Please select a task type.");
    isValid = false;
  } else if (ALLOWED_TYPES.indexOf(type) === -1) {
    showAdminFieldError("adminTaskType", "adminTaskTypeFeedback", "Invalid task type selected.");
    isValid = false;
  } else {
    clearAdminFieldError("adminTaskType", "adminTaskTypeFeedback");
  }

  // Due Date (Allow past dates for editing overdue tasks)
  const dueDateValue = document.getElementById("adminTaskDueDate").value;
  if (dueDateValue === "") {
    showAdminFieldError("adminTaskDueDate", "adminTaskDueDateFeedback", "Due date is required.");
    isValid = false;
  } else {
    const selectedDate = new Date(dueDateValue + "T00:00:00");
    if (isNaN(selectedDate.getTime())) {
      showAdminFieldError("adminTaskDueDate", "adminTaskDueDateFeedback", "Please enter a valid date.");
      isValid = false;
    } else {
      clearAdminFieldError("adminTaskDueDate", "adminTaskDueDateFeedback");
    }
  }

  // Priority
  const priority = document.getElementById("adminTaskPriority").value;
  if (priority === "") {
    showAdminFieldError("adminTaskPriority", "adminTaskPriorityFeedback", "Please select a priority level.");
    isValid = false;
  } else if (ALLOWED_PRIORITIES.indexOf(priority) === -1) {
    showAdminFieldError("adminTaskPriority", "adminTaskPriorityFeedback", "Invalid priority selected.");
    isValid = false;
  } else {
    clearAdminFieldError("adminTaskPriority", "adminTaskPriorityFeedback");
  }

  // Status
  const status = document.getElementById("adminTaskStatus").value;
  if (status === "") {
    showAdminFieldError("adminTaskStatus", "adminTaskStatusFeedback", "Please select a status.");
    isValid = false;
  } else if (ALLOWED_STATUSES.indexOf(status) === -1) {
    showAdminFieldError("adminTaskStatus", "adminTaskStatusFeedback", "Invalid status selected.");
    isValid = false;
  } else {
    clearAdminFieldError("adminTaskStatus", "adminTaskStatusFeedback");
  }

  // Estimated Hours
  const hoursInput = document.getElementById("adminTaskHours").value;
  if (hoursInput === "") {
    showAdminFieldError("adminTaskHours", "adminTaskHoursFeedback", "Estimated hours is required.");
    isValid = false;
  } else {
    const hoursValue = Number(hoursInput);
    if (isNaN(hoursValue)) {
      showAdminFieldError("adminTaskHours", "adminTaskHoursFeedback", "Estimated hours must be a number.");
      isValid = false;
    } else if (hoursValue <= 0) {
      showAdminFieldError("adminTaskHours", "adminTaskHoursFeedback", "Estimated hours must be greater than 0.");
      isValid = false;
    } else if (hoursValue > 100) {
      showAdminFieldError("adminTaskHours", "adminTaskHoursFeedback", "Estimated hours must not exceed 100.");
      isValid = false;
    } else {
      clearAdminFieldError("adminTaskHours", "adminTaskHoursFeedback");
    }
  }

  // Description
  const description = document.getElementById("adminTaskDescription").value.trim();
  if (description.length > 500) {
    showAdminFieldError("adminTaskDescription", "adminTaskDescriptionFeedback", "Description must not exceed 500 characters.");
    isValid = false;
  } else {
    clearAdminFieldError("adminTaskDescription", "adminTaskDescriptionFeedback");
  }

  return isValid;
}

function showAdminFieldError(fieldId, feedbackId, message) {
  const field = document.getElementById(fieldId);
  const feedback = document.getElementById(feedbackId);
  field.classList.add("is-invalid");
  field.classList.remove("is-valid");
  feedback.textContent = message;
}

function clearAdminFieldError(fieldId, feedbackId) {
  const field = document.getElementById(fieldId);
  const feedback = document.getElementById(feedbackId);
  field.classList.remove("is-invalid");
  field.classList.add("is-valid");
  feedback.textContent = "";
}

function clearAdminFormValidation() {
  const fieldIds = [
    "adminTaskTitle", "adminTaskCourse", "adminTaskType",
    "adminTaskDueDate", "adminTaskPriority", "adminTaskStatus",
    "adminTaskHours", "adminTaskDescription"
  ];
  const feedbackIds = [
    "adminTaskTitleFeedback", "adminTaskCourseFeedback", "adminTaskTypeFeedback",
    "adminTaskDueDateFeedback", "adminTaskPriorityFeedback", "adminTaskStatusFeedback",
    "adminTaskHoursFeedback", "adminTaskDescriptionFeedback"
  ];

  for (let i = 0; i < fieldIds.length; i++) {
    const field = document.getElementById(fieldIds[i]);
    const feedback = document.getElementById(feedbackIds[i]);
    if (field && feedback) {
      field.classList.remove("is-invalid", "is-valid");
      feedback.textContent = "";
    }
  }
}

/* ============================================
   ADMIN HELPER FUNCTIONS
   ============================================ */

function createPriorityBadge(priority) {
  let badgeClass = "badge-low";
  if (priority === "High") {
    badgeClass = "badge-high";
  } else if (priority === "Medium") {
    badgeClass = "badge-medium";
  } else if (priority === "Low") {
    badgeClass = "badge-low";
  }
  const badge = document.createElement("span");
  badge.className = "badge " + badgeClass;
  badge.textContent = priority;
  return badge;
}

function createStatusBadge(status) {
  let badgeClass = "badge-pending";
  if (status === "Completed") {
    badgeClass = "badge-completed";
  } else if (status === "In Progress") {
    badgeClass = "badge-inprogress";
  } else if (status === "Pending") {
    badgeClass = "badge-pending";
  }
  const badge = document.createElement("span");
  badge.className = "badge " + badgeClass;
  badge.textContent = status;
  return badge;
}

/**
 * Returns badge text and CSS class based on task source.
 * @param {string} source - The source string ("Student" or "Admin")
 * @returns {Object} Object containing text and className properties
 */
function getSourceBadgeDetails(source) {
  if (source === "Student") {
    return { text: "Personal", className: "badge-personal" };
  } else if (source === "Admin") {
    return { text: "Official", className: "badge-official" };
  }
  return { text: "Task", className: "badge-personal" };
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/* ============================================
   ADMIN UI STATE MANAGEMENT
   ============================================ */

function showAdminLoading() {
  clearAdminStates();
  document.getElementById("admin-loading").classList.remove("d-none");
}

function showAdminError() {
  clearAdminStates();
  document.getElementById("admin-stats").classList.add("d-none");
  document.getElementById("admin-error").classList.remove("d-none");
}

function showAdminEmptyState() {
  clearAdminStates();
  document.getElementById("admin-stats").classList.add("d-none");
  document.getElementById("admin-empty").classList.remove("d-none");
}

function clearAdminStates() {
  document.getElementById("admin-loading").classList.add("d-none");
  document.getElementById("admin-error").classList.add("d-none");
  document.getElementById("admin-empty").classList.add("d-none");
  document.getElementById("admin-table-container").classList.add("d-none");
}

function showAdminSuccessMessage(message) {
  const successEl = document.getElementById("admin-success");
  const successText = document.getElementById("admin-success-text");
  if (successEl && successText) {
    successText.textContent = message;
    successEl.classList.remove("d-none");
    
    // Auto hide after 4 seconds
    setTimeout(function() {
      successEl.classList.add("d-none");
    }, 4000);
  }
}

function hideAdminSuccessMessage() {
  const successEl = document.getElementById("admin-success");
  if (successEl) {
    successEl.classList.add("d-none");
  }
}

function showAdminModalError() {
  const errorEl = document.getElementById("admin-modal-error");
  if (errorEl) {
    errorEl.classList.remove("d-none");
  }
}

function hideAdminModalError() {
  const errorEl = document.getElementById("admin-modal-error");
  if (errorEl) {
    errorEl.classList.add("d-none");
  }
}
