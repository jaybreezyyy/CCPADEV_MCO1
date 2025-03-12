

document.addEventListener("DOMContentLoaded", () => {
  const username = document.getElementById("username");
  const password = document.getElementById("password");
  const loginForm = document.getElementById("login-form");
  const errorElement = document.getElementById("error");

  loginForm.addEventListener("submit", (e) => {
    let messages = [];
    if (username.value === "" && password.value !== "") {
      messages.push("Username is required!");
    }
    else if (password.value === "" && username.value !== "") {
        messages.push("Password is required!");
    }
    else if (username.value === "" && password.value === "") {
        messages.push("Username and Password is required!")
    }
    if (messages.length > 0) {
      e.preventDefault();
      errorElement.innerText = messages;
      errorElement.style.display = "block";
    } else {
      errorElement.style.display = "none";
    }
  });
});
