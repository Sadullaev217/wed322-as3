/******************************************************************************** 
*  WEB322 – Assignment 3
*  I declare that this assignment is my own work in accordance with Seneca's 
*  Academic Integrity Policy: 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html 
*  
*  Name: Sadulloev Shokhjakhon
*  Student ID: 122850241
*  Date: November 30, 2025
*  Published URL: (will update after Vercel deploy)
********************************************************************************/

const express = require('express');
const path = require('path');
const session = require('express-session');
const projectService = require("./modules/projects");   // correct name

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));           // for form POSTs
app.use(session({
    secret: "web322-a3-secret",
    resave: false,
    saveUninitialized: false
}));

// ---------- Login / Logout ----------
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", (req, res) => {
    if (req.body.user === "admin" && req.body.password === "admin") {
        req.session.user = "admin";
        res.redirect("/solutions/projects");
    } else {
        res.render("login", { error: "Invalid credentials – use admin / admin" });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

const ensureLogin = (req, res, next) => {
    req.session.user ? next() : res.redirect("/login");
};

// ---------- Routes ----------
app.get("/", ensureLogin, (req, res) => {
    res.redirect("/solutions/projects");
});

app.get("/solutions/projects", ensureLogin, (req, res) => {
    projectService.getAllProjects()
        .then(projects => res.render("projects", { projects }))
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
    projectService.addProject(req.body)
        .then(() => res.redirect("/solutions/projects"))
        .catch(err => res.render("500", { message: err.message || err }));
});

// Edit Project
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
    Promise.all([
        projectService.getProjectById(req.params.id),
        projectService.getAllSectors()
    ]).then(([project, sectors]) => {
        res.render("editProject", { project, sectors });
    }).catch(err => res.render("500", { message: err }));
});

app.post("/solutions/editProject", ensureLogin, (req, res) => {
    const { id, ...data } = req.body;
    projectService.updateProject(id, data)
        .then(() => res.redirect("/solutions/projects"))
        .catch(err => res.render("500", { message: err.message || err }));
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

// ---------- Start Server ----------
projectService.initialize()          // correct function name (lowercase i)
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server running on http://localhost:${HTTP_PORT}`);
            console.log(`Login at http://localhost:${HTTP_PORT}/login (admin / admin)`);
        });
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });