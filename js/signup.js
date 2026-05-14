const msgEl = document.getElementById("msg");

      function showMsg(text, type = "error") {
        msgEl.textContent = text;
        msgEl.className   = "msg " + type;
      }

      //registering user 
      
      function goToStep2() {

        const username = document.getElementById("username").value.trim();
        const email    = document.getElementById("registeredEmail").value.trim();

        const pass     = document.getElementById("registeredPassword").value;
        const confirm  = document.getElementById("registeredPasswordConfirm").value;

        //basic validation - could definitely add more fields although supabase does its own validation too, so can 
        //get tricky with compatability
            if (!username || !email || !pass) {
                return showMsg("Please fill in all fields.");
            }
            if (!/^[a-z0-9_]+$/i.test(username)) {
            return showMsg("Username can only contain letters, numbers, and underscores.");
            }
            if (pass.length < 6) {
            return showMsg("Password must be at least 6 characters.");
            }
            if (pass !== confirm) {
            return showMsg("Passwords do not match.");
            }

        msgEl.className = "msg"; 
        document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
        document.getElementById("step2").classList.add("active");

    //sets default avatar before uploading own, can keep basic     
        document.getElementById("avatarImg").src =
          `https://rmawimcxlvvmhuznzsnt.supabase.co/storage/v1/object/public/profilePictures/default-avatar.jpg`;
      }

      
      let avatarBase64 = null;
    //handles profile picture converts to uploadable format, previews image on page
      document.getElementById("picUpload").addEventListener("change", function (e) {

        const file   = e.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function () {
          avatarBase64 = reader.result;
            document.getElementById("avatarImg").src = reader.result;
        };
        reader.readAsDataURL(file);

      
    });
    document.querySelectorAll('.onboard-btn').forEach(btn => {
      btn.addEventListener('click', () => btn.classList.toggle('selected'));
    });

      async function finishSignup() {
        const btn = document.getElementById("finishBtn");
        btn.disabled    = true;
        btn.textContent = "Creating account…";

        //gets all info from forms and uploads to database 
        //possibly adding location? if implementing nearby pickups
        try {
          await signUp({
            username:     document.getElementById("username").value.trim().toLowerCase(),
            email:        document.getElementById("registeredEmail").value.trim(),

            password:     document.getElementById("registeredPassword").value,
            fullName:     document.getElementById("fullName").value.trim(),
            bio:          document.getElementById("bio").value.trim(),
            avatarBase64: avatarBase64
          });

          showMsg(
            "Account created! Check your email to confirm, then log in.",
            "success"
          );

          showMsg("Account created! Choose your interests below.", "success");
        document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
        document.getElementById("step3").classList.add("active");

        } catch (err) {
          showMsg(err.message);
          btn.disabled    = false;
          btn.textContent = "Finish & Go to Marketplace";
        }
      }

      async function submitInterests() {
        const selected = [...document.querySelectorAll('.onboard-btn.selected')].map(b => b.dataset.category);
        if (selected.length > 0) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
            for (const category of selected) {
                await window.supabase
                .from('user_category_likes')
                .upsert(
                { user_id: user.id, category: category, like_count: 3 },
                { onConflict: 'user_id,category', ignoreDuplicates: false }
              );
          }
        }
      }
      window.location.href = "login.html";
    }

    function skipInterests() {
      window.location.href = "login.html";
    }