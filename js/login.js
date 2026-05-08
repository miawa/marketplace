const msgEl  = document.getElementById("msg");
  const btnEl  = document.getElementById("loginBtn");

  //helper function for error and success messages 
  function showMsg(text, type = "error") {
    msgEl.textContent = text;
    msgEl.className   = "msg " + type;
  }

  //email and password login. could change to username also logs person in? 
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    btnEl.disabled    = true;
    btnEl.textContent = "Logging in…";

    try {
      await logIn( document.getElementById("email").value, document.getElementById("password").value);
      window.location.href = "index.html";
    } catch (err) {
      showMsg(err.message);
      btnEl.disabled    = false;
      btnEl.textContent = "Login";
    }
  });


  // forgot password
  document.getElementById("forgotLink").addEventListener("click", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value.trim();
            if (!email) { showMsg("Please enter your email"); return; }

            //supabase has own forgot password / reset system we can use unless opt for custom one
            const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + "/index.html"
                });

        if (error) { showMsg(error.message); 

        }else        { 
            showMsg("Password reset email sent."); 
        }
  });


  //if user already logged into session, continues as logged in user by redirecting to main page.
  (async () => {
    const session = await getSession();
    if (session) window.location.href = "index.html";
  })();