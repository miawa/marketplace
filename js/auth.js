
//supabase uses alot of its own functions for authenticating , so for now this file is just calling those
//EXTENSION IDEA:  create your own backend functions for authentication and call these. 
//its difficult to implement both (as i had written before) as it clashes. you either generally use their functions or completely your own 


// Sign up as a new user, takes basic user information and adds to supabase table
async function signUp({ username, email, password, fullName, bio, avatarBase64 }) {

  const { data: authData, error: authError } =
    await window.supabase.auth.signUp({ email, password });
    //in supabase this table isn't in public schema its in the AUTH schema, as it says in the call. this information 
    //then links to the public table containing users (and their table containing users) 
    //so for example, emails are saved in auth / auth users, and usernames bios etc are in the public users table

  if (authError) throw authError;

  const userId = authData.user.id;

 
  let avatarUrl = null;
  if (avatarBase64) {
    const blob      = base64ToBlob(avatarBase64);
    const filePath  = `${userId}/avatar.jpg`;
    const { error: uploadError } = await window.supabase.storage
      .from("avatars")
      .upload(filePath, blob, { contentType: "image/jpeg", upsert: true });
      //checking upload of image actually has image type

    if (!uploadError) {
      const { data: urlData } = window.supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      avatarUrl = urlData.publicUrl;
    }
  }

  
  const { error: profileError } = await window.supabase
    .from("users")
    .insert({
      id:         userId,
      username:   username.trim().toLowerCase(),
      full_name:  fullName,
      bio:        bio,
      avatar_url: avatarUrl
    });

  if (profileError) throw profileError;

  return authData;
}

// Attempts to authorise a user and returns user data
async function logIn(email, password) {
  const { data, error } = await window.supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Logs out current user and redirects to login page
async function logOut() {
  const { error } = await window.supabase.auth.signOut();
  if (error) throw error;
  window.location.href = "login.html";
}

// Gets session for current user and returns it if applicable
async function getSession() {
  const { data } = await window.supabase.auth.getSession();
  return data.session;
}

// Gets the currently signed in user and returns their data
async function getCurrentUser() {
  const { data } = await window.supabase.auth.getUser();
  return data.user ?? null;
}

// Function to require authorisation to access a page. Redirects to login page if no authorisation
async function requireAuth(redirectTo = "login.html") {
  const session = await getSession();
  if (!session) {
    window.location.href = redirectTo;
  }
  return session;
}

//basic base44 to blob function
//basically converts string to blob which is a file type to be uploaded to supabase. it also creates a file path/fixes url 
function base64ToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(",");
  const mime  = header.match(/:(.*?);/)[1];
  const bytes = atob(base64);
  const buf   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
  return new Blob([buf], { type: mime });
}
