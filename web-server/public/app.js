const todoList = document.getElementById("todoList");
const todoForm = document.getElementById("todoForm");
const todoTitle = document.getElementById("todoTitle");
const todoCount = document.getElementById("todoCount");
const emptyState = document.getElementById("emptyState");
const refreshButton = document.getElementById("refreshButton");
const serverStatus = document.getElementById("serverStatus");

let todos = [];
const defaultEmptyState = emptyState.textContent;

const api = async (path, options = {}) => {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // ignore JSON parse errors on non-JSON responses
    }
    throw new Error(message);
  }

  return response.status === 204 ? null : response.json();
};

const render = () => {
  todoList.innerHTML = "";
  todoCount.textContent = `${todos.length} item${todos.length === 1 ? "" : "s"}`;
  emptyState.hidden = todos.length > 0;

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " done" : ""}`;
    item.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `Mark todo ${todo.id} as ${todo.completed ? "active" : "complete"}`);
    checkbox.addEventListener("change", async () => {
      await api(`/api/todos/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ completed: checkbox.checked }),
      });
      await loadTodos();
    });

    const main = document.createElement("div");
    main.className = "todo-main";

    const title = document.createElement("input");
    title.type = "text";
    title.value = todo.title;
    title.className = "title";
    title.setAttribute("aria-label", `Edit todo ${todo.id}`);

    const meta = document.createElement("p");
    meta.className = "todo-meta";
    meta.textContent = todo.completed ? "Completed" : "In progress";

    const save = document.createElement("button");
    save.type = "button";
    save.className = "save";
    save.textContent = "Save";
    save.addEventListener("click", async () => {
      await api(`/api/todos/${todo.id}`, {
        method: "PUT",
        body: JSON.stringify({ title: title.value, completed: checkbox.checked }),
      });
      await loadTodos();
    });

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      await api(`/api/todos/${todo.id}`, { method: "DELETE" });
      await loadTodos();
    });

    const actions = document.createElement("div");
    actions.className = "todo-actions";
    actions.append(save, remove);

    main.append(title, meta);
    item.append(checkbox, main, actions);
    todoList.appendChild(item);
  });
};

const loadTodos = async () => {
  serverStatus.textContent = "Loading...";
  serverStatus.dataset.state = "loading";
  try {
    todos = await api("/api/todos");
    serverStatus.textContent = "Online";
    serverStatus.dataset.state = "online";
    render();
    emptyState.textContent = defaultEmptyState;
  } catch (error) {
    serverStatus.textContent = "Offline";
    serverStatus.dataset.state = "offline";
    todoList.innerHTML = "";
    emptyState.hidden = false;
    emptyState.textContent = error.message;
  }
};

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = todoTitle.value.trim();
  if (!title) return;

  await api("/api/todos", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  todoTitle.value = "";
  todoTitle.focus();
  await loadTodos();
});

refreshButton.addEventListener("click", loadTodos);

loadTodos();
