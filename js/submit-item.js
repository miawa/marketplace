const msgEl = document.getElementById("msg");
        const btnEl = document.getElementById("submitBtn");
        const formEl = document.getElementById("itemForm");

        //for error and success messages
        function showMsg(text, type = "error") {
            msgEl.textContent = text;
            msgEl.className = "msg " + type;
        }

        //checks user authenticated
        async function checkAuth() {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (!user) {
                showMsg("You must be logged in to submit an item. Redirecting to login...");
                setTimeout(() => window.location.href = "login.html", 2000);
                return null;
            }
            return user;
        }

        //form submittion
        formEl.addEventListener("submit", async (e) => {
            e.preventDefault();
            btnEl.disabled = true;
            showMsg("");

            const user = await checkAuth();
            if (!user) return;

            const title = document.getElementById("title").value.trim();
            const description = document.getElementById("description").value.trim();
            const price = parseFloat(document.getElementById("price").value);
            const brand = document.getElementById("brand").value.trim() || "No Brand";
            const size = document.getElementById("size").value.trim() || "One Size";
            const condition = document.getElementById("condition").value;
            const category = document.getElementById("category").value;

            if (!title || !price || !condition || !category) {
                showMsg("Please fill in all required fields.");
                btnEl.disabled = false;
                return;
            }

            try {
                const { data, error } = await window.supabase
                    .from("items")
                    .insert({
                        seller_id: user.id,
                        title,
                        description: description || null,
                        price,
                        brand,
                        size,
                        condition,
                        category,
                        is_sold: false
                    });

                if (error) throw error;

                showMsg("Item submitted successfully!", "success");
                formEl.reset();
                // Reset defaults
                document.getElementById("brand").value = "No Brand";
                document.getElementById("size").value = "One Size";

            } catch (err) {
                console.error("Error submitting item:", err);
                showMsg("Error submitting item: " + err.message);
            } finally {
                btnEl.disabled = false;
            }
        });

        // check auth again on page load
        //pleases dont remove
        checkAuth();