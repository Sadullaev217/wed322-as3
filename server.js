/******************************************************************************** 
*  WEB322 – Assignment 3
*  I declare that this assignment is my own work in accordance with Seneca's 
*  Academic Integrity Policy: 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html 
*  
*  Name: Sadulloev Shokhjakhon
*  Student ID: 122850241
*  Date: November 30, 2025
*  Published URL: https://wed322-as3.vercel.app     <--- CHANGE THIS LATER
********************************************************************************/

require('dotenv').config();
const express = require('express');
const path = require('path');
const clientSessions = require('client-sessions');  // ← CORRECT name
const projectService = require("./modules/projects");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// === SECURE SESSION (client-sessions) ===
app.use(clientSessions({
  cookieName: 'session',
  secret: process.env.SESSIONSECRET,
  duration: 30 * 60 * 1000,        // 30 minutes
  activeDuration: 5 * 60 * 1000    // +5 min if active
}));

// Make session available in all views
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// === Login / Logout ===
app.get("/login", (req, res) => {
  res.render("login", { errorMessage: null });
});

app.post("/login", (req, res) => {
  if (req.body.userName === process.env.ADMINUSER && req.body.password === process.env.ADMINPASSWORD) {
    req.session.user = { userName: req.body.userName };
    res.redirect("/solutions/projects");
  } else {
    res.render("login", { errorMessage: "Invalid credentials – use admin / admin" });
  }
});

app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/login");
});

// === Protect all routes ===
const ensureLogin = (req, res, next) => {
  req.session.user ? next() : res.redirect("/login");
};

// === Routes ===
app.get("/", ensureLogin, (req, res) => res.redirect("/solutions/projects"));

app.get("/solutions/projects", ensureLogin, (req, res) => {
  projectService.getAllProjects()
    .then(projects => res.render("projects", { projects, currentSector: null }))
    .catch(err => res.render("500", { message: err }));
});

app.get("/solutions/project/:id", ensureLogin, (req, res) => {
  projectService.getProjectById(req.params.id)
    .then(project => res.render("project", { project }))
    .catch(() => res.render("404"));
});

app.get("/solutions/sector/:name", ensureLogin, (req, res) => {
  projectService.getProjectsBySector(req.params.name)
    .then(projects => res.render("projects", { projects, currentSector: req.params.name }))
    .catch(() => res.render("404"));
});

// Add Project
app.get("/solutions/addProject", ensureLogin, (req, res) => {
  projectService.getAllSectors()
    .then(sectors => res.render("addProject", { sectors }))
    .catch(err => res.render("500", { message: err }));
});

app.post("/solutions/addProject", ensureLogin, (req, res) => {
  const projectData = {
    ...req.body,
    sector_id: parseInt(req.body.sector_id, 10)
  };
  projectService.addProject(projectData)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => res.render("500", { message: err }));
});

// Edit Project
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
  Promise.all([
    projectService.getProjectById(req.params.id),
    projectService.getAllSectors()
  ])
  .then(([project, sectors]) => res.render("editProject", { project, sectors }))
  .catch(err => res.render("500", { message: err }));
});

app.post("/solutions/editProject", ensureLogin, (req, res) => {
  const { id, ...data } = req.body;
  const projectData = {
    ...data,
    sector_id: parseInt(data.sector_id, 10)
  };
  projectService.updateProject(id, projectData)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => res.render("500", { message: err }));
});

// Delete Project
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
  projectService.deleteProject(req.params.id)
    .then(() => res.redirect("/solutions/projects"))
    .catch(err => res.render("500", { message: err }));
});

// 404
app.use((req, res) => {
  res.status(404).render("404");
});

// Start server
projectService.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log(`Server running on http://localhost:${HTTP_PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to connect to database:", err);
  });