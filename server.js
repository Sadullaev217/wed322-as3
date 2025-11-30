/******************************************************************************** 
*  WEB322 – Assignment 3
*  I declare that this assignment is my own work in accordance with Seneca's 
*  Academic Integrity Policy: 
*  https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html 
*  
*  Name: Sadulloev Shokhjakhon
*  Student ID: 122850241
*  Date: November 30, 2025
*  Published URL: https://wed322-as3.vercel.app     <--- CHANGE THIS TO YOUR LIVE LINK
********************************************************************************/

const express = require('express');
const path = require('path');
const session = require('express-session');
const projectService = require("./modules/projects");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: "web322-a3-secret-2025",
    resave: false,
    saveUninitialized: false
}));

// ========== Login / Logout ==========
app.get("/login", (req, res) => {
    res.render("login", { error: null });
});

app.post("/login", (req, res) => {
    if (req.body.user === "admin" && req.body.password === "admin") {
        req.session.user = "admin";
        res.redirect("/solutions/projects");
    } else {
        res.render("login", { error: "Wrong credentials → use admin / admin" });
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

const ensureLogin = (req, res, next) => {
    req.session.user ? next() : res.redirect("/login");
};

// ========== Routes ==========
app.get("/", ensureLogin, (req, res) => {
    res.redirect("/solutions/projects");
});

app.get("/solutions/projects", ensureLogin, (req, res) => {
    projectService.getAllProjects()
        .then(projects => res.render("projects", { 
            projects, 
            currentSector: null   // ← this prevents the error
        }))
        .catch(err => res.render("500", { message: err.message || err }));
});

app.get("/solutions/project/:id", ensureLogin, (req, res) => {
    projectService.getProjectById(req.params.id)
        .then(project => res.render("project", { project }))
        .catch(() => res.render("404"));
});

app.get("/solutions/sector/:name", ensureLogin, (req, res) => {
    projectService.getProjectsBySector(req.params.name)
        .then(projects => res.render("projects", { 
            projects, 
            currentSector: req.params.name   // ← pass the sector name
        }))
        .catch(() => res.render("404"));
});
// EDIT PROJECT - GET form
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
    Promise.all([
        projectService.getProjectById(req.params.id),
        projectService.getAllSectors()
    ])
    .then(([project, sectors]) => {
        res.render("editProject", { project, sectors });
    })
    .catch(err => res.render("500", { message: err.message || err }));
});

// EDIT PROJECT - POST update
app.post("/solutions/editProject", ensureLogin, (req, res) => {
    const { id, ...data } = req.body;
    const projectData = {
        ...data,
        sector_id: parseInt(data.sector_id, 10)
    };
    projectService.updateProject(id, projectData)
        .then(() => res.redirect("/solutions/projects"))
        .catch(err => res.render("500", { message: err.message || "Update failed" }));
});

// DELETE PROJECT
app.get("/solutions/deleteProject/:id", ensureLogin, (req, res) => {
    projectService.deleteProject(req.params.id)
        .then(() => res.redirect("/solutions/projects"))
        .catch(err => res.render("500", { message: err.message || "Delete failed" }));
});
// Add Project
app.get("/solutions/addProject", ensureLogin, (req, res) => {
    projectService.getAllSectors()
        .then(sectors => res.render("addProject", { sectors }))
        .catch(err => res.render("500", { message: err.message }));
});

app.post("/solutions/addProject", ensureLogin, (req, res) => {
    const projectData = {
        ...req.body,
        sector_id: parseInt(req.body.sector_id, 10)   // ← CRITICAL FIX
    };
    projectService.addProject(projectData)
        .then(() => res.redirect("/solutions/projects"))
        .catch(err => res.render("500", { message: err.message || "Failed to add project" }));
});

// Edit Project
app.get("/solutions/editProject/:id", ensureLogin, (req, res) => {
    Promise.all([
        projectService.getProjectById(req.params.id),
        projectService.getAllSectors()
    ])
    .then(([project, sectors]) => {
        res.render("editProject", { project, sectors });
    })
    .catch(err => res.render("500", { message: err.message }));
});

app.post("/solutions/editProject", ensureLogin, (req, res) => {
    const { id, ...data } = req.body;
    const projectData = {
        ...data,
        sector_id: parseInt(data.sector_id, 10)   // ← ALSO FIXED HERE
    };
    projectService.updateProject(id, projectData)
        .then(() => res.redirect("/solutions/projects"))
        .catch(err => res.render("500", { message: err.message || "Failed to update" }));
});

// Delete Project
app.get("/solutions/projects", ensureLogin, (req, res) => {
    projectService.getAllProjects()
        .then(projects => res.render("projects", { 
            projects, 
            currentSector: null   // ← this fixes the error
        }))
        .catch(err => res.render("500", { message: err.message || err }));
});

// 404
app.use((req, res) => {
    res.status(404).render("404");
});

// ========== Start Server ==========
projectService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server running → http://localhost:${HTTP_PORT}`);
            console.log(`Login → http://localhost:${HTTP_PORT}/login (admin / admin)`);
        });
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });