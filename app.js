/* ============================================
   Student Productivity App - Main Application
   Fetches and displays visible academic tasks
   from JSON Server. Handles task creation with
   inline validation and POST requests.
   Supports filtering by status and task type.
   ============================================ */

/** Base URL for the tasks API endpoint */
const TASKS_API_URL = "http://localhost:3000/tasks";

/** Allowed task types used for validation */
const ALLOWED_TYPES = ["Assignment", "Quiz", "Exam", "Project", "Study Session"];

/** Allowed priority levels used for validation */
const ALLOWED_PRIORITIES = ["Low", "Medium", "High"];

/**
 * Initializes the application once the DOM is fully loaded.
 * Loads existing tasks, attaches the form submit listener,
 * and attaches filter change listeners.
 */
document.addEventListener("DOMContentLoaded", function () {
  loadTasks();

  var taskForm = document.getElementById("task-form");
  if (taskForm) {
    taskForm.addEventListener("submit", handleTaskSubmit);
  }

  var statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", handleFilterChange);
  }

  var typeFilter = document.getElementById("typeFilter");
  if (typeFilter) {
    typeFilter.addEventListener("change", handleFilterChange);
  }

  var resetButton = document.getElementById("resetFiltersButton");
  if (resetButton) {
    resetButton.addEventListener("click", resetFilters);
  }
});

/* ============================================
   TASK LOADING AND RENDERING
   ============================================ */

/**
 * Fetches visible tasks from JSON Server using the current
 * filter selections and renders them. Shows loading, error,
 * or empty states as appropriate.
 */
async function loadTasks() {
  showLoading();

  try {
    var url = buildTasksUrl();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    const tasks = await response.json();

    hideLoading();

    if (tasks.length === 0) {
      showEmptyState();
      return;
    }

    renderTasks(tasks);
  } catch (error) {
    hideLoading();
    showErrorState();
  }
}

/**
 * Displays the loading spinner and hides other states.
 */
function showLoading() {
  document.getElementById("loading-state").classList.remove("d-none");
  document.getElementById("error-state").classList.add("d-none");
  document.getElementById("empty-state").classList.add("d-none");
  document.getElementById("task-container").classList.add("d-none");
}

/**
 * Hides the loading spinner.
 */
function hideLoading() {
  document.getElementById("loading-state").classList.add("d-none");
}

/**
 * Shows the error alert when JSON Server is unreachable
 * or the fetch request fails.
 */
function showErrorState() {
  document.getElementById("error-state").classList.remove("d-none");
}

/**
 * Shows the empty state message when no visible tasks match
 * the current filters.
 */
function showEmptyState() {
  document.getElementById("empty-state").classList.remove("d-none");
}

/**
 * Renders an array of task objects as Bootstrap cards
 * inside the task container.
 * @param {Array} tasks - Array of task objects from the API
 */
function renderTasks(tasks) {
  const container = document.getElementById("task-container");
  container.innerHTML = "";

  for (let i = 0; i < tasks.length; i++) {
    const card = createTaskCard(tasks[i]);
    container.appendChild(card);
  }

  container.classList.remove("d-none");
}

/**
 * Creates a single task card column element using DOM methods.
 * @param {Object} task - A single task object
 * @returns {HTMLElement} A Bootstrap column element containing the task card
 */
function createTaskCard(task) {
  /* Column wrapper */
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  /* Card */
  const card = document.createElement("div");
  card.className = "task-card";

  /* Card Body */
  const cardBody = document.createElement("div");
  cardBody.className = "card-body";

  /* Title */
  const title = document.createElement("h5");
  title.className = "card-title";
  title.textContent = task.title;

  /* Course */
  const course = document.createElement("h6");
  course.className = "card-subtitle";
  course.textContent = task.course;

  /* Badge Group */
  const badgeGroup = document.createElement("div");
  badgeGroup.className = "badge-group";

  const sourceDetails = getSourceBadgeDetails(task.source);
  const sourceBadge = createBadge(sourceDetails.text, sourceDetails.className);
  const typeBadge = createBadge(task.type, "badge-type");
  const priorityBadge = createPriorityBadge(task.priority);
  const statusBadge = createStatusBadge(task.status);

  badgeGroup.appendChild(sourceBadge);
  badgeGroup.appendChild(typeBadge);
  badgeGroup.appendChild(priorityBadge);
  badgeGroup.appendChild(statusBadge);

  /* Description */
  const description = document.createElement("p");
  description.className = "card-text";
  description.textContent = task.description;

  /* Card Footer */
  const cardFooter = document.createElement("div");
  cardFooter.className = "card-footer";

  const dueDate = document.createElement("span");
  dueDate.className = "meta-text";
  dueDate.textContent = "Due: " + formatDate(task.dueDate);

  const hours = document.createElement("span");
  hours.className = "meta-text";
  hours.textContent = task.estimatedHours + "h";

  cardFooter.appendChild(dueDate);
  cardFooter.appendChild(hours);

  /* Assemble card */
  cardBody.appendChild(title);
  cardBody.appendChild(course);
  cardBody.appendChild(badgeGroup);
  cardBody.appendChild(description);

  card.appendChild(cardBody);
  card.appendChild(cardFooter);
  col.appendChild(card);

  return col;
}

/**
 * Creates a Bootstrap badge span element.
 * @param {string} text - The badge text content
 * @param {string} className - Bootstrap badge class string
 * @returns {HTMLElement} A span element styled as a badge
 */
function createBadge(text, className) {
  const badge = document.createElement("span");
  badge.className = "badge " + className;
  badge.textContent = text;
  return badge;
}

/**
 * Creates a priority badge with color based on priority level.
 * High = red, Medium = orange, Low = green.
 * @param {string} priority - The priority level string
 * @returns {HTMLElement} A styled badge span element
 */
function createPriorityBadge(priority) {
  let badgeClass = "badge-low";

  if (priority === "High") {
    badgeClass = "badge-high";
  } else if (priority === "Medium") {
    badgeClass = "badge-medium";
  } else if (priority === "Low") {
    badgeClass = "badge-low";
  }

  return createBadge(priority, badgeClass);
}

/**
 * Creates a status badge with color based on task status.
 * Completed = green, In Progress = blue, Pending = amber.
 * @param {string} status - The task status string
 * @returns {HTMLElement} A styled badge span element
 */
function createStatusBadge(status) {
  let badgeClass = "badge-pending";

  if (status === "Completed") {
    badgeClass = "badge-completed";
  } else if (status === "In Progress") {
    badgeClass = "badge-inprogress";
  } else if (status === "Pending") {
    badgeClass = "badge-pending";
  }

  return createBadge(status, badgeClass);
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

/**
 * Formats an ISO date string into a human-readable format.
 * Example: "2026-06-10" becomes "Jun 10, 2026".
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/* ============================================
   TASK FILTERING LOGIC
   ============================================ */

/**
 * Reads the current values from the status and type filter dropdowns.
 * @returns {Object} An object with status and type properties
 */
function getSelectedFilters() {
  var statusEl = document.getElementById("statusFilter");
  var typeEl = document.getElementById("typeFilter");

  return {
    status: statusEl ? statusEl.value : "",
    type: typeEl ? typeEl.value : ""
  };
}

/**
 * Builds the full API URL with query parameters using URLSearchParams.
 * Always includes isVisible=true. Adds status and type only when selected.
 * @returns {string} The complete URL for the GET request
 */
function buildTasksUrl() {
  var filters = getSelectedFilters();
  var params = new URLSearchParams();

  params.append("isVisible", "true");

  if (filters.status !== "") {
    params.append("status", filters.status);
  }

  if (filters.type !== "") {
    params.append("type", filters.type);
  }

  return TASKS_API_URL + "?" + params.toString();
}

/**
 * Handles a change event on either filter dropdown.
 * Re-fetches the task list using the updated filter values.
 */
function handleFilterChange() {
  loadTasks();
}

/**
 * Resets both filter dropdowns to their default values
 * and re-fetches all visible tasks.
 */
function resetFilters() {
  var statusEl = document.getElementById("statusFilter");
  var typeEl = document.getElementById("typeFilter");

  if (statusEl) {
    statusEl.value = "";
  }

  if (typeEl) {
    typeEl.value = "";
  }

  loadTasks();
}

/* ============================================
   TASK CREATION FORM LOGIC
   ============================================ */

/**
 * Handles the task form submission event.
 * Validates fields, sends POST request, and refreshes the task list
 * using the currently selected filters.
 * @param {Event} event - The form submit event
 */
async function handleTaskSubmit(event) {
  event.preventDefault();

  hideFormMessages();
  clearFormValidation();

  var isValid = validateTaskForm();

  if (!isValid) {
    return;
  }

  var taskData = getTaskFormValues();

  var created = await createTask(taskData);

  if (created) {
    showSubmissionSuccess();
    document.getElementById("task-form").reset();
    clearFormValidation();
    await loadTasks();
  }
}

/**
 * Validates all required form fields and displays inline error messages.
 * @returns {boolean} True if all fields are valid, false otherwise
 */
function validateTaskForm() {
  var isValid = true;

  /* Title validation */
  var title = document.getElementById("taskTitle").value.trim();
  if (title.length === 0) {
    showFieldError("taskTitle", "taskTitleFeedback", "Task title is required.");
    isValid = false;
  } else if (title.length < 3) {
    showFieldError("taskTitle", "taskTitleFeedback", "Title must be at least 3 characters.");
    isValid = false;
  } else if (title.length > 100) {
    showFieldError("taskTitle", "taskTitleFeedback", "Title must not exceed 100 characters.");
    isValid = false;
  } else {
    clearFieldError("taskTitle", "taskTitleFeedback");
  }

  /* Course validation */
  var course = document.getElementById("taskCourse").value.trim();
  if (course.length === 0) {
    showFieldError("taskCourse", "taskCourseFeedback", "Course is required.");
    isValid = false;
  } else if (course.length < 2) {
    showFieldError("taskCourse", "taskCourseFeedback", "Course must be at least 2 characters.");
    isValid = false;
  } else if (course.length > 80) {
    showFieldError("taskCourse", "taskCourseFeedback", "Course must not exceed 80 characters.");
    isValid = false;
  } else {
    clearFieldError("taskCourse", "taskCourseFeedback");
  }

  /* Task Type validation */
  var type = document.getElementById("taskType").value;
  if (type === "") {
    showFieldError("taskType", "taskTypeFeedback", "Please select a task type.");
    isValid = false;
  } else if (ALLOWED_TYPES.indexOf(type) === -1) {
    showFieldError("taskType", "taskTypeFeedback", "Invalid task type selected.");
    isValid = false;
  } else {
    clearFieldError("taskType", "taskTypeFeedback");
  }

  /* Due Date validation */
  var dueDateValue = document.getElementById("taskDueDate").value;
  if (dueDateValue === "") {
    showFieldError("taskDueDate", "taskDueDateFeedback", "Due date is required.");
    isValid = false;
  } else {
    var selectedDate = new Date(dueDateValue + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selectedDate.getTime())) {
      showFieldError("taskDueDate", "taskDueDateFeedback", "Please enter a valid date.");
      isValid = false;
    } else if (selectedDate < today) {
      showFieldError("taskDueDate", "taskDueDateFeedback", "Due date cannot be earlier than today.");
      isValid = false;
    } else {
      clearFieldError("taskDueDate", "taskDueDateFeedback");
    }
  }

  /* Priority validation */
  var priority = document.getElementById("taskPriority").value;
  if (priority === "") {
    showFieldError("taskPriority", "taskPriorityFeedback", "Please select a priority level.");
    isValid = false;
  } else if (ALLOWED_PRIORITIES.indexOf(priority) === -1) {
    showFieldError("taskPriority", "taskPriorityFeedback", "Invalid priority selected.");
    isValid = false;
  } else {
    clearFieldError("taskPriority", "taskPriorityFeedback");
  }

  /* Estimated Hours validation */
  var hoursInput = document.getElementById("taskHours").value;
  if (hoursInput === "") {
    showFieldError("taskHours", "taskHoursFeedback", "Estimated hours is required.");
    isValid = false;
  } else {
    var hoursValue = Number(hoursInput);
    if (isNaN(hoursValue)) {
      showFieldError("taskHours", "taskHoursFeedback", "Estimated hours must be a number.");
      isValid = false;
    } else if (hoursValue <= 0) {
      showFieldError("taskHours", "taskHoursFeedback", "Estimated hours must be greater than 0.");
      isValid = false;
    } else if (hoursValue > 100) {
      showFieldError("taskHours", "taskHoursFeedback", "Estimated hours must not exceed 100.");
      isValid = false;
    } else {
      clearFieldError("taskHours", "taskHoursFeedback");
    }
  }

  /* Description validation (optional, max 500 characters) */
  var description = document.getElementById("taskDescription").value.trim();
  if (description.length > 500) {
    showFieldError("taskDescription", "taskDescriptionFeedback", "Description must not exceed 500 characters.");
    isValid = false;
  } else {
    clearFieldError("taskDescription", "taskDescriptionFeedback");
  }

  return isValid;
}

/**
 * Reads the form field values and builds a task object.
 * Automatically assigns status, isVisible, and createdAt.
 * Does not assign an id (JSON Server creates it).
 * @returns {Object} Task object ready for POST request
 */
function getTaskFormValues() {
  var today = new Date();
  var year = today.getFullYear();
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var day = String(today.getDate()).padStart(2, "0");
  var createdAt = year + "-" + month + "-" + day;

  return {
    title: document.getElementById("taskTitle").value.trim(),
    course: document.getElementById("taskCourse").value.trim(),
    type: document.getElementById("taskType").value,
    dueDate: document.getElementById("taskDueDate").value,
    priority: document.getElementById("taskPriority").value,
    estimatedHours: Number(document.getElementById("taskHours").value),
    description: document.getElementById("taskDescription").value.trim(),
    status: "Pending",
    isVisible: true,
    createdAt: createdAt,
    source: "Student"
  };
}

/**
 * Sends a POST request to JSON Server to create a new task.
 * @param {Object} taskData - The task object to send
 * @returns {boolean} True if creation succeeded, false otherwise
 */
async function createTask(taskData) {
  try {
    var response = await fetch(TASKS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }

    await response.json();
    return true;
  } catch (error) {
    showSubmissionError();
    return false;
  }
}

/**
 * Marks a form field as invalid and displays an error message.
 * Uses Bootstrap's is-invalid class for styling.
 * @param {string} fieldId - The id of the input element
 * @param {string} feedbackId - The id of the feedback div
 * @param {string} message - The error message to display
 */
function showFieldError(fieldId, feedbackId, message) {
  var field = document.getElementById(fieldId);
  var feedback = document.getElementById(feedbackId);

  field.classList.add("is-invalid");
  field.classList.remove("is-valid");
  feedback.textContent = message;
}

/**
 * Clears the validation state from a form field.
 * Marks the field as valid using Bootstrap's is-valid class.
 * @param {string} fieldId - The id of the input element
 * @param {string} feedbackId - The id of the feedback div
 */
function clearFieldError(fieldId, feedbackId) {
  var field = document.getElementById(fieldId);
  var feedback = document.getElementById(feedbackId);

  field.classList.remove("is-invalid");
  field.classList.add("is-valid");
  feedback.textContent = "";
}

/**
 * Removes all validation classes and feedback messages from every form field.
 * Called after successful submission or before re-validating.
 */
function clearFormValidation() {
  var fieldIds = [
    "taskTitle", "taskCourse", "taskType",
    "taskDueDate", "taskPriority", "taskHours",
    "taskDescription"
  ];

  var feedbackIds = [
    "taskTitleFeedback", "taskCourseFeedback", "taskTypeFeedback",
    "taskDueDateFeedback", "taskPriorityFeedback", "taskHoursFeedback",
    "taskDescriptionFeedback"
  ];

  for (var i = 0; i < fieldIds.length; i++) {
    var field = document.getElementById(fieldIds[i]);
    var feedback = document.getElementById(feedbackIds[i]);

    field.classList.remove("is-invalid");
    field.classList.remove("is-valid");
    feedback.textContent = "";
  }
}

/**
 * Displays the success message after a task is created.
 * Automatically hides after 4 seconds.
 */
function showSubmissionSuccess() {
  var successEl = document.getElementById("form-success");
  successEl.classList.remove("d-none");

  setTimeout(function () {
    successEl.classList.add("d-none");
  }, 4000);
}

/**
 * Displays the submission error message when the POST request fails.
 */
function showSubmissionError() {
  document.getElementById("form-error").classList.remove("d-none");
}

/**
 * Hides both the success and error messages in the form section.
 * Called at the start of each submission attempt.
 */
function hideFormMessages() {
  document.getElementById("form-success").classList.add("d-none");
  document.getElementById("form-error").classList.add("d-none");
}
